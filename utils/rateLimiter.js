const path = require("path");
const fs = require("fs-extra");
const logger = require("./logger");

class RateLimiter {
  constructor(maxRequestsPerMinute = 10, maxRequestsPerHour = 50) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.maxRequestsPerHour = maxRequestsPerHour;
    this.userRequests = new Map();

    // Clean up old requests every minute
    setInterval(() => this.cleanup(), 60000);
  }

  isAllowed(userId) {
    const now = Date.now();
    const userKey = userId.toString();

    if (!this.userRequests.has(userKey)) {
      this.userRequests.set(userKey, {
        minute: [],
        hour: [],
      });
    }

    const requests = this.userRequests.get(userKey);

    // Filter requests within the last minute and hour
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    requests.minute = requests.minute.filter((time) => time > oneMinuteAgo);
    requests.hour = requests.hour.filter((time) => time > oneHourAgo);

    // Check limits
    if (requests.minute.length >= this.maxRequestsPerMinute) {
      logger.warn(
        `Rate limit exceeded for user ${userId}: ${requests.minute.length} requests in last minute`
      );
      return false;
    }

    if (requests.hour.length >= this.maxRequestsPerHour) {
      logger.warn(
        `Rate limit exceeded for user ${userId}: ${requests.hour.length} requests in last hour`
      );
      return false;
    }

    // Add current request
    requests.minute.push(now);
    requests.hour.push(now);

    return true;
  }

  cleanup() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    for (const [userId, requests] of this.userRequests.entries()) {
      requests.hour = requests.hour.filter((time) => time > oneHourAgo);

      // Remove users with no recent requests
      if (requests.hour.length === 0) {
        this.userRequests.delete(userId);
      }
    }
  }

  getStats() {
    return {
      totalUsers: this.userRequests.size,
      activeUsers: Array.from(this.userRequests.values()).filter(
        (req) => req.hour.length > 0
      ).length,
    };
  }
}

module.exports = RateLimiter;
