// customerInfoCollection.js
const mongoose = require('mongoose');

const customerInfoSchema = new mongoose.Schema({
  customerId: String,
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  serviceType: String,
  date: Date,
  description: String,
  status: String,
  address:String,
  // comments:String,
  // agentStatus:String,
});

module.exports = mongoose.model('CustomerInfo', customerInfoSchema);
