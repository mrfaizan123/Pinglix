const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  websiteName: {
    type: String,
    required: [true, 'Please provide a website name'],
    trim: true,
  },
  url: {
    type: String,
    required: [true, 'Please provide a URL'],
    trim: true,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please provide a valid URL with HTTP or HTTPS',
    ]
  },
  pingInterval: {
    type: Number,
    required: [true, 'Please provide a ping interval in minutes'],
    default: 5,
    min: [5, 'Minimum ping interval is 5 minutes'],
    max: [10, 'Maximum ping interval is 10 minutes'],
  },
  expectedStatusCode: {
    type: Number,
    default: 200,
    min: [100, 'Expected status code must be between 100 and 599'],
    max: [599, 'Expected status code must be between 100 and 599'],
  },
  expectedText: {
    type: String,
    trim: true,
    default: '',
  },
  alertWebhookUrl: {
    type: String,
    trim: true,
    default: null,
  },
  sslExpiryDate: {
    type: Date,
    default: null,
  },
  sslDaysRemaining: {
    type: Number,
    default: null,
  },
  lastSSLCheck: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['unknown', 'up', 'down'],
    default: 'unknown',
  },
  lastPing: {
    type: Date,
    default: null,
  },
  nextPing: {
    type: Date,
    default: Date.now,
  },
  lastResponseTime: {
    type: Number, // in milliseconds
    default: null,
  },
  lastStatusCode: {
    type: Number,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index to prevent user from adding duplicate URLs
websiteSchema.index({ userId: 1, url: 1 }, { unique: true });
// Index for scheduler to quickly find active websites that need checking
websiteSchema.index({ isActive: 1, nextPing: 1 });

const Website = mongoose.model('Website', websiteSchema);
module.exports = Website;
