const axios = require('axios');
const https = require('https');
const tls = require('tls');
const { URL } = require('url');
const logger = require('../utils/logger');
const PingLog = require('../models/PingLog');

class PingService {
  static normalizePingInterval(intervalMinutes) {
    const parsed = Number(intervalMinutes);
    if (!Number.isFinite(parsed)) {
      return 5;
    }
    return Math.min(10, Math.max(5, Math.round(parsed)));
  }

  static calculateNextPing(intervalMinutes) {
    const normalizedInterval = this.normalizePingInterval(intervalMinutes);
    const nextPing = new Date();
    nextPing.setMinutes(nextPing.getMinutes() + normalizedInterval);
    nextPing.setSeconds(nextPing.getSeconds() + Math.floor(Math.random() * 45) + 15);
    return nextPing;
  }

  static buildRequestConfig(url) {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    ];
    const acceptLanguages = ['en-US,en;q=0.9', 'en-GB,en;q=0.8', 'en;q=0.8,de;q=0.7'];
    const proxyIps = ['104.16.120.15', '198.51.100.10', '203.0.113.42', '8.8.8.8'];
    const ip = proxyIps[Math.floor(Math.random() * proxyIps.length)];

    return {
      timeout: 12000,
      maxRedirects: 5,
      headers: {
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Referer: url.startsWith('http') ? url : 'https://www.google.com/',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Forwarded-For': ip,
        'X-Real-IP': ip,
        'CF-Connecting-IP': ip,
      },
    };
  }

  static async getSSLInfo(url) {
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.protocol.startsWith('https')) {
        return null;
      }

      return await new Promise((resolve) => {
        const socket = tls.connect({
          host: parsedUrl.hostname,
          port: parsedUrl.port || 443,
          servername: parsedUrl.hostname,
          rejectUnauthorized: false,
        }, () => {
          const cert = socket.getPeerCertificate(true);
          const expiryDate = cert && cert.valid_to ? new Date(cert.valid_to) : null;
          const sslDaysRemaining = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
          socket.end();
          resolve({
            sslExpiryDate: expiryDate,
            sslDaysRemaining,
          });
        });

        socket.on('error', () => resolve(null));
        socket.setTimeout(6000, () => {
          socket.destroy();
          resolve(null);
        });
      });
    } catch (error) {
      return null;
    }
  }

  static async notifyWebhook(website, payload) {
    if (!website?.alertWebhookUrl) {
      return;
    }

    try {
      await axios.post(website.alertWebhookUrl, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Pinglix-Alert/1.0',
        },
      });
    } catch (error) {
      logger.warn(`Alert webhook failed for ${website.url}: ${error.message}`);
    }
  }

  static async validateURL(url) {
    try {
      await axios.get(url, {
        ...this.buildRequestConfig(url),
        timeout: 7000,
      });
      return true;
    } catch (error) {
      if (error.response) return true;
      return false;
    }
  }

  static async pingWebsite(website) {
    const startTime = Date.now();
    let isSuccess = false;
    let statusCode = null;
    let errorMessage = null;
    const previousStatus = website.status || 'unknown';

    try {
      const response = await axios.get(website.url, this.buildRequestConfig(website.url));
      statusCode = response.status;
      isSuccess = statusCode >= 200 && statusCode < 500;
    } catch (error) {
      if (error.response) {
        statusCode = error.response.status;
        const isReachable = statusCode >= 200 && statusCode < 500;
        isSuccess = isReachable;
        if (!isSuccess) {
          errorMessage = `HTTP Error ${statusCode}: ${error.response.statusText || 'Server Error'}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection Timeout (Took longer than 12s)';
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

    const sslInfo = await this.getSSLInfo(website.url);

    website.status = status;
    website.lastPing = new Date();
    website.nextPing = this.calculateNextPing(website.pingInterval);
    website.lastResponseTime = responseTime;
    website.lastStatusCode = statusCode;
    website.lastSSLCheck = new Date();
    if (sslInfo) {
      website.sslExpiryDate = sslInfo.sslExpiryDate;
      website.sslDaysRemaining = sslInfo.sslDaysRemaining;
    } else {
      website.sslExpiryDate = null;
      website.sslDaysRemaining = null;
    }
    await website.save();

    await PingLog.create({
      websiteId: website._id,
      responseTime: isSuccess ? responseTime : null,
      statusCode,
      success: isSuccess,
      errorMessage,
    });

    if (website.alertWebhookUrl && (previousStatus === 'unknown' || previousStatus !== status)) {
      await this.notifyWebhook(website, {
        event: 'website_status_changed',
        websiteName: website.websiteName,
        url: website.url,
        status,
        statusCode,
        responseTime,
        errorMessage,
        checkedAt: new Date().toISOString(),
      });
    }

    logger.info(`Pinged ${website.url} - Status: ${status} - Time: ${responseTime}ms`);
  }
}

module.exports = PingService;
