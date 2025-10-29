const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const puppeteer = require("puppeteer");
const logger = require("../utils/logger");

class LinkedInDownloader {
  constructor() {
    this.downloadsDir = path.join(__dirname, "..", "downloads");
    fs.ensureDirSync(this.downloadsDir);
  }

  async download(url, userId) {
    try {
      logger.info(`Starting LinkedIn download for URL: ${url}`);

      // Validate LinkedIn URL
      if (!this.isValidLinkedInURL(url)) {
        throw new Error("Invalid LinkedIn URL");
      }

      // Clean the URL
      const cleanedURL = this.cleanLinkedInURL(url);

      let mediaData;

      try {
        // Try scraping method (LinkedIn doesn't have public APIs for this)
        mediaData = await this.downloadWithScraping(cleanedURL);
      } catch (error) {
        logger.warn("Scraping method failed, trying alternative approach");
        // Try alternative scraping method
        mediaData = await this.downloadWithAlternativeScraping(cleanedURL);
      }

      if (!mediaData) {
        throw new Error("Could not extract media from LinkedIn post");
      }

      // Download the media file
      const fileName = `linkedin_${userId}_${Date.now()}.${
        mediaData.type === "video" ? "mp4" : "jpg"
      }`;
      const filePath = path.join(this.downloadsDir, fileName);

      await this.downloadFile(mediaData.mediaURL, filePath);

      return {
        success: true,
        type: mediaData.type,
        filePath: filePath,
        caption: mediaData.caption || "Downloaded from LinkedIn",
      };
    } catch (error) {
      logger.error(`LinkedIn download error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  isValidLinkedInURL(url) {
    const linkedinRegex =
      /^https?:\/\/(www\.)?linkedin\.com\/(posts|feed)\/[A-Za-z0-9_-]+/;
    return linkedinRegex.test(url);
  }

  cleanLinkedInURL(url) {
    // Ensure we're using the desktop version
    url = url.replace("m.linkedin.com", "www.linkedin.com");

    // Remove tracking parameters
    const urlObj = new URL(url);
    urlObj.search = ""; // Remove all query parameters

    return urlObj.toString();
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
          "--disable-blink-features=AutomationControlled",
        ],
      });

      const page = await browser.newPage();

      // Set user agent to avoid detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });

      // Navigate to LinkedIn post
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

      // Wait for content to load
      await page.waitForTimeout(5000);

      // Handle cookie consent if present
      try {
        const cookieButton = await page.$('button[action-type="ACCEPT"]');
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        // Ignore if no cookie dialog
      }

      // Extract media data from the page
      const mediaData = await page.evaluate(() => {
        // Look for video element
        const videoElement =
          document.querySelector("video[src]") ||
          document.querySelector("video source[src]") ||
          document.querySelector('[data-test-id="video-player"] video');

        if (videoElement) {
          const videoSrc =
            videoElement.src ||
            (videoElement.querySelector("source") &&
              videoElement.querySelector("source").src);
          if (videoSrc) {
            return {
              mediaURL: videoSrc,
              type: "video",
              caption:
                document.querySelector(".feed-shared-text")?.innerText ||
                document.querySelector(
                  '[data-test-id="main-feed-activity-card"] .break-words'
                )?.innerText ||
                "",
            };
          }
        }

        // Look for image element
        const imageElement =
          document.querySelector(".feed-shared-image img") ||
          document.querySelector('[data-test-id="feed-images-hook"] img') ||
          document.querySelector(".feed-shared-article img");

        if (
          imageElement &&
          imageElement.src &&
          !imageElement.src.includes("profile")
        ) {
          return {
            mediaURL: imageElement.src,
            type: "image",
            caption:
              document.querySelector(".feed-shared-text")?.innerText ||
              document.querySelector(
                '[data-test-id="main-feed-activity-card"] .break-words'
              )?.innerText ||
              "",
          };
        }

        return null;
      });

      if (!mediaData) {
        // Try meta tags approach
        const metaData = await page.evaluate(() => {
          const videoMeta =
            document.querySelector('meta[property="og:video:url"]') ||
            document.querySelector('meta[property="og:video"]');
          const imageMeta = document.querySelector('meta[property="og:image"]');

          if (videoMeta && videoMeta.content) {
            return {
              mediaURL: videoMeta.content,
              type: "video",
              caption:
                document.querySelector('meta[property="og:description"]')
                  ?.content || "",
            };
          }

          if (
            imageMeta &&
            imageMeta.content &&
            !imageMeta.content.includes("logo")
          ) {
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
      logger.error(`LinkedIn scraping error: ${error.message}`);
      throw new Error("Failed to scrape LinkedIn content");
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async downloadWithAlternativeScraping(url) {
    let browser;

    try {
      // Use a different approach - try to get the page without login
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
        ],
      });

      const page = await browser.newPage();

      // Set different user agent
      await page.setUserAgent(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
      );

      // Navigate to the URL
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

      // Wait briefly
      await page.waitForTimeout(3000);

      // Try to extract from JSON-LD structured data
      const structuredData = await page.evaluate(() => {
        const scripts = document.querySelectorAll(
          'script[type="application/ld+json"]'
        );

        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);

            if (data.image && data.image.url) {
              return {
                mediaURL: data.image.url,
                type: "image",
                caption: data.description || data.name || "",
              };
            }

            if (data.video && data.video.contentUrl) {
              return {
                mediaURL: data.video.contentUrl,
                type: "video",
                caption: data.description || data.name || "",
              };
            }
          } catch (e) {
            continue;
          }
        }

        return null;
      });

      if (structuredData) {
        return structuredData;
      }

      // Fallback to simple meta tag extraction
      const simpleMetaData = await page.evaluate(() => {
        const imageMeta = document.querySelector('meta[property="og:image"]');

        if (imageMeta && imageMeta.content) {
          return {
            mediaURL: imageMeta.content,
            type: "image",
            caption:
              document.querySelector('meta[property="og:description"]')
                ?.content || "LinkedIn Post",
          };
        }

        return null;
      });

      return simpleMetaData;
    } catch (error) {
      logger.error(`LinkedIn alternative scraping error: ${error.message}`);
      throw new Error("Failed to extract content from LinkedIn");
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
          Referer: "https://www.linkedin.com/",
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
      logger.error(`LinkedIn file download error: ${error.message}`);
      throw new Error("Failed to download media file");
    }
  }
}

module.exports = LinkedInDownloader;
