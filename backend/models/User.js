const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["Donor", "NGO", "Volunteer", "Admin"]
  },

  phone: String,
  address: String,
  pincode: String,
  city: String,
  state: String,
  nationality: String,
  dob: String,

  verified: {
    type: Boolean,
    default: false
  },
   otp: String,
  otpExpiry: Date
});

module.exports = mongoose.model("User", userSchema);