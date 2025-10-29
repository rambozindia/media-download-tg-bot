const fs = require("fs-extra");
const path = require("path");
const logger = require("./logger");

class FileManager {
  constructor(downloadsDir = "./downloads", maxAge = 3600000) {
    // 1 hour default
    this.downloadsDir = path.resolve(downloadsDir);
    this.maxAge = maxAge;

    // Ensure downloads directory exists
    fs.ensureDirSync(this.downloadsDir);

    // Start cleanup interval
    this.startCleanupInterval();
  }

  generateFileName(platform, userId, extension = "mp4") {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${platform}_${userId}_${timestamp}_${random}.${extension}`;
  }

  getFilePath(fileName) {
    return path.join(this.downloadsDir, fileName);
  }

  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.downloadsDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.downloadsDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > this.maxAge) {
          await fs.remove(filePath);
          deletedCount++;
          logger.debug(`Deleted old file: ${file}`);
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleanup completed: deleted ${deletedCount} old files`);
      }
    } catch (error) {
      logger.error(`Cleanup error: ${error.message}`);
    }
  }

  startCleanupInterval() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupOldFiles();
    }, this.maxAge);

    // Run initial cleanup
    setTimeout(() => {
      this.cleanupOldFiles();
    }, 5000);
  }

  async getDirectoryStats() {
    try {
      const files = await fs.readdir(this.downloadsDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.downloadsDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return {
        fileCount: files.length,
        totalSize: totalSize,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      };
    } catch (error) {
      logger.error(`Error getting directory stats: ${error.message}`);
      return { fileCount: 0, totalSize: 0, totalSizeMB: 0 };
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.remove(filePath);
      logger.debug(`Deleted file: ${path.basename(filePath)}`);
    } catch (error) {
      logger.error(`Error deleting file ${filePath}: ${error.message}`);
    }
  }
}

module.exports = FileManager;
