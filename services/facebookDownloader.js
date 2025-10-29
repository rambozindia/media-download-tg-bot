const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const puppeteer = require("puppeteer");
const logger = require("../utils/logger");

class FacebookDownloader {
  constructor() {
    this.downloadsDir = path.join(__dirname, "..", "downloads");
    fs.ensureDirSync(this.downloadsDir);
  }

  async download(url, userId) {
    try {
      logger.info(`Starting Facebook download for URL: ${url}`);

      // Validate Facebook URL
      if (!this.isValidFacebookURL(url)) {
        throw new Error("Invalid Facebook URL");
      }

      // Clean the URL to get the standard format
      const cleanedURL = this.cleanFacebookURL(url);

      let mediaData;

      try {
        // Try API method first (if available)
        mediaData = await this.downloadWithAPI(cleanedURL);
      } catch (error) {
        logger.warn("API method failed, trying scraping method");
        // Fallback to web scraping
        mediaData = await this.downloadWithScraping(cleanedURL);
      }

      if (!mediaData) {
        throw new Error("Could not extract media from Facebook post");
      }

      // Download the media file
      const fileName = `facebook_${userId}_${Date.now()}.${
        mediaData.type === "video" ? "mp4" : "jpg"
      }`;
      const filePath = path.join(this.downloadsDir, fileName);

      await this.downloadFile(mediaData.mediaURL, filePath);

      return {
        success: true,
        type: mediaData.type,
        filePath: filePath,
        caption: mediaData.caption || "Downloaded from Facebook",
      };
    } catch (error) {
      logger.error(`Facebook download error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  isValidFacebookURL(url) {
    const facebookRegex =
      /^https?:\/\/(www\.|m\.)?facebook\.com\/.*\/(posts|videos|photo)/;
    const fbRegex = /^https?:\/\/fb\.watch\/[A-Za-z0-9]+/;
    return facebookRegex.test(url) || fbRegex.test(url);
  }

  cleanFacebookURL(url) {
    // Convert mobile URLs to desktop
    url = url.replace("m.facebook.com", "www.facebook.com");

    // Handle fb.watch URLs
    if (url.includes("fb.watch")) {
      return url; // Keep as is, they redirect properly
    }

    // Remove unnecessary parameters
    const urlObj = new URL(url);
    const cleanPath = urlObj.pathname;
    return `https://www.facebook.com${cleanPath}`;
  }

  async downloadWithAPI(url) {
    // Note: This would use a Facebook API or third-party service
    // For demonstration purposes, this is a placeholder
    // In production, you might use services like "Facebook Video Downloader API"

    try {
      // Example using a hypothetical API
      const options = {
        method: "GET",
        url: "https://facebook-video-downloader.p.rapidapi.com/download",
        params: { url: url },
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
          "X-RapidAPI-Host": "facebook-video-downloader.p.rapidapi.com",
        },
      };

      if (!process.env.RAPIDAPI_KEY) {
        throw new Error("RapidAPI key not configured");
      }

      const response = await axios.request(options);

      if (response.data && response.data.download_url) {
        return {
          mediaURL: response.data.download_url,
          type: response.data.type || "video",
          caption: response.data.title || "",
        };
      }

      throw new Error("No media found in API response");
    } catch (error) {
      logger.warn(`Facebook API download failed: ${error.message}`);
      throw error;
    }
  }

  async downloadWithScraping(url) {
    let browser;

    try {
      // Launch puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
      });

      const page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });

      // Navigate to Facebook post
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

      // Wait for content to load
      await page.waitForTimeout(5000);

      // Handle login prompt (if appears)
      try {
        const loginButton = await page.$(
          '[data-testid="cookie-policy-dialog-accept-button"]'
        );
        if (loginButton) {
          await loginButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        // Ignore if no cookie dialog
      }

      // Extract media data from the page
      const mediaData = await page.evaluate(() => {
        // Look for video element
        const videoElement = document.querySelector("video[src]");
        if (videoElement && videoElement.src) {
          return {
            mediaURL: videoElement.src,
            type: "video",
            caption:
              document.querySelector('[data-ad-preview="message"]')
                ?.innerText ||
              document.querySelector('[data-testid="post_message"]')
                ?.innerText ||
              "",
          };
        }

        // Look for image element
        const imageElement =
          document.querySelector('img[src*="scontent"]') ||
          document.querySelector('img[data-testid="photo"]') ||
          document.querySelector('[role="img"] img');

        if (
          imageElement &&
          imageElement.src &&
          !imageElement.src.includes("profile")
        ) {
          return {
            mediaURL: imageElement.src,
            type: "image",
            caption:
              document.querySelector('[data-ad-preview="message"]')
                ?.innerText ||
              document.querySelector('[data-testid="post_message"]')
                ?.innerText ||
              "",
          };
        }

        return null;
      });

      if (!mediaData) {
        // Try alternative method - look for meta tags
        const metaData = await page.evaluate(() => {
          const videoMeta =
            document.querySelector('meta[property="og:video:url"]') ||
            document.querySelector('meta[property="og:video"]');
          const imageMeta = document.querySelector('meta[property="og:image"]');

          if (videoMeta) {
            return {
              mediaURL: videoMeta.content,
              type: "video",
              caption:
                document.querySelector('meta[property="og:description"]')
                  ?.content || "",
            };
          }

          if (imageMeta && !imageMeta.content.includes("logo")) {
            return {
              mediaURL: imageMeta.content,
              type: "image",
              caption:
                document.querySelector('meta[property="og:description"]')
                  ?.content || "",
            };
          }

          return null;
        });

        if (metaData) {
          return metaData;
        }
      }

      return mediaData;
    } catch (error) {
      logger.error(`Facebook scraping error: ${error.message}`);
      throw new Error("Failed to scrape Facebook content");
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async downloadFile(url, filePath) {
    try {
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.facebook.com/",
        },
        timeout: 30000,
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    } catch (error) {
      logger.error(`Facebook file download error: ${error.message}`);
      throw new Error("Failed to download media file");
    }
  }
}

module.exports = FacebookDownloader;
