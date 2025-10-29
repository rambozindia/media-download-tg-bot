const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const puppeteer = require("puppeteer");
const logger = require("../utils/logger");

class InstagramDownloader {
  constructor() {
    this.downloadsDir = path.join(__dirname, "..", "downloads");
    fs.ensureDirSync(this.downloadsDir);
  }

  async download(url, userId) {
    try {
      logger.info(`Starting Instagram download for URL: ${url}`);

      // Validate Instagram URL
      if (!this.isValidInstagramURL(url)) {
        throw new Error("Invalid Instagram URL");
      }

      // Extract media using different methods
      let mediaData;

      try {
        // Try rapid API method first
        mediaData = await this.downloadWithRapidAPI(url);
      } catch (error) {
        logger.warn("RapidAPI method failed, trying scraping method");
        // Fallback to web scraping
        mediaData = await this.downloadWithScraping(url);
      }

      if (!mediaData) {
        throw new Error("Could not extract media from Instagram post");
      }

      // Download the media file
      const fileName = `instagram_${userId}_${Date.now()}.${
        mediaData.type === "video" ? "mp4" : "jpg"
      }`;
      const filePath = path.join(this.downloadsDir, fileName);

      await this.downloadFile(mediaData.mediaURL, filePath);

      return {
        success: true,
        type: mediaData.type,
        filePath: filePath,
        caption: mediaData.caption || "Downloaded from Instagram",
      };
    } catch (error) {
      logger.error(`Instagram download error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  isValidInstagramURL(url) {
    const instagramRegex =
      /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/;
    return instagramRegex.test(url);
  }

  async downloadWithRapidAPI(url) {
    // Note: This requires a RapidAPI key for Instagram API
    // For demonstration, we'll use a mock implementation
    // In production, you'd use a service like "Instagram Downloader API" from RapidAPI

    try {
      const options = {
        method: "GET",
        url: "https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index",
        params: { url: url },
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
          "X-RapidAPI-Host":
            "instagram-downloader-download-instagram-videos-stories.p.rapidapi.com",
        },
      };

      if (!process.env.RAPIDAPI_KEY) {
        throw new Error("RapidAPI key not configured");
      }

      const response = await axios.request(options);

      if (response.data && response.data.media) {
        return {
          mediaURL: response.data.media[0].url,
          type: response.data.media[0].type,
          caption: response.data.caption,
        };
      }

      throw new Error("No media found in API response");
    } catch (error) {
      logger.warn(`RapidAPI Instagram download failed: ${error.message}`);
      throw error;
    }
  }

  async downloadWithScraping(url) {
    let browser;

    try {
      // Launch puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // Set user agent to avoid bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Navigate to Instagram post
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

      // Wait for content to load
      await page.waitForTimeout(3000);

      // Extract media data from the page
      const mediaData = await page.evaluate(() => {
        // Look for video element first
        const videoElement = document.querySelector("video");
        if (videoElement && videoElement.src) {
          return {
            mediaURL: videoElement.src,
            type: "video",
            caption:
              document.querySelector('[data-testid="post-text"]')?.innerText ||
              "",
          };
        }

        // Look for image element
        const imageElement =
          document.querySelector('img[alt*="Photo"]') ||
          document.querySelector('img[style*="object-fit"]') ||
          document.querySelector("article img");

        if (
          imageElement &&
          imageElement.src &&
          !imageElement.src.includes("avatar")
        ) {
          return {
            mediaURL: imageElement.src,
            type: "image",
            caption:
              document.querySelector('[data-testid="post-text"]')?.innerText ||
              "",
          };
        }

        return null;
      });

      if (!mediaData) {
        // Try alternative scraping method - look for meta tags
        const metaData = await page.evaluate(() => {
          const videoMeta = document.querySelector('meta[property="og:video"]');
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

          if (imageMeta) {
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
      logger.error(`Instagram scraping error: ${error.message}`);
      throw new Error("Failed to scrape Instagram content");
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
        },
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    } catch (error) {
      logger.error(`File download error: ${error.message}`);
      throw new Error("Failed to download media file");
    }
  }
}

module.exports = InstagramDownloader;
