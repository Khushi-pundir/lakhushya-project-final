const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number
  },
  { _id: false }
);

const trackingPointSchema = new mongoose.Schema(
  {
    actorType: {
      type: String,
      enum: ["donor", "ngo", "volunteer", "system"],
      default: "system"
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    location: pointSchema,
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const otpCheckpointSchema = new mongoose.Schema(
  {
    code: String,
    sentToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    sentAt: Date,
    expiresAt: Date,
    verifiedAt: Date,
    verifiedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: String,
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const donationSchema = new mongoose.Schema({
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
  requestedBy: {
    type: String,
    enum: ["donor", "ngo"],
    required: true
  },
  donationType: {
    type: String,
    enum: ["Food", "Clothes", "Books", "Other"],
    required: true
  },
  category: {
    type: String,
    default: function defaultCategory() {
      return this.donationType;
    }
  },
  itemName: {
    type: String,
    default: ""
  },
  quantity: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  pickupAddress: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: function defaultAddress() {
      return this.pickupAddress;
    }
  },
  mobileNumber: String,
  date: {
    type: String,
    required: true
  },
  pickupDate: {
    type: String,
    default: function defaultPickupDate() {
      return this.date;
    }
  },
  time: String,
  pickupTime: String,
  deliveryMode: {
    type: String,
    enum: ["SELF_DELIVERY", "SCHEDULE_PICKUP"],
    required: true
  },
  status: {
    type: String,
    enum: [
      "pending_ngo",
      "ngo_approved",
      "ngo_declined",
      "pending_volunteer",
      "accepted",
      "pickup_pending",
      "picked_up",
      "delivered",
      "failed",
      "cancelled"
    ],
    default: "pending_ngo"
  },
  workflowStatus: {
    type: String,
    enum: [
      "CREATED",
      "PENDING_NGO",
      "NGO_ACCEPTED",
      "NGO_REJECTED",
      "PENDING_VOLUNTEER",
      "VOLUNTEER_ASSIGNED",
      "PICKUP_PENDING",
      "PICKED_UP",
      "SELF_DELIVERY_PENDING",
      "DELIVERED",
      "FAILED"
    ],
    default: "PENDING_NGO"
  },
  ngoAttempts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  currentNgoCandidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  volunteerAttempts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  currentVolunteerCandidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  noVolunteerAvailable: {
    type: Boolean,
    default: false
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    default: null
  },
  qrCode: String,
  location: {
    donor: pointSchema,
    ngo: pointSchema,
    volunteer: pointSchema,
    lastUpdatedBy: String
  },
  distanceKm: {
    donorToNgo: Number,
    donorToVolunteer: Number,
    volunteerToNgo: Number
  },
  etaMinutes: {
    donorToVolunteer: Number,
    volunteerToNgo: Number
  },
  otp: {
    pickup: otpCheckpointSchema,
    ngoAcceptance: otpCheckpointSchema,
    selfDelivery: otpCheckpointSchema
  },
  timeline: [timelineSchema],
  trackingHistory: [trackingPointSchema]
}, { timestamps: true });

donationSchema.pre("save", function syncLegacyFields() {
  if (!this.category) {
    this.category = this.donationType;
  }
  if (!this.itemName) {
    this.itemName = this.description;
  }
  if (!this.pickupAddress) {
    this.pickupAddress = this.address;
  }
  if (!this.address) {
    this.address = this.pickupAddress;
  }
  if (!this.date) {
    this.date = this.pickupDate;
  }
  if (!this.pickupDate) {
    this.pickupDate = this.date;
  }
  if (!this.time) {
    this.time = this.pickupTime;
  }
  if (!this.pickupTime) {
    this.pickupTime = this.time;
  }
});

module.exports = mongoose.model("Donation", donationSchema);
