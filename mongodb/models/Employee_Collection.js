const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  certificateId: String,
  status: String,
  startDate: String,
  endDate: String,
  pendingDays: String,
}, { _id: false }); // Add { _id: false } to exclude the _id field

const employeeSchema = new mongoose.Schema({
  empId: { type: String, unique: true },
  userName: String,
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  activeState: String,
  role: String,
  password: String,
  designation: String,
  jobType: String,
  jobDescription: String,
  image: String,
  rating: String,
  review: String,
  serviceType: String,
  workExperience: Number,
  qrCode: String,
  certifications: [certificationSchema], // Use the certification schema as an array
});

module.exports = mongoose.model('Agent', employeeSchema);
