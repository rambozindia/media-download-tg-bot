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
        // Try rapid API method first (if configured)
        if (process.env.RAPIDAPI_KEY) {
          mediaData = await this.downloadWithRapidAPI(url);
        } else {
          throw new Error("RapidAPI key not configured");
        }
      } catch (error) {
        logger.warn("RapidAPI method failed, trying scraping method");
        
        try {
          // Fallback to web scraping
          mediaData = await this.downloadWithScraping(url);
        } catch (scrapingError) {
          logger.warn("Web scraping failed, trying alternative method");
          // Try alternative simple method
          mediaData = await this.downloadWithSimpleMethod(url);
        }
      }

      if (!mediaData) {
        // If all download methods fail, return helpful information instead
        return {
          success: false,
          error: "Instagram_Protection_Detected",
          fallbackMessage: `🔗 **Instagram Link Detected!**

📱 **Original URL:** ${url}

⚠️ Instagram has strong anti-bot protections that prevent automated downloads.

**💡 How to download manually:**
1. Open the link in your browser
2. Right-click on the video/image
3. Select "Save video as..." or "Save image as..."

**🔄 Alternative options:**
• Try using a browser extension
• Use Instagram's "Save" feature
• Share to other apps from Instagram directly

**Note:** This protection helps keep Instagram secure! 🛡️`
        };
      }

      // Download the media file
      const fileName = `instagram_${userId}_${Date.now()}.${
        mediaData.type === "video" ? "mp4" : "jpg"
      }`;
      const filePath = path.join(this.downloadsDir, fileName);

      try {
        await this.downloadFile(mediaData.mediaURL, filePath);

        // Verify file was downloaded successfully
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
          await fs.remove(filePath);
          throw new Error("Downloaded file is empty");
        }

        logger.info(`Successfully downloaded Instagram media: ${mediaData.type}, size: ${Math.round(stats.size / 1024)}KB`);

        return {
          success: true,
          type: mediaData.type,
          filePath: filePath,
          caption: mediaData.caption || "Downloaded from Instagram",
        };
      } catch (downloadError) {
        // If download fails due to 403 or similar, provide helpful fallback
        logger.warn(`Download blocked by Instagram: ${downloadError.message}`);
        
        return {
          success: false,
          error: "Instagram_Download_Blocked",
          fallbackMessage: `🔗 **Instagram Media Found!**

📱 **Direct Link:** ${mediaData.mediaURL}

❌ **Download blocked by Instagram's protection**

**💡 You can still access the media:**
1. Click the link above to view
2. Long-press on mobile to save
3. Right-click on desktop to save

**🎯 Media Info:**
• Type: ${mediaData.type}
• Caption: ${mediaData.caption || 'No caption'}

Instagram protects content from automated downloads, but you can still save it manually! 📥`
        };
      }
    } catch (error) {
      logger.error(`Instagram download error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  isValidInstagramURL(url) {
    const instagramRegexes = [
      /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/,
      /^https?:\/\/(www\.)?instagram\.com\/stories\/[A-Za-z0-9_.]+\/\d+/
    ];
    
    return instagramRegexes.some(regex => regex.test(url));
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
      // Clean the URL first
      const cleanUrl = this.cleanInstagramURL(url);
      logger.info(`Cleaned Instagram URL: ${cleanUrl}`);

      // Launch puppeteer browser with better settings
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-blink-features=AutomationControlled",
          "--no-first-run",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-images"
        ],
      });

      const page = await browser.newPage();

      // Set better user agent and viewport
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      await page.setViewport({ width: 1366, height: 768 });

      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      // Navigate to Instagram post
      logger.info(`Navigating to: ${cleanUrl}`);
      await page.goto(cleanUrl, { 
        waitUntil: "domcontentloaded", 
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForTimeout(5000);

      // First try to get media from meta tags (more reliable)
      let mediaData = await page.evaluate(() => {
        // Check for video meta tags first
        const videoMetaUrl = document.querySelector('meta[property="og:video:url"]');
        const videoMeta = document.querySelector('meta[property="og:video"]');
        const imageMetaUrl = document.querySelector('meta[property="og:image"]');
        
        if (videoMetaUrl && videoMetaUrl.content) {
          return {
            mediaURL: videoMetaUrl.content,
            type: "video",
            caption: document.querySelector('meta[property="og:description"]')?.content || 
                    document.querySelector('meta[name="description"]')?.content || ""
          };
        }
        
        if (videoMeta && videoMeta.content) {
          return {
            mediaURL: videoMeta.content,
            type: "video",
            caption: document.querySelector('meta[property="og:description"]')?.content || 
                    document.querySelector('meta[name="description"]')?.content || ""
          };
        }
        
        if (imageMetaUrl && imageMetaUrl.content && !imageMetaUrl.content.includes('avatar') && !imageMetaUrl.content.includes('profile')) {
          return {
            mediaURL: imageMetaUrl.content,
            type: "image",
            caption: document.querySelector('meta[property="og:description"]')?.content || 
                    document.querySelector('meta[name="description"]')?.content || ""
          };
        }
        
        return null;
      });

      // If meta tags didn't work, try DOM scraping
      if (!mediaData) {
        logger.info('Meta tags failed, trying DOM scraping...');
        
        mediaData = await page.evaluate(() => {
          // Look for video elements with more specific selectors
          const videoSelectors = [
            'video[src]',
            'video source[src]',
            '[role="button"] video',
            'article video',
            'div[style*="video"] video'
          ];
          
          for (const selector of videoSelectors) {
            const videoElement = document.querySelector(selector);
            if (videoElement) {
              const src = videoElement.src || (videoElement.querySelector('source') && videoElement.querySelector('source').src);
              if (src && !src.includes('blob:')) {
                return {
                  mediaURL: src,
                  type: "video",
                  caption: this.extractCaption()
                };
              }
            }
          }

          // Look for image elements with better selectors
          const imageSelectors = [
            'article img[src*="cdninstagram"]',
            'article img[src*="fbcdn"]',
            'div[role="button"] img[src*="cdninstagram"]',
            'img[src*="cdninstagram"]:not([src*="avatar"]):not([src*="profile"])',
            'img[sizes][src*="instagram"]'
          ];
          
          for (const selector of imageSelectors) {
            const imageElement = document.querySelector(selector);
            if (imageElement && imageElement.src && 
                !imageElement.src.includes('avatar') && 
                !imageElement.src.includes('profile') &&
                imageElement.naturalWidth > 100) {
              return {
                mediaURL: imageElement.src,
                type: "image",
                caption: this.extractCaption()
              };
            }
          }

          return null;
        });
      }

      // If still no media found, try alternative approach
      if (!mediaData) {
        logger.info('DOM scraping failed, trying alternative method...');
        
        // Try to find JSON data in page scripts
        mediaData = await page.evaluate(() => {
          const scripts = document.querySelectorAll('script');
          
          for (const script of scripts) {
            if (script.textContent && script.textContent.includes('video_url')) {
              try {
                const match = script.textContent.match(/"video_url":"([^"]+)"/);
                if (match) {
                  return {
                    mediaURL: match[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
                    type: "video",
                    caption: "Instagram Reel"
                  };
                }
              } catch (e) {
                continue;
              }
            }
            
            if (script.textContent && script.textContent.includes('display_url')) {
              try {
                const match = script.textContent.match(/"display_url":"([^"]+)"/);
                if (match) {
                  return {
                    mediaURL: match[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
                    type: "image",
                    caption: "Instagram Post"
                  };
                }
              } catch (e) {
                continue;
              }
            }
          }
          
          return null;
        });
      }

      if (!mediaData) {
        throw new Error("Could not extract media from Instagram post. The post might be private or the format has changed.");
      }

      logger.info(`Successfully extracted media: ${mediaData.type} - ${mediaData.mediaURL?.substring(0, 100)}...`);
      return mediaData;

    } catch (error) {
      logger.error(`Instagram scraping error: ${error.message}`);
      throw new Error(`Failed to scrape Instagram content: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async downloadWithSimpleMethod(url) {
    try {
      logger.info('Trying simple HTTP method...');
      
      const cleanUrl = this.cleanInstagramURL(url);
      
      // Try to get page content via simple HTTP request
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000
      });

      const html = response.data;
      
      // Try to extract media URLs from HTML
      const videoMatch = html.match(/"video_url":"([^"]+)"/);
      if (videoMatch) {
        return {
          mediaURL: videoMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
          type: "video",
          caption: "Instagram Reel"
        };
      }
      
      const imageMatch = html.match(/"display_url":"([^"]+)"/);
      if (imageMatch) {
        return {
          mediaURL: imageMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
          type: "image", 
          caption: "Instagram Post"
        };
      }
      
      // Try meta tag extraction
      const videoMetaMatch = html.match(/<meta property="og:video:url" content="([^"]+)"/);
      if (videoMetaMatch) {
        return {
          mediaURL: videoMetaMatch[1],
          type: "video",
          caption: "Instagram Reel"
        };
      }
      
      const imageMetaMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
      if (imageMetaMatch && !imageMetaMatch[1].includes('avatar')) {
        return {
          mediaURL: imageMetaMatch[1],
          type: "image",
          caption: "Instagram Post"
        };
      }
      
      throw new Error("No media found in simple method");
      
    } catch (error) {
      logger.error(`Simple method failed: ${error.message}`);
      throw error;
    }
  }

  cleanInstagramURL(url) {
    try {
      const urlObj = new URL(url);
      // Remove utm parameters and other tracking
      urlObj.searchParams.delete('utm_source');
      urlObj.searchParams.delete('utm_medium');
      urlObj.searchParams.delete('utm_campaign');
      urlObj.searchParams.delete('utm_content');
      urlObj.searchParams.delete('igshid');
      
      // Ensure we're using www subdomain
      if (urlObj.hostname === 'instagram.com') {
        urlObj.hostname = 'www.instagram.com';
      }
      
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  async downloadFile(url, filePath) {
    try {
      logger.info(`Downloading file from: ${url.substring(0, 100)}...`);
      
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://www.instagram.com/",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "DNT": "1",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1"
        },
        timeout: 60000, // Increased timeout for large files
        maxRedirects: 5
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          logger.info(`File downloaded successfully: ${filePath}`);
          resolve();
        });
        writer.on("error", (error) => {
          logger.error(`File write error: ${error.message}`);
          reject(error);
        });
        
        // Add timeout for the download
        setTimeout(() => {
          writer.destroy();
          reject(new Error('Download timeout'));
        }, 60000);
      });
    } catch (error) {
      logger.error(`File download error: ${error.message}`);
      throw new Error(`Failed to download media file: ${error.message}`);
    }
  }
}

module.exports = InstagramDownloader;
