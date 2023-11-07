const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema({
    First_name: {
        type: String,
        required: true,
    },
    Last_name: {
        type: String,
        required: true,
    },
    Role: {
        type: String,
        required: true,
    },
    Email: {
        type: String,
        required: true,
        unique: true,
    },
    Phone: {
        type: String,
        required: true,
        unique: true,
    },
    Password: {
        type: String,
        required: true,
    },
    Emp_ID: {
        type: String, 
    },
});

const Registration = mongoose.model("Registration", RegistrationSchema);

module.exports = Registration;