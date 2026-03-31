console.log("SERVER FILE LOADED");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const Donation = require("./models/Donation");
const Event = require("./models/Event");
const Request = require("./models/Request");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ EMAIL FUNCTION (ADD HERE)
const sendOTPEmail = async (to, otp) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "lavanya.sbt@gmail.com",
      pass: "kvjptktebxnuldrg"
    }
  });

  await transporter.sendMail({
    from: "lavanya.sbt@gmail.com",
    to,
    subject: "OTP for Password Reset",
    html: `<h2>Your OTP is: ${otp}</h2>`
  });
};

mongoose.connect("mongodb://127.0.0.1:27017/lakhushya_db")
  .then(() => console.log("Database Connected"))
  .catch(err => console.log(err));

app.get("/check", (req, res) => {
  res.send("working");
});

app.post("/register", async (req, res) => {

  const {
    name,
    email,
    password,
    role,
    phone,
    address,
    pincode,
    city,
    state,
    nationality,
    dob
  } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).send("Only valid Gmail addresses allowed");
  }
  if (role === "Admin") {
    return res.status(403).send("Admin registration not allowed");
  }

  const existingUser = await User.findOne({ email: cleanEmail });

  if (existingUser) {
    return res.status(400).send("User not found");
  }

  // Require extra fields for Donor and Volunteer
  if (role === "Donor" || role === "Volunteer") {
    if (!phone || !address || !pincode || !city || !state || !nationality || !dob) {
      return res.status(400).send("All fields are required");
    }
  }

  const newUser = new User({
    name,
    email: cleanEmail,
    password,
    role,
    phone,
    address,
    pincode,
    city,
    state,
    nationality,
    dob
  });

  await newUser.save();

  res.send("User registered successfully");

});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  const user = await User.findOne({
    email: cleanEmail,
    password: cleanPassword
  });

  if (!user) {
    return res.status(401).send("Invalid email or password");
  }

  res.json({
    message: "Login successful",
    role: user.role,
    userId: user._id
  });
});
// ✅ SEND OTP ROUTE (ADD HERE)
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const cleanEmail = email.trim().toLowerCase();

    // 🔥 CHECK IF EMAIL EXISTS (ANY ROLE)
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // ✅ generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // store OTP
    await User.updateOne(
      { email: cleanEmail },
      { otp, otpExpiry: Date.now() + 5 * 60 * 1000 }
    );

    await sendOTPEmail(cleanEmail, otp);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

