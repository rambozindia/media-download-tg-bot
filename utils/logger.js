const winston = require("winston");
const path = require("path");
const fs = require("fs-extra");

// Create logs directory
const logsDir = path.join(__dirname, "..", "logs");
fs.ensureDirSync(logsDir);

// Define custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: customFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), customFormat),
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, "app.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: customFormat,
    }),

    // File transport for error logs only
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: customFormat,
    }),
  ],

  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "exceptions.log"),
      format: customFormat,
    }),
  ],

  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "rejections.log"),
      format: customFormat,
    }),
  ],
});

// Add request logging helper
logger.logRequest = (userId, userName, platform, url, action = "download") => {
  logger.info(
    `User Request - ID: ${userId}, Name: ${userName}, Platform: ${platform}, Action: ${action}, URL: ${url}`
  );
};

// Add download success logging helper
logger.logDownloadSuccess = (
  userId,
  userName,
  platform,
  mediaType,
  fileSize = null
) => {
  const sizeInfo = fileSize ? ` (${Math.round(fileSize / 1024)}KB)` : "";
  logger.info(
    `Download Success - ID: ${userId}, Name: ${userName}, Platform: ${platform}, Type: ${mediaType}${sizeInfo}`
  );
};

// Add download failure logging helper
logger.logDownloadFailure = (userId, userName, platform, error) => {
  logger.error(
    `Download Failed - ID: ${userId}, Name: ${userName}, Platform: ${platform}, Error: ${error}`
  );
};

// Add bot statistics logging
logger.logStats = (stats) => {
  logger.info(`Bot Statistics - ${JSON.stringify(stats)}`);
};

// Add performance logging
logger.logPerformance = (operation, duration, additionalInfo = "") => {
  const info = additionalInfo ? ` - ${additionalInfo}` : "";
  logger.info(
    `Performance - Operation: ${operation}, Duration: ${duration}ms${info}`
  );
};

module.exports = logger;
