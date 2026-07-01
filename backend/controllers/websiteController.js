const Website = require('../models/Website');
const PingLog = require('../models/PingLog');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const PingService = require('../services/PingService');


exports.getWebsites = asyncHandler(async (req, res, next) => {
  const websites = await Website.find({ userId: req.user.id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: websites.length,
    data: websites
  });
});


exports.addWebsite = asyncHandler(async (req, res, next) => {
  const { websiteName, url, pingInterval, alertWebhookUrl, expectedStatusCode, expectedText } = req.body;

  const existingWebsite = await Website.findOne({ userId: req.user.id, url });
  if (existingWebsite) {
    return next(new AppError('You have already added this URL', 400));
  }

  const isValid = await PingService.validateURL(url);
  if (!isValid) {
    return next(new AppError('URL is unreachable or invalid', 400));
  }

  const website = await Website.create({
    userId: req.user.id,
    websiteName,
    url,
    pingInterval: PingService.normalizePingInterval(pingInterval),
    expectedStatusCode: expectedStatusCode !== undefined && expectedStatusCode !== '' ? Number(expectedStatusCode) : null,
    expectedText: expectedText ? expectedText.trim() : '',
    alertWebhookUrl: alertWebhookUrl ? alertWebhookUrl.trim() : null,
    nextPing: new Date()
  });

  await PingService.pingWebsite(website);

  res.status(201).json({
    success: true,
    data: website
  });
});


exports.updateWebsite = asyncHandler(async (req, res, next) => {
  let website = await Website.findById(req.params.id);

  if (!website) {
    return next(new AppError('Website not found', 404));
  }


  if (website.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this website', 401));
  }

  const updateData = { ...req.body };

  if (updateData.pingInterval !== undefined) {
    updateData.pingInterval = PingService.normalizePingInterval(updateData.pingInterval);
  }

  if (updateData.expectedStatusCode !== undefined) {
    updateData.expectedStatusCode = Number(updateData.expectedStatusCode);
  }

  if (updateData.expectedText !== undefined) {
    updateData.expectedText = updateData.expectedText.trim();
  }

  if (updateData.alertWebhookUrl === '') {
    updateData.alertWebhookUrl = null;
  }

  website = await Website.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: website
  });
});


exports.toggleWebsite = asyncHandler(async (req, res, next) => {
  const website = await Website.findById(req.params.id);

  if (!website) {
    return next(new AppError('Website not found', 404));
  }

  if (website.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this website', 401));
  }

  website.isActive = !website.isActive;

  if (website.isActive) {
    website.nextPing = PingService.calculateNextPing(website.pingInterval);
  }
  
  await website.save();

  res.status(200).json({
    success: true,
    data: website
  });
});


exports.deleteWebsite = asyncHandler(async (req, res, next) => {
  const website = await Website.findById(req.params.id);

  if (!website) {
    return next(new AppError('Website not found', 404));
  }

  if (website.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this website', 401));
  }

  
  await PingLog.deleteMany({ websiteId: website._id });
  await website.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});


