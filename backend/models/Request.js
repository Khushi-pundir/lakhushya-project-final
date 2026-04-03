const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    default: function defaultType() {
      return this.category;
    }
  },
  quantity: {
    type: Number,
    required: true
  },
  quantityNeeded: {
    type: Number,
    default: function defaultQuantityNeeded() {
      return this.quantity;
    }
  },
  urgency: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
    default: "MEDIUM"
  },
  date: {
    type: String,
    required: true
  },
  expiryDate: {
    type: String,
    default: function defaultExpiryDate() {
      return this.date;
    }
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "fulfilled", "expired"],
    default: "pending"
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donation",
    default: null
  },
  pickupStatus: {
    type: String,
    default: "pending"
  },
  acceptedAt: Date,
  fulfilledAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
