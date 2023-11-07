// complaint.js

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: String,
  customerId: String,
  agentId: String,
});

module.exports = mongoose.model('Complaint', complaintSchema);