exports.getWebsiteLogs = asyncHandler(async (req, res, next) => {
  const website = await Website.findById(req.params.id);

  if (!website) {
    return next(new AppError('Website not found', 404));
  }

  if (website.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to view these logs', 401));
  }
  
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;

  const logs = await PingLog.find({ websiteId: req.params.id })
    .sort({ checkedAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .lean();
    
  const total = await PingLog.countDocuments({ websiteId: req.params.id });

  res.status(200).json({
    success: true,
    count: logs.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: logs
  });
});


exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const websites = await Website.find({ userId: req.user.id }).lean();
  const websiteIds = websites.map(w => w._id);

  const totalWebsites = websites.length;
  const onlineWebsites = websites.filter(w => w.status === 'up').length;
  const offlineWebsites = websites.filter(w => w.status === 'down').length;

  // Average response time across all monitors
  let totalResponseTime = 0;
  let countWithResponseTime = 0;
  websites.forEach(w => {
    if (w.lastResponseTime) {
      totalResponseTime += w.lastResponseTime;
      countWithResponseTime++;
    }
  });
  const averageResponseTime = countWithResponseTime > 0
    ? Math.round(totalResponseTime / countWithResponseTime)
    : 0;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentLogs = websiteIds.length
    ? await PingLog.find({ websiteId: { $in: websiteIds }, checkedAt: { $gte: since24h } }).lean()
    : [];

  const totalChecks24h = recentLogs.length;
  const successChecks24h = recentLogs.filter(l => l.success).length;
  const overallUptime24h = totalChecks24h > 0
    ? parseFloat(((successChecks24h / totalChecks24h) * 100).toFixed(2))
    : null;

 
  const totalIncidents = websiteIds.length
    ? await PingLog.countDocuments({ websiteId: { $in: websiteIds }, success: false })
    : 0;

  const recentActivity = websiteIds.length
    ? await PingLog.find({ websiteId: { $in: websiteIds } })
        .sort({ checkedAt: -1 })
        .limit(10)
        .lean()
    : [];

  const websiteMap = {};
  websites.forEach(w => { websiteMap[w._id.toString()] = { name: w.websiteName, url: w.url }; });
  const enrichedActivity = recentActivity.map(log => ({
    ...log,
    websiteName: websiteMap[log.websiteId.toString()]?.name || 'Unknown',
    websiteUrl: websiteMap[log.websiteId.toString()]?.url || '',
  }));

  res.status(200).json({
    success: true,
    data: {
      totalWebsites,
      onlineWebsites,
      offlineWebsites,
      averageResponseTime,
      totalChecks24h,
      overallUptime24h,
      totalIncidents,
      recentActivity: enrichedActivity,
    }
  });
});


exports.getWebsiteUptime = asyncHandler(async (req, res, next) => {
  const website = await Website.findById(req.params.id);
  if (!website) return next(new AppError('Website not found', 404));
  if (website.userId.toString() !== req.user.id) return next(new AppError('Not authorized', 401));

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const logs = await PingLog.find({ websiteId: req.params.id, checkedAt: { $gte: since30d } }).lean();

  const total = logs.length;
  const successful = logs.filter(l => l.success).length;
  const uptime = total > 0 ? parseFloat(((successful / total) * 100).toFixed(2)) : null;

  res.status(200).json({
    success: true,
    data: { uptime, total, successful, failed: total - successful }
  });
});

// Helper to draw a badge
const drawBadge = (label, value, color) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="115" height="20">
    <linearGradient id="b" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <mask id="a">
      <rect width="115" height="20" rx="4" fill="#fff"/>
    </mask>
    <g mask="url(#a)">
      <path fill="#555" d="M0 0h55v20H0z"/>
      <path fill="${color}" d="M55 0h60v20H55z"/>
      <path fill="url(#b)" d="M0 0h115v20H0z"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
      <text x="27.5" y="15" fill="#010101" fill-opacity=".3">${label}</text>
      <text x="27.5" y="14">${label}</text>
      <text x="85" y="15" fill="#010101" fill-opacity=".3">${value}</text>
      <text x="85" y="14">${value}</text>
    </g>
  </svg>`;
};


exports.getWebsiteBadge = asyncHandler(async (req, res, next) => {
  const website = await Website.findById(req.params.id);
  if (!website) {
    const svg = drawBadge('Uptime', 'unknown', '#6B7280');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(svg);
  }

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const logs = await PingLog.find({ websiteId: req.params.id, checkedAt: { $gte: since30d } }).lean();

  const total = logs.length;
  const successful = logs.filter(l => l.success).length;
  const uptime = total > 0 ? parseFloat(((successful / total) * 100).toFixed(2)) : null;

  let uptimeText = 'no data';
  let color = '#6B7280'; 

  if (uptime !== null) {
    uptimeText = `${uptime}%`;
    if (uptime >= 99) {
      color = '#10B981';
    } else if (uptime >= 95) {
      color = '#F59E0B'; 
    } else {
      color = '#EF4444'; 
    }
  }

  const svg = drawBadge('Uptime', uptimeText, color);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(svg);
});


exports.manualPingWebsite = asyncHandler(async (req, res, next) => {
  const website = await Website.findById(req.params.id);

  if (!website) {
    return next(new AppError('Website not found', 404));
  }

  if (website.userId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to ping this website', 401));
  }

  
  await PingService.pingWebsite(website);

  
  const latestLog = await PingLog.findOne({ websiteId: website._id }).sort({ checkedAt: -1 }).lean();

  res.status(200).json({
    success: true,
    message: 'Ping executed successfully',
    data: {
      website,
      latestLog
    }
  });
});
