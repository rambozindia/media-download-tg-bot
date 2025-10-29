const { Telegraf } = require("telegraf");
const fs = require("fs-extra");
const path = require("path");
require("dotenv").config();

// Import services
const InstagramDownloader = require("./services/instagramDownloader");
const FacebookDownloader = require("./services/facebookDownloader");
const LinkedInDownloader = require("./services/linkedinDownloader");
const URLParser = require("./utils/urlParser");
const logger = require("./utils/logger");

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize services
const instagramDownloader = new InstagramDownloader();
const facebookDownloader = new FacebookDownloader();
const linkedinDownloader = new LinkedInDownloader();
const urlParser = new URLParser();

// Create downloads directory
const downloadsDir = path.join(__dirname, "downloads");
fs.ensureDirSync(downloadsDir);

// Bot commands
bot.start((ctx) => {
  const welcomeMessage = `
🎬 Welcome to Media Download Bot! 🎬

I can help you download photos and videos from:
📸 Instagram
📘 Facebook  
💼 LinkedIn

Just send me a link from any of these platforms and I'll download the media for you!

Commands:
/start - Show this welcome message
/help - Get help and usage instructions
/status - Check bot status

Simply paste any supported social media link and I'll handle the rest! 🚀
    `;

  ctx.reply(welcomeMessage);
  logger.info(
    `New user started bot: ${ctx.from.username || ctx.from.first_name}`
  );
});

bot.help((ctx) => {
  const helpMessage = `
🔧 How to use this bot:

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

Need help? Contact support or check our FAQ.
    `;

  ctx.reply(helpMessage);
});

bot.command("status", (ctx) => {
  ctx.reply("🤖 Bot is running smoothly!\n✅ All services operational");
});

// Handle text messages (URLs)
bot.on("text", async (ctx) => {
  const message = ctx.message.text;
  const userId = ctx.from.id;
  const userName = ctx.from.username || ctx.from.first_name;

  logger.info(`Received message from ${userName} (${userId}): ${message}`);

  try {
    // Parse the URL to determine the platform
    const urlInfo = urlParser.parseURL(message);

    if (!urlInfo.isValid) {
      return ctx.reply(
        "❌ Please send a valid Instagram, Facebook, or LinkedIn link."
      );
    }

    // Send processing message
    const processingMessage = await ctx.reply(
      `🔄 Processing your ${urlInfo.platform} link...\nThis may take a few moments.`
    );

    let downloadResult;

    switch (urlInfo.platform) {
      case "instagram":
        downloadResult = await instagramDownloader.download(
          urlInfo.url,
          userId
        );
        break;
      case "facebook":
        downloadResult = await facebookDownloader.download(urlInfo.url, userId);
        break;
      case "linkedin":
        downloadResult = await linkedinDownloader.download(urlInfo.url, userId);
        break;
      default:
        throw new Error("Unsupported platform");
    }

    // Delete processing message
    await ctx.deleteMessage(processingMessage.message_id);

    if (downloadResult.success) {
      // Send the downloaded media
      if (downloadResult.type === "image") {
        await ctx.replyWithPhoto(
          { source: downloadResult.filePath },
          {
            caption:
              downloadResult.caption || `Downloaded from ${urlInfo.platform}`,
          }
        );
      } else if (downloadResult.type === "video") {
        await ctx.replyWithVideo(
          { source: downloadResult.filePath },
          {
            caption:
              downloadResult.caption || `Downloaded from ${urlInfo.platform}`,
          }
        );
      }

      // Clean up downloaded file
      await fs.remove(downloadResult.filePath);

      logger.info(
        `Successfully processed ${urlInfo.platform} link for user ${userName}`
      );
    } else {
      throw new Error(downloadResult.error || "Download failed");
    }
  } catch (error) {
    logger.error(
      `Error processing request for user ${userName}: ${error.message}`
    );

    let errorMessage = "❌ Sorry, I couldn't download this media. ";

    if (error.message.includes("private")) {
      errorMessage += "The content appears to be private or requires login.";
    } else if (error.message.includes("not found")) {
      errorMessage += "The content was not found or may have been deleted.";
    } else if (error.message.includes("network")) {
      errorMessage += "There was a network issue. Please try again later.";
    } else {
      errorMessage += "Please make sure the link is valid and try again.";
    }

    ctx.reply(errorMessage);
  }
});

// Handle errors
bot.catch((err, ctx) => {
  logger.error(`Bot error for user ${ctx.from?.username}: ${err.message}`);
  ctx.reply("❌ An unexpected error occurred. Please try again later.");
});

// Start bot
const startBot = async () => {
  try {
    await bot.launch();
    logger.info("Bot started successfully!");
    console.log("🤖 Media Download Bot is running...");

    // Enable graceful stop
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (error) {
    logger.error(`Failed to start bot: ${error.message}`);
    process.exit(1);
  }
};

startBot();
