# Media Download Telegram Bot

A powerful Telegram bot that can download photos and videos from Instagram, Facebook, and LinkedIn when you share links with it.

## 🌟 Features

- 📸 **Instagram Support**: Download posts, reels, and stories
- 📘 **Facebook Support**: Download videos and photos from posts
- 💼 **LinkedIn Support**: Download media from posts and articles
- 🚀 **Fast Processing**: Optimized for quick downloads
- 🔒 **Secure**: No data storage, files are deleted after sending
- 📝 **Comprehensive Logging**: Detailed logs for monitoring and debugging
- ⚡ **Rate Limiting**: Built-in protection against spam
- 🛡️ **Error Handling**: Robust error handling with user-friendly messages

## 📋 Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)

## 🚀 Quick Start

### 1. Clone or Download

Download this project to your local machine.

### 2. Install Dependencies

```bash
cd telegram_bot
npm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
copy .env.example .env
```

Edit the `.env` file and add your Telegram Bot Token:

```env
BOT_TOKEN=your_telegram_bot_token_here
```

### 4. Start the Bot

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

| Variable                  | Description                              | Default  | Required |
| ------------------------- | ---------------------------------------- | -------- | -------- |
| `BOT_TOKEN`               | Telegram Bot Token from @BotFather       | -        | ✅       |
| `RAPIDAPI_KEY`            | RapidAPI key for enhanced features       | -        | ❌       |
| `LOG_LEVEL`               | Logging level (error, warn, info, debug) | info     | ❌       |
| `MAX_FILE_SIZE`           | Maximum file size for downloads (bytes)  | 50000000 | ❌       |
| `DOWNLOAD_TIMEOUT`        | Download timeout in milliseconds         | 30000    | ❌       |
| `MAX_REQUESTS_PER_MINUTE` | Rate limit per minute                    | 10       | ❌       |
| `MAX_REQUESTS_PER_HOUR`   | Rate limit per hour                      | 50       | ❌       |

### Advanced Configuration

Edit `config.js` for more detailed configuration options:

- Download settings
- Rate limiting
- Security options
- Performance tuning
- Feature toggles

## 🤖 Bot Commands

- `/start` - Welcome message and bot introduction
- `/help` - Usage instructions and help
- `/status` - Check bot operational status

## 📱 Usage

1. **Start a conversation** with your bot on Telegram
2. **Send `/start`** to see the welcome message
3. **Share a link** from Instagram, Facebook, or LinkedIn
4. **Wait for processing** (usually 5-15 seconds)
5. **Receive your media** directly in the chat

### Supported Link Types

#### Instagram

- Posts: `https://instagram.com/p/ABC123/`
- Reels: `https://instagram.com/reel/ABC123/`
- IGTV: `https://instagram.com/tv/ABC123/`

#### Facebook

- Posts: `https://facebook.com/username/posts/123456`
- Videos: `https://facebook.com/username/videos/123456`
- Watch links: `https://fb.watch/ABC123`

#### LinkedIn

- Posts: `https://linkedin.com/posts/username_123456`
- Feed: `https://linkedin.com/feed/update/123456`

## 🔨 Development

### Project Structure

```
telegram_bot/
├── bot.js                 # Main bot file
├── package.json           # Dependencies and scripts
├── config.js             # Configuration settings
├── .env.example          # Environment template
├── services/             # Download services
│   ├── instagramDownloader.js
│   ├── facebookDownloader.js
│   └── linkedinDownloader.js
├── utils/                # Utility modules
│   ├── logger.js
│   └── urlParser.js
├── downloads/            # Temporary download folder
└── logs/                # Application logs
```

### Adding New Platforms

1. Create a new downloader service in `services/`
2. Add URL patterns to `utils/urlParser.js`
3. Update the main bot logic in `bot.js`
4. Add configuration options in `config.js`

### Testing

Run the bot in development mode:

```bash
npm run dev
```

Check logs for debugging:

```bash
# View all logs
tail -f logs/app.log

# View error logs only
tail -f logs/error.log
```

## 🛠️ Troubleshooting

### Common Issues

#### Bot doesn't respond

- ✅ Check if BOT_TOKEN is correct
- ✅ Ensure bot is started with `/start` command
- ✅ Check logs for error messages

#### Downloads fail

- ✅ Verify the shared link is public
- ✅ Check internet connection
- ✅ Review error logs for specific issues
- ✅ Ensure link format is supported

#### "Private content" errors

- ✅ Make sure the content is publicly accessible
- ✅ Try accessing the link in an incognito browser
- ✅ Contact content owner for public access

#### Performance issues

- ✅ Reduce concurrent downloads in config
- ✅ Increase timeout values
- ✅ Check server resources (RAM, CPU)

### Debug Mode

Enable debug mode in `.env`:

```env
DEBUG=true
VERBOSE_ERRORS=true
```

This will provide more detailed error messages and logging.

## 📊 Monitoring

### Logs Location

- `logs/app.log` - All application logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Log Levels

- `error` - Error messages only
- `warn` - Warnings and errors
- `info` - General information (default)
- `debug` - Detailed debugging information

## 🔐 Security

### Best Practices

1. **Keep your bot token secure** - Never commit it to version control
2. **Use environment variables** for sensitive configuration
3. **Enable rate limiting** to prevent abuse
4. **Monitor logs** for suspicious activity
5. **Update dependencies** regularly for security patches

### Rate Limiting

The bot includes built-in rate limiting:

- 10 requests per minute per user (default)
- 50 requests per hour per user (default)

Adjust these values in your configuration as needed.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review the logs for error messages
3. Search existing issues on GitHub
4. Create a new issue with:
   - Detailed description
   - Steps to reproduce
   - Log excerpts (remove sensitive data)
   - Environment information

## 🚀 Deployment

### Local Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Using PM2 (Recommended for production)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start bot.js --name "media-bot"

# Monitor
pm2 monit

# View logs
pm2 logs media-bot
```

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t media-bot .
docker run -d --name media-bot --env-file .env media-bot
```

## 📈 Performance Tips

1. **Increase timeout** for slow networks
2. **Reduce concurrent downloads** on limited resources
3. **Enable cleanup** to manage disk space
4. **Monitor memory usage** with large files
5. **Use SSD storage** for better I/O performance

## 🔄 Updates

Keep your bot updated:

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

## ⚠️ Important Notes

- This bot is for educational purposes
- Respect platform terms of service
- Only download content you have permission to download
- Be mindful of copyright restrictions
- Use responsibly and ethically

---

**Happy downloading! 🎉**
