const axios = require('axios');
const logger = require('../utils/logger');
const Website = require('../models/Website');
const PingLog = require('../models/PingLog');

class PingService {
  /**
   * Calculate the next ping time based on the interval
   * @param {Number} intervalMinutes 
   * @returns {Date}
   */
  static calculateNextPing(intervalMinutes) {
    const nextPing = new Date();
    nextPing.setMinutes(nextPing.getMinutes() + intervalMinutes);
    return nextPing;
  }

  /**
   * Validate if a URL exists and is reachable
   * @param {String} url 
   * @returns {Promise<Boolean>}
   */
  static async validateURL(url) {
    try {
      // Use a short timeout just to verify existence
      await axios.get(url, { 
        timeout: 5000,
        headers: { 'User-Agent': 'Pinglix-Bot/1.0' }
      });
      return true;
    } catch (error) {
      if (error.response) return true; 
      return false;
    }
  }

  /**
   * Ping a specific website and log the result
   * @param {Object} website - Mongoose Website Document
   */
  static async pingWebsite(website) {
    const startTime = Date.now();
    let isSuccess = false;
    let statusCode = null;
    let errorMessage = null;

    try {
      const response = await axios.get(website.url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Pinglix-Bot/1.0' }
      });
      statusCode = response.status;
      isSuccess = statusCode >= 200 && statusCode < 400;
    } catch (error) {
      if (error.response) {
        statusCode = error.response.status;
        errorMessage = `HTTP Error ${statusCode}: ${error.response.statusText || 'Server Error'}`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection Timeout (Took longer than 10s)';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'DNS Resolution Failed (Check URL/domain)';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection Refused (Server offline or port closed)';
      } else if (error.code === 'ECONNRESET') {
        errorMessage = 'Connection Reset by Peer';
      } else if (error.code === 'EPROTO') {
        errorMessage = 'SSL/TLS Protocol Error';
      } else {
        errorMessage = error.message || 'Unknown Connection Error';
      }
      isSuccess = false;
    }

    const responseTime = Date.now() - startTime;
    const status = isSuccess ? 'up' : 'down';

    // Update Website Document
    website.status = status;
    website.lastPing = new Date();
    website.nextPing = this.calculateNextPing(website.pingInterval);
    website.lastResponseTime = responseTime;
    website.lastStatusCode = statusCode;
    await website.save();

    // Create Ping Log
    await PingLog.create({
      websiteId: website._id,
      responseTime: isSuccess ? responseTime : null,
      statusCode,
      success: isSuccess,
      errorMessage,
    });

    logger.info(`Pinged ${website.url} - Status: ${status} - Time: ${responseTime}ms`);
  }
}

module.exports = PingService;
