const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  phone: String,
  availability: {
    type: Boolean,
    default: true
  },
  location: {
    lat: Number,
    lng: Number
  },
  points: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Volunteer", volunteerSchema);
