const validator = require("validator");

class URLParser {
  constructor() {
    this.platforms = {
      instagram: {
        patterns: [
          /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/,
          /^https?:\/\/(www\.)?instagram\.com\/stories\/[A-Za-z0-9_.]+\/\d+/,
        ],
        name: "Instagram",
      },
      facebook: {
        patterns: [
          /^https?:\/\/(www\.|m\.)?facebook\.com\/.*\/(posts|videos|photo)/,
          /^https?:\/\/fb\.watch\/[A-Za-z0-9]+/,
          /^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9.]+\/videos\/\d+/,
          /^https?:\/\/(www\.)?facebook\.com\/photo\.php\?fbid=/,
        ],
        name: "Facebook",
      },
      linkedin: {
        patterns: [
          /^https?:\/\/(www\.)?linkedin\.com\/(posts|feed)\/[A-Za-z0-9_-]+/,
          /^https?:\/\/(www\.)?linkedin\.com\/pulse\/[A-Za-z0-9_-]+/,
        ],
        name: "LinkedIn",
      },
    };
  }

  parseURL(text) {
    // Extract URLs from text
    const urls = this.extractURLs(text);

    if (urls.length === 0) {
      return {
        isValid: false,
        error: "No URLs found in the message",
      };
    }

    // Check each URL against platform patterns
    for (const url of urls) {
      const platformResult = this.identifyPlatform(url);

      if (platformResult.isValid) {
        return {
          isValid: true,
          url: url,
          platform: platformResult.platform,
          platformName: platformResult.platformName,
          cleanURL: this.cleanURL(url, platformResult.platform),
        };
      }
    }

    return {
      isValid: false,
      error:
        "No supported social media URLs found. Supported platforms: Instagram, Facebook, LinkedIn",
    };
  }

  extractURLs(text) {
    // Regular expression to match URLs
    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

    const matches = text.match(urlRegex);

    if (!matches) {
      return [];
    }

    // Validate each URL
    return matches.filter((url) => {
      try {
        return validator.isURL(url, {
          protocols: ["http", "https"],
          require_protocol: true,
        });
      } catch (error) {
        return false;
      }
    });
  }

  identifyPlatform(url) {
    for (const [platform, config] of Object.entries(this.platforms)) {
      for (const pattern of config.patterns) {
        if (pattern.test(url)) {
          return {
            isValid: true,
            platform: platform,
            platformName: config.name,
          };
        }
      }
    }

    return {
      isValid: false,
      platform: null,
      platformName: null,
    };
  }

  cleanURL(url, platform) {
    try {
      const urlObj = new URL(url);

      switch (platform) {
        case "instagram":
          return this.cleanInstagramURL(urlObj);
        case "facebook":
          return this.cleanFacebookURL(urlObj);
        case "linkedin":
          return this.cleanLinkedInURL(urlObj);
        default:
          return url;
      }
    } catch (error) {
      return url; // Return original if cleaning fails
    }
  }

  cleanInstagramURL(urlObj) {
    // Remove tracking parameters
    const cleanParams = new URLSearchParams();

    // Keep only essential parameters
    if (urlObj.searchParams.has("igshid")) {
      cleanParams.set("igshid", urlObj.searchParams.get("igshid"));
    }

    urlObj.search = cleanParams.toString();

    // Ensure we're using the standard domain
    urlObj.hostname = "www.instagram.com";

    return urlObj.toString();
  }

  cleanFacebookURL(urlObj) {
    // Convert mobile URLs to desktop
    if (urlObj.hostname === "m.facebook.com") {
      urlObj.hostname = "www.facebook.com";
    }

    // Handle fb.watch URLs (keep as is)
    if (urlObj.hostname === "fb.watch") {
      return urlObj.toString();
    }

    // Remove tracking parameters but keep essential ones
    const essentialParams = ["fbid", "id", "v"];
    const cleanParams = new URLSearchParams();

    essentialParams.forEach((param) => {
      if (urlObj.searchParams.has(param)) {
        cleanParams.set(param, urlObj.searchParams.get(param));
      }
    });

    urlObj.search = cleanParams.toString();

    return urlObj.toString();
  }

  cleanLinkedInURL(urlObj) {
    // Ensure desktop version
    urlObj.hostname = "www.linkedin.com";

    // Remove all tracking parameters for LinkedIn
    urlObj.search = "";

    return urlObj.toString();
  }

  getSupportedPlatforms() {
    return Object.values(this.platforms).map((platform) => platform.name);
  }

  isValidURL(url) {
    try {
      return validator.isURL(url, {
        protocols: ["http", "https"],
        require_protocol: true,
      });
    } catch (error) {
      return false;
    }
  }

  // Utility method to extract post ID from URLs (useful for APIs)
  extractPostId(url, platform) {
    try {
      const urlObj = new URL(url);

      switch (platform) {
        case "instagram":
          const instagramMatch = urlObj.pathname.match(
            /\/(p|reel|tv)\/([A-Za-z0-9_-]+)/
          );
          return instagramMatch ? instagramMatch[2] : null;

        case "facebook":
          if (urlObj.hostname === "fb.watch") {
            return urlObj.pathname.slice(1); // Remove leading slash
          }
          const facebookMatch = urlObj.pathname.match(/\/posts\/(\d+)/);
          return facebookMatch ? facebookMatch[1] : null;

        case "linkedin":
          const linkedinMatch = urlObj.pathname.match(
            /\/(posts|feed)\/([A-Za-z0-9_-]+)/
          );
          return linkedinMatch ? linkedinMatch[2] : null;

        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }
}

module.exports = URLParser;
