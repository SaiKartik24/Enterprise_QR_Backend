// certificate.js

const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: String,
  name: String,
  type: String,
  description: String,
  duration: String,
});

module.exports = mongoose.model('Certificate', certificateSchema);