app.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });

  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  user.password = newPassword; // later we can hash
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
});
// CREATE PICKUP REQUEST (DONOR or NGO)
app.post("/donation/create", async (req, res) => {
  try {
    const {
      userId,
      role,
      itemName,
      category,
      quantity,
      pickupDate,
      pickupTime,
      address
    } = req.body;

    const donation = new Donation({
      donorId: role === "donor" ? userId : null,
      ngoId: null,                     // IMPORTANT
      itemName,
      category,
      quantity,
      pickupDate,
      pickupTime,
      address,
      requestedBy: role,
      status: "pending_ngo"            // MUST match enum
    });

    await donation.save();

    res.status(201).json({
      message: "Pickup request created successfully"
    });

  } catch (err) {
    console.error("DONATION CREATE ERROR:", err); // ⭐ ADD THIS
    res.status(500).json({ error: err.message });
  }
});
//CREATE EVENT
// CREATE EVENT (NGO)
app.post("/events/create", async (req, res) => {
  try {
    const { ngoId, title, description, date, location } = req.body;

    if (!ngoId || !title || !date || !location || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const event = new Event({
      ngoId,
      title,
      description,
      date,
      location,
      registeredUsers: []
    });

    await event.save();

    res.json({ message: "Event created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL EVENTS (Donor & Volunteer)
app.get("/events", async (req, res) => {
  try {
    const events = await Event.find().populate("ngoId", "name");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//get ngo events
app.get("/events/ngo/:ngoId", async (req, res) => {
  try {
    const events = await Event.find({ ngoId: req.params.ngoId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REGISTER FOR EVENT (Donor / Volunteer)
app.post("/events/register/:eventId", async (req, res) => {
  try {
    const { userId, role } = req.body;

    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "Upcoming") {
      return res.json({ message: "Event is not active" });
    }

    const alreadyRegistered = event.registeredUsers.some(
      u => u.userId === userId && u.role === role
    );

    if (alreadyRegistered) {
      return res.json({ message: "Already registered" });
    }

    event.registeredUsers.push({ userId, role });
    await event.save();

    res.json({ message: "Registered successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get("/donation/:donorId", async (req, res) => {
  const donations = await Donation.find({
    donorId: req.params.donorId
  });

  res.json(donations);
});
// NGO: SEE ALL DONATIONS REQUESTED BY NGO
app.get("/ngo/donations/:ngoId", async (req, res) => {
  try {
    const donations = await Donation.find({
      status: {
        $in: ["pending_ngo", "ngo_approved", "ngo_declined"]
      }
    }).populate("donorId", "name");

    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// NGO ACCEPT DONATION
app.post("/ngo/accept/:id", async (req, res) => {
  const donation = await Donation.findByIdAndUpdate(
    req.params.id,
    {
      status: "ngo_approved"
    },
    { new: true }
  );

  res.json(donation);
});

app.post("/ngo/decline/:id", async (req, res) => {
  const donation = await Donation.findByIdAndUpdate(
    req.params.id,
    { status: "declined" },
    { new: true }
  );

  res.json(donation);
});



// NGO: SEE ALL DONATIONS WAITING FOR NGO APPROVAL
app.get("/ngo/pending-donations", async (req, res) => {
  try {
    const donations = await Donation.find({
      status: "pending",
      requestedBy: "donor",
      ngoId: null
    }).populate("donorId", "name");

    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ADMIN: GET ALL USERS
app.get("/admin/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ADMIN: GET ALL DONATIONS
app.get("/admin/donations", async (req, res) => {
  const donations = await Donation.find()
    .populate("donorId", "name")
    .populate("ngoId", "name")
    .populate("volunteerId", "name");

  res.json(donations);
});
// VOLUNTEER: SEE ALL PENDING PICKUPS
app.get("/volunteer/pickups/:volunteerId", async (req, res) => {
  try {
    const { volunteerId } = req.params;

    const pickups = await Donation.find({
      $or: [
        { status: "ngo_approved" }, // 👈 NGO approved, waiting for volunteer
        { volunteerId: volunteerId } // 👈 already accepted by this volunteer
      ]
    })
      .populate("donorId", "name")
      .populate("ngoId", "name");

    res.json(pickups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// VOLUNTEER ACCEPT PICKUP
app.post("/volunteer/accept/:donationId", async (req, res) => {
  try {
    const { volunteerId } = req.body;

    const donation = await Donation.findByIdAndUpdate(
      req.params.donationId,
      {
        status: "accepted",
        volunteerId
      },
      { new: true }
    );

    res.json(donation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// VOLUNTEER DECLINE PICKUP
app.post("/volunteer/decline/:donationId", async (req, res) => {
  await Donation.findByIdAndUpdate(
    req.params.donationId,
    { status: "declined_by_volunteer" }
  );

  res.json({ message: "Pickup declined" });
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
app.put("/events/update/:eventId", async (req, res) => {
  try {
    const { title, description, date, location } = req.body;

    await Event.findByIdAndUpdate(req.params.eventId, {
      title,
      description,
      date,
      location
    });

    res.json({ message: "Event updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/events/update/:eventId", async (req, res) => {
  try {
    const { title, description, date, location } = req.body;

    await Event.findByIdAndUpdate(req.params.eventId, {
      title,
      description,
      date,
      location
    });

    res.json({ message: "Event updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/request/create", async (req, res) => {
  try {
    const { ngoId, category, quantity, date, description } = req.body;

    if (!ngoId || !category || !quantity || !date || !description) {
      return res.status(400).json({ message: "All fields required" });
    }

    const saved = await Request.create({
      ngoId,
      category,
      quantity,
      date,
      description,
      status: "pending",
      donorId: null,
      pickupStatus: "pending",
      acceptedAt: null
    });

    res.json({
      message: "Request created successfully",
      data: saved
    });

  } catch (err) {
    console.error("REQUEST ERROR:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});
app.get("/request/all", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];



    // update expired requests in DB
    await Request.updateMany(
      {
        status: { $ne: "accepted" },
        date: { $lt: today }
      },
      {
        $set: { status: "expired" }
      }
    );

    // fetch updated requests
    const requests = await Request.find()
      .populate("ngoId", "name")
      .populate("donorId", "name");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching requests" });
  }
});
app.post("/request/accept/:requestId", async (req, res) => {
  try {
    const { donorId, pickupDate } = req.body;

    const request = await Request.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // ❌ already accepted
    if (request.status === "accepted") {
      return res.status(400).json({
        message: "Already accepted"
      });
    }

    // ❌ expired
    const today = new Date().toISOString().split("T")[0];
    if (request.date < today) {
      return res.status(400).json({
        message: "Request expired"
      });
    }

    // ❌ invalid pickup date
    if (pickupDate > request.date) {
      return res.status(400).json({
        message: "Pickup date must be before NGO date"
      });
    }

    // ✅ update
    request.status = "accepted";
    request.donorId = donorId;
    request.acceptedAt = new Date();

    await request.save();

    res.json({ message: "Accepted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
setInterval(async () => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  await Request.deleteMany({
    status: "expired",
    acceptedAt: { $lt: twoDaysAgo }
  });

  console.log("Old expired requests deleted");
}, 1000 * 60 * 60); // every 1 hour
app.post("/request/picked/:id", async (req, res) => {
  await Request.findByIdAndUpdate(req.params.id, {
    pickupStatus: "picked"
  });
  res.json({ message: "Marked as picked" });
});

app.post("/request/delivered/:id", async (req, res) => {
  await Request.findByIdAndUpdate(req.params.id, {
    pickupStatus: "delivered"
  });
  res.json({ message: "Marked as delivered" });
});
