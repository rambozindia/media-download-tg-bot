const config = {
  // Bot Configuration
  bot: {
    token: process.env.BOT_TOKEN || "",
    webhook: {
      enabled: false,
      url: process.env.WEBHOOK_URL || "",
      port: process.env.WEBHOOK_PORT || 3000,
    },
  },

  // Download Configuration
  download: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    timeout: parseInt(process.env.DOWNLOAD_TIMEOUT) || 30000, // 30 seconds
    concurrentDownloads: parseInt(process.env.CONCURRENT_DOWNLOADS) || 3,
    retryAttempts: 3,
    retryDelay: 2000,
  },

  // Rate Limiting
  rateLimit: {
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 10,
    maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR) || 50,
    enabled: true,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    verbose: process.env.VERBOSE_ERRORS === "true",
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
  },

  // Paths
  paths: {
    downloads: "./downloads",
    logs: "./logs",
    temp: "./temp",
  },

  // API Configuration
  apis: {
    rapidapi: {
      key: process.env.RAPIDAPI_KEY || "",
      enabled: !!process.env.RAPIDAPI_KEY,
    },
  },

  // Security
  security: {
    allowedUsers: process.env.ALLOWED_USERS
      ? process.env.ALLOWED_USERS.split(",")
      : [],
    adminUserId: process.env.ADMIN_USER_ID || "",
    enableUserWhitelist: false,
  },

  // Performance
  performance: {
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 3600000, // 1 hour
    enablePerformanceMonitoring: true,
    puppeteerOptions: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    },
  },

  // Features
  features: {
    enableInstagram: true,
    enableFacebook: true,
    enableLinkedIn: true,
    enableMetadataExtraction: true,
    enableImageCompression: false,
    enableVideoConversion: false,
  },

  // Debug
  debug: {
    enabled: process.env.DEBUG === "true",
    saveFailedUrls: true,
    logUserRequests: true,
  },

  // Messages
  messages: {
    welcome: `🎬 Welcome to Media Download Bot! 🎬

I can help you download photos and videos from:
📸 Instagram
📘 Facebook  
💼 LinkedIn

Just send me a link from any of these platforms and I'll download the media for you!

Commands:
/start - Show this welcome message
/help - Get help and usage instructions
/status - Check bot status

Simply paste any supported social media link and I'll handle the rest! 🚀`,

    help: `🔧 How to use this bot:

1️⃣ Copy a link from:
   • Instagram post/story/reel
   • Facebook post/video
   • LinkedIn post/video

2️⃣ Send the link to this bot

3️⃣ Wait for the download to complete

4️⃣ Receive your media file!

⚠️ Important notes:
• Only public content can be downloaded
• Large files may take some time to process
• Some content may be protected by privacy settings

Need help? Contact support or check our FAQ.`,

    processing:
      "🔄 Processing your {platform} link...\nThis may take a few moments.",
    invalidUrl: "❌ Please send a valid Instagram, Facebook, or LinkedIn link.",
    downloadError:
      "❌ Sorry, I couldn't download this media. Please make sure the link is valid and try again.",
    privateContent:
      "❌ Sorry, I couldn't download this media. The content appears to be private or requires login.",
    notFound:
      "❌ Sorry, I couldn't download this media. The content was not found or may have been deleted.",
    networkError:
      "❌ Sorry, I couldn't download this media. There was a network issue. Please try again later.",
    rateLimited:
      "⏰ You're sending requests too quickly. Please wait a moment before trying again.",
    botStatus: "🤖 Bot is running smoothly!\n✅ All services operational",
  },
};

module.exports = config;
