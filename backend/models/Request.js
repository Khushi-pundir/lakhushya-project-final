const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    ngoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "pending"
    },
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    pickupStatus: {
  type: String,
  default: "pending" // pending → picked → delivered
},
acceptedAt: {
  type: Date
}
});

module.exports = mongoose.model("Request", requestSchema);