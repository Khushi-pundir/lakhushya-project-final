const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: undefined
    },
    latitude: Number,
    longitude: Number
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
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
  location: locationSchema,
  availability: {
    type: Boolean,
    default: true
  },
  points: {
    type: Number,
    default: 0
  },
  impactScore: {
    type: Number,
    default: 0
  },

  verified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: function defaultVerificationStatus() {
      return this.role === "NGO" ? "pending" : "approved";
    }
  },
  verifiedAt: Date,
  verifiedByAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  otp: String,
  otpExpiry: Date,
  latestOtpPurpose: String
}, { timestamps: true });

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
