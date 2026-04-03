const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donation",
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  message: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
