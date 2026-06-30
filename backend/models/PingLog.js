const mongoose = require('mongoose');

const pingLogSchema = new mongoose.Schema({
  websiteId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Website',
    required: true,
    index: true, // For querying logs by website
  },
  responseTime: {
    type: Number, // in milliseconds
  },
  statusCode: {
    type: Number,
  },
  success: {
    type: Boolean,
    required: true,
  },
  errorMessage: {
    type: String,
  },
  checkedAt: {
    type: Date,
    default: Date.now,
    index: true, // To sort by newest first easily
  },
}, {
  // We can add timestamps but checkedAt usually suffices for logs, adding them for consistency if needed
  // timestamps: true 
});

const PingLog = mongoose.model('PingLog', pingLogSchema);
module.exports = PingLog;
