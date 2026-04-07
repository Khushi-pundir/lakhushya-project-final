require("dotenv").config();

const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { Server } = require("socket.io");

const User = require("./models/User");
const Donation = require("./models/Donation");
const Request = require("./models/Request");
const Event = require("./models/Event");
const Feedback = require("./models/Feedback");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lakhushya_db";
const MAX_NGO_DISTANCE_KM = Number(process.env.MAX_NGO_DISTANCE_KM || 70);
const PREFERRED_VOLUNTEER_DISTANCE_KM = Number(process.env.PREFERRED_VOLUNTEER_DISTANCE_KM || 70);

function createMailTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true
  });
}

const transporter = createMailTransport();
const pendingEmailOtps = new Map();

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function qrValueForDonation(donationId) {
  return `LAKHUSHYA-${donationId}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function getPointFromBody(source = {}) {
  const lat = source.lat ?? source.latitude ?? source?.location?.lat ?? source?.location?.latitude;
  const lng = source.lng ?? source.longitude ?? source?.location?.lng ?? source?.location?.longitude;

  if (lat === undefined || lng === undefined || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return null;
  }

  return {
    lat: Number(lat),
    lng: Number(lng)
  };
}

function pointFromUser(user) {
  if (!user?.location) {
    return null;
  }

  if (Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
    return {
      lng: user.location.coordinates[0],
      lat: user.location.coordinates[1]
    };
  }

  if (typeof user.location.latitude === "number" && typeof user.location.longitude === "number") {
    return {
      lat: user.location.latitude,
      lng: user.location.longitude
    };
  }

  return null;
}

function toGeoJSON(point) {
  if (!point) {
    return undefined;
  }

  return {
    type: "Point",
    coordinates: [point.lng, point.lat],
    latitude: point.lat,
    longitude: point.lng
  };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineKm(a, b) {
  if (!a || !b) {
    return Number.MAX_SAFE_INTEGER;
  }

  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const value =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  const arc = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  return earthRadiusKm * arc;
}

function estimateEtaMinutes(distanceKm, speedKmPerHour = 28) {
  if (!Number.isFinite(distanceKm) || distanceKm === Number.MAX_SAFE_INTEGER) {
    return null;
  }

  return Math.max(1, Math.round((distanceKm / speedKmPerHour) * 60));
}

function startOfDay(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPastDate(dateString) {
  const selected = startOfDay(dateString);
  if (!selected) {
    return true;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return selected < today;
}

function isValidPickupTime(timeValue) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(timeValue || ""));
  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes >= 9 * 60 && totalMinutes <= 21 * 60;
}

function cityMatchScore(reference = "", candidate = "") {
  if (!reference || !candidate) {
    return 0;
  }
  return reference.trim().toLowerCase() === candidate.trim().toLowerCase() ? 1 : 0;
}

function normalizeLocationText(value = "") {
  return String(value)
    .replace(/UttarPradesh/gi, "Uttar Pradesh")
    .replace(/Lucknoq/gi, "Lucknow")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function textMatchScore(reference = "", candidate = "") {
  if (!reference || !candidate) {
    return 0;
  }

  return normalizeLocationText(reference) === normalizeLocationText(candidate) ? 1 : 0;
}

async function geocodeFreeformAddress(addressParts = []) {
  const attempts = [...new Set(
    addressParts
      .filter(Boolean)
      .map((part) => String(part).trim())
      .filter(Boolean)
      .flatMap((full) => [full, `${full}, India`])
  )];

  for (const query of attempts) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Lakhushya/1.0"
          }
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      if (data.length) {
        return {
          lat: Number(data[0].lat),
          lng: Number(data[0].lon)
        };
      }
    } catch (error) {
      // no-op; keep trying fallback queries
    }
  }

  return null;
}

async function ensureUserHasLocation(user) {
  if (!user) {
    return null;
  }

  const existingPoint = pointFromUser(user);
  if (existingPoint) {
    return existingPoint;
  }

  const normalizedCity = normalizeLocationText(user.city);
  const normalizedState = normalizeLocationText(user.state);
  const queryParts = [
    [user.address, user.city, user.state, user.pincode, user.nationality || "India"].filter(Boolean).join(", "),
    [user.city, user.state, user.pincode, user.nationality || "India"].filter(Boolean).join(", "),
    [user.address, user.city, user.state].filter(Boolean).join(", "),
    [user.city, user.state].filter(Boolean).join(", ")
  ];

  const point = await geocodeFreeformAddress(queryParts);
  if (!point) {
    return null;
  }

  user.city = normalizedCity ? normalizedCity.replace(/\b\w/g, (char) => char.toUpperCase()) : user.city;
  user.state = normalizedState ? normalizedState.replace(/\b\w/g, (char) => char.toUpperCase()) : user.state;
  user.location = toGeoJSON(point);
  await user.save();

  return point;
}

async function sendOtpEmail(to, otp, subject, heading) {
  if (!to) {
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.EMAIL_USER || "no-reply@lakhushya.local",
    to,
    subject,
    html: `<h2>${heading}</h2><p>Your OTP is <strong>${otp}</strong>.</p><p>This OTP will expire in 10 minutes.</p>`
  });
}

function emitDonationUpdate(donation) {
  io.to(`donation:${donation._id}`).emit("donation:updated", donation);
  io.emit("admin:donation-updated", donation);

  if (donation.donorId) {
    io.to(`user:${donation.donorId}`).emit("user:donation-updated", donation);
  }
  if (donation.ngoId) {
    io.to(`user:${donation.ngoId}`).emit("user:donation-updated", donation);
  }
  if (donation.volunteerId) {
    io.to(`user:${donation.volunteerId}`).emit("user:donation-updated", donation);
  }
  if (donation.currentNgoCandidate) {
    io.to(`user:${donation.currentNgoCandidate}`).emit("user:donation-candidate", donation);
  }
  if (donation.currentVolunteerCandidate) {
    io.to(`user:${donation.currentVolunteerCandidate}`).emit("user:donation-candidate", donation);
  }
}

function donationMessage(status) {
  const map = {
    pending_ngo: "Donation created and shared with nearby NGOs.",
    ngo_approved: "An NGO accepted this donation.",
    ngo_declined: "The NGO declined. Reassigning to another nearby NGO.",
    pending_volunteer: "Searching for the nearest available volunteer.",
    accepted: "Volunteer assigned successfully.",
    pickup_pending: "Pickup is pending OTP confirmation.",
    picked_up: "Donation has been picked up.",
    delivered: "Donation delivered successfully.",
    failed: "Donation could not be fulfilled."
  };

  return map[status] || "Donation updated.";
}

async function addTimeline(donation, status, message) {
  donation.timeline.push({
    status,
    message: message || donationMessage(status)
  });
}

function serializeDonation(donation) {
  const donorPoint = donation.location?.donor || null;
  const ngoPoint = donation.location?.ngo || null;
  const volunteerPoint = donation.location?.volunteer || null;

  return {
    ...donation.toObject(),
    liveTracking: {
      donor: donorPoint,
      ngo: ngoPoint,
      volunteer: volunteerPoint
    },
    routeSummary: {
      donorToNgoKm: donation.distanceKm?.donorToNgo ?? null,
      donorToVolunteerKm: donation.distanceKm?.donorToVolunteer ?? null,
      volunteerToNgoKm: donation.distanceKm?.volunteerToNgo ?? null,
      pickupEtaMinutes: donation.etaMinutes?.donorToVolunteer ?? null,
      deliveryEtaMinutes: donation.etaMinutes?.volunteerToNgo ?? null
    }
  };
}

async function refreshRequestStatuses() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const requests = await Request.find({
    status: { $in: ["pending", "accepted"] }
  });

  for (const request of requests) {
    const expiry = startOfDay(request.expiryDate || request.date);
    if (expiry && expiry < today && request.status !== "fulfilled") {
      request.status = "expired";
      await request.save();
    }
  }
}

async function findRankedNGOs(donor, donorPoint) {
  const donorResolvedPoint = donorPoint || await ensureUserHasLocation(donor);
  const ngos = await User.find({
    role: "NGO",
    verified: true,
    verificationStatus: "approved"
  });
  const ngoEntries = await Promise.all(
    ngos.map(async (ngo) => {
      const ngoPoint = await ensureUserHasLocation(ngo);
      return { ngo, ngoPoint };
    })
  );
  const ranked = ngos
    .map((ngo, index) => {
      const ngoPoint = ngoEntries[index]?.ngoPoint || pointFromUser(ngo);
      const geoDistance = haversineKm(donorResolvedPoint, ngoPoint);
      const hasCoordinates = geoDistance !== Number.MAX_SAFE_INTEGER;
      const cityScore = textMatchScore(donor?.city, ngo?.city);
      const stateScore = textMatchScore(donor?.state, ngo?.state);
      return {
        ngo,
        hasCoordinates,
        cityScore,
        stateScore,
        score: hasCoordinates ? geoDistance : Number.MAX_SAFE_INTEGER,
        distanceKm: geoDistance
      };
    })
    .sort((a, b) => {
      if (a.hasCoordinates !== b.hasCoordinates) {
        return a.hasCoordinates ? -1 : 1;
      }
      if (a.hasCoordinates && b.hasCoordinates && a.score !== b.score) {
        return a.score - b.score;
      }
      if (a.cityScore !== b.cityScore) {
        return b.cityScore - a.cityScore;
      }
      if (a.stateScore !== b.stateScore) {
        return b.stateScore - a.stateScore;
      }
      return String(a.ngo.name || "").localeCompare(String(b.ngo.name || ""));
    });

  const anyWithCoordinates = ranked.some((entry) => entry.hasCoordinates);
  if (anyWithCoordinates) {
    return ranked.filter(
      (entry) => entry.hasCoordinates && entry.distanceKm <= MAX_NGO_DISTANCE_KM
    );
  }

  return ranked.filter((entry) => entry.cityScore > 0 || entry.stateScore > 0);
}

async function findRankedVolunteers(referenceUser, referencePoint, excludedIds = []) {
  const volunteers = await User.find({
    role: "Volunteer",
    availability: true,
    _id: { $nin: excludedIds }
  });
  const resolvedReferencePoint = referencePoint || await ensureUserHasLocation(referenceUser);
  const volunteerEntries = await Promise.all(
    volunteers.map(async (volunteer) => {
      const volunteerPoint = await ensureUserHasLocation(volunteer);
      return { volunteer, volunteerPoint };
    })
  );

  const ranked = volunteers
    .map((volunteer, index) => {
      const volunteerPoint = volunteerEntries[index]?.volunteerPoint || pointFromUser(volunteer);
      const distanceKm = haversineKm(resolvedReferencePoint, volunteerPoint);
      const cityBonus = cityMatchScore(referenceUser?.city, volunteer?.city);
      return {
        volunteer,
        score: distanceKm === Number.MAX_SAFE_INTEGER ? 10000 - cityBonus * 10 : distanceKm - cityBonus * 5,
        distanceKm
      };
    })
    .sort((a, b) => a.score - b.score);

  const nearby = ranked.filter(
    (entry) =>
      entry.distanceKm !== Number.MAX_SAFE_INTEGER &&
      entry.distanceKm <= PREFERRED_VOLUNTEER_DISTANCE_KM
  );

  return nearby.length ? nearby : ranked;
}

async function assignNextNgo(donation, donor) {
  const donorPoint = donation.location?.donor || await ensureUserHasLocation(donor);
  const ranked = await findRankedNGOs(donor, donorPoint);
  const tried = new Set((donation.ngoAttempts || []).map((id) => String(id)));
  const remaining = ranked.filter(({ ngo }) => !tried.has(String(ngo._id)));

  if (!remaining.length || (donation.ngoAttempts || []).length >= 3) {
    donation.currentNgoCandidate = null;
    donation.ngoId = null;
    donation.status = "failed";
    donation.workflowStatus = "FAILED";
    const failureMessage = ranked.length
      ? "No NGO accepted the donation within 3 attempts."
      : `No NGO nearby within ${MAX_NGO_DISTANCE_KM} km.`;
    await addTimeline(donation, donation.status, failureMessage);
    await donation.save();
    emitDonationUpdate(await loadDonation(donation._id));
    return null;
  }

  const nextNgo = remaining[0];
  donation.currentNgoCandidate = nextNgo.ngo._id;
  donation.ngoAttempts = [...(donation.ngoAttempts || []), nextNgo.ngo._id];
  donation.status = "pending_ngo";
  donation.workflowStatus = "PENDING_NGO";
  donation.location = donation.location || {};
  donation.location.ngo = pointFromUser(nextNgo.ngo) || await ensureUserHasLocation(nextNgo.ngo);
  donation.distanceKm = donation.distanceKm || {};
  donation.distanceKm.donorToNgo =
    nextNgo.distanceKm === Number.MAX_SAFE_INTEGER ? null : Number(nextNgo.distanceKm.toFixed(2));
  await addTimeline(donation, donation.status, `Donation offered to NGO ${nextNgo.ngo.name}.`);
  await donation.save();
  emitDonationUpdate(await loadDonation(donation._id));
  return nextNgo.ngo;
}

async function assignNextVolunteer(donation, ngo, donor) {
  const ranked = await findRankedVolunteers(
    ngo || donor,
    pointFromUser(ngo) || await ensureUserHasLocation(ngo) || donation.location?.ngo || donation.location?.donor,
    donation.volunteerAttempts || []
  );

  if (!ranked.length) {
    donation.currentVolunteerCandidate = null;
    donation.noVolunteerAvailable = true;
    donation.status = "ngo_approved";
    donation.workflowStatus = "NGO_ACCEPTED";
    await addTimeline(donation, donation.status, "No volunteers available right now.");
    await donation.save();
    emitDonationUpdate(await loadDonation(donation._id));
    return null;
  }

  const nextVolunteer = ranked[0];
  donation.currentVolunteerCandidate = nextVolunteer.volunteer._id;
  donation.volunteerAttempts = [...(donation.volunteerAttempts || []), nextVolunteer.volunteer._id];
  donation.noVolunteerAvailable = false;
  donation.status = "ngo_approved";
  donation.workflowStatus = "PENDING_VOLUNTEER";
  donation.location = donation.location || {};
  donation.location.volunteer = pointFromUser(nextVolunteer.volunteer) || await ensureUserHasLocation(nextVolunteer.volunteer);
  donation.distanceKm = donation.distanceKm || {};
  donation.distanceKm.donorToVolunteer =
    nextVolunteer.distanceKm === Number.MAX_SAFE_INTEGER ? null : Number(nextVolunteer.distanceKm.toFixed(2));
  donation.etaMinutes = donation.etaMinutes || {};
  donation.etaMinutes.donorToVolunteer = estimateEtaMinutes(nextVolunteer.distanceKm);
  await addTimeline(donation, "pending_volunteer", `Volunteer request sent to ${nextVolunteer.volunteer.name}.`);
  await donation.save();
  emitDonationUpdate(await loadDonation(donation._id));
  return nextVolunteer.volunteer;
}

async function createCheckpointOtp({ donation, key, recipientUser, subject, heading }) {
  const otp = generateOtp();
  donation.otp = donation.otp || {};
  donation.otp[key] = {
    code: otp,
    sentToUserId: recipientUser?._id || null,
    sentAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  };
  await donation.save();
  await sendOtpEmail(recipientUser?.email, otp, subject, heading);
  emitDonationUpdate(await loadDonation(donation._id));
  return otp;
}

async function loadDonation(id) {
  return Donation.findById(id)
    .populate("donorId", "name email phone address city state location impactScore")
    .populate("ngoId", "name email phone address city state location")
    .populate("volunteerId", "name email phone address city state location points availability")
    .populate("currentNgoCandidate", "name email phone address city state location")
    .populate("currentVolunteerCandidate", "name email phone address city state location points");
}

async function ensureDonationExists(id, res) {
  const donation = await Donation.findById(id);
  if (!donation) {
    res.status(404).json({ message: "Donation not found" });
    return null;
  }
  return donation;
}

io.on("connection", (socket) => {
  socket.on("join:user", (userId) => {
    socket.join(`user:${userId}`);
  });

  socket.on("join:donation", (donationId) => {
    socket.join(`donation:${donationId}`);
  });

  socket.emit("socket:ready", { ok: true, platform: "Lakhushya" });
});

app.get("/check", async (req, res) => {
  res.json({
    ok: true,
    platform: "Lakhushya",
    tagline: "Connecting Donations with Purpose",
    timestamp: new Date().toISOString()
  });
});

app.post("/send-otp", async (req, res) => {
  try {
    const { email, type = "register" } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (type === "register" && existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    if (type === "forgot" && !existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();

    if (existingUser) {
      existingUser.otp = otp;
      existingUser.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      existingUser.latestOtpPurpose = type;
      await existingUser.save();
    } else {
      pendingEmailOtps.set(cleanEmail, {
        otp,
        purpose: type,
        expiresAt: Date.now() + 5 * 60 * 1000
      });
    }

    await sendOtpEmail(
      cleanEmail,
      otp,
      "Lakhushya OTP Verification",
      "Your Lakhushya OTP"
    );

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "");
    const user = await User.findOne({ email });

    if (user) {
      const valid = user.otp === otp && user.otpExpiry && user.otpExpiry > new Date();
      return res.status(valid ? 200 : 400).json({
        message: valid ? "OTP verified successfully" : "Invalid OTP"
      });
    }

    const pending = pendingEmailOtps.get(email);
    const valid = pending && pending.otp === otp && pending.expiresAt > Date.now();

    return res.status(valid ? 200 : 400).json({
      message: valid ? "OTP verified successfully" : "Invalid OTP"
    });
  } catch (error) {
    res.status(500).json({ message: "OTP verification failed" });
  }
});

app.post("/register", async (req, res) => {
  try {
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

    const cleanEmail = normalizeEmail(email);
    if (!name || !cleanEmail || !password || !role) {
      return res.status(400).send("Name, email, password and role are required");
    }

    if (role === "Admin") {
      return res.status(403).send("Admin registration not allowed");
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const point = getPointFromBody(req.body);
    const user = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      password: String(password),
      role,
      phone,
      address,
      pincode,
      city,
      state,
      nationality,
      dob,
      location: toGeoJSON(point),
      availability: role === "Volunteer" ? true : undefined,
      points: role === "Volunteer" ? 0 : undefined,
      verified: role === "NGO" ? false : true,
      verificationStatus: role === "NGO" ? "pending" : "approved",
      verifiedAt: role === "NGO" ? undefined : new Date()
    });

    res.send(role === "NGO"
      ? "NGO registered successfully and is pending admin verification"
      : "User registered successfully");
  } catch (error) {
    res.status(500).send(error.message || "Registration failed");
  }
});

app.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "").trim();
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).send("Invalid email or password");
    }

    if (user.role === "NGO" && (!user.verified || user.verificationStatus !== "approved")) {
      return res.status(403).send(
        user.verificationStatus === "rejected"
          ? "NGO registration was rejected by admin"
          : "NGO is pending admin verification"
      );
    }

    res.json({
      message: "Login successful",
      name: user.name,
      role: user.role,
      userId: user._id
    });
  } catch (error) {
    res.status(500).send("Login failed");
  }
});

app.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("name role email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Unable to load user profile" });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "");
    const newPassword = String(req.body.newPassword || "");
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.latestOtpPurpose = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed" });
  }
});

app.post("/donation/create", async (req, res) => {
  try {
    const {
      userId,
      role = "donor",
      category,
      donationType,
      quantity,
      itemName,
      description,
      pickupDate,
      date,
      pickupTime,
      time,
      address,
      pickupAddress,
      mobile,
      mobileNumber,
      deliveryMode,
      requestId
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User not logged in" });
    }
    
    const donor = await User.findById(userId);
    if (!donor || donor.role !== "Donor") {
      return res.status(404).json({ message: "Donor not found" });
    }

    const resolvedDate = pickupDate || date;
    const resolvedTime = pickupTime || time || "";
    const resolvedAddress = pickupAddress || address;
    const resolvedMode = deliveryMode || (resolvedTime ? "SCHEDULE_PICKUP" : "SELF_DELIVERY");
    const resolvedType = donationType || category;

    if (!resolvedType || !quantity || !resolvedAddress || !resolvedDate) {
      return res.status(400).json({ message: "Donation details are incomplete" });
    }

    if (isPastDate(resolvedDate)) {
      return res.status(400).json({ message: "Date cannot be in the past" });
    }

    if (resolvedMode === "SCHEDULE_PICKUP" && !isValidPickupTime(resolvedTime)) {
      return res.status(400).json({ message: "Pickup time must be between 9 AM and 9 PM" });
    }

    if (requestId) {
      const linkedRequest = await Request.findById(requestId);
      if (!linkedRequest) {
        return res.status(404).json({ message: "Linked request not found" });
      }
      if (linkedRequest.status !== "pending") {
        return res.status(400).json({ message: "Request already fulfilled or unavailable" });
      }
    }

    const donorPoint = getPointFromBody(req.body) || pointFromUser(donor);
    const donation = await Donation.create({
      donorId: donor._id,
      requestedBy: role,
      donationType: resolvedType,
      category: resolvedType,
      quantity: Number(quantity),
      description: description || itemName || "",
      itemName: itemName || description || "",
      pickupAddress: resolvedAddress,
      address: resolvedAddress,
      mobileNumber: mobileNumber || mobile || donor.phone,
      date: resolvedDate,
      pickupDate: resolvedDate,
      time: resolvedTime,
      pickupTime: resolvedTime,
      deliveryMode: resolvedMode,
      status: "pending_ngo",
      workflowStatus: "PENDING_NGO",
      qrCode: qrValueForDonation(new mongoose.Types.ObjectId().toString()),
      requestId: requestId || null,
      location: {
        donor: donorPoint,
        lastUpdatedBy: donor._id.toString()
      },
      timeline: [
        {
          status: "pending_ngo",
          message: "Donation created successfully."
        }
      ]
    });

    donation.qrCode = qrValueForDonation(donation._id.toString());
    await donation.save();

    if (requestId) {
      const request = await Request.findById(requestId);
      if (request) {
        request.status = "accepted";
        request.donorId = donor._id;
        request.donationId = donation._id;
        request.acceptedAt = new Date();
        await request.save();
      }
    }

    await assignNextNgo(donation, donor);
    const populated = await loadDonation(donation._id);
    const creationMessage =
      populated?.status === "failed"
        ? `No NGO nearby within ${MAX_NGO_DISTANCE_KM} km`
        : "Donation created successfully";
    res.status(201).json({
      message: creationMessage,
      donation: serializeDonation(populated)
    });
  } catch (error) {
    console.error("DONATION CREATE ERROR:", error);
    res.status(500).json({ message: error.message || "Donation creation failed", error: error.message });
  }
});

app.get("/donation/:donorId", async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.params.donorId })
      .sort({ createdAt: -1 })
      .populate("donorId", "name email phone address city state location impactScore")
      .populate("ngoId", "name address city state location")
      .populate("volunteerId", "name phone points")
      .populate("currentNgoCandidate", "name address city state location")
      .populate("currentVolunteerCandidate", "name phone points");

    res.json(donations.map((donation) => serializeDonation(donation)));
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch donations" });
  }
});

app.get("/donation/details/:id", async (req, res) => {
  try {
    const donation = await loadDonation(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }
    res.json(serializeDonation(donation));
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch donation" });
  }
});

app.get("/ngo/donations/:ngoId", async (req, res) => {
  try {
    const donations = await Donation.find({
      $or: [
        { currentNgoCandidate: req.params.ngoId },
        { ngoId: req.params.ngoId }
      ]
    })
      .sort({ createdAt: -1 })
      .populate("donorId", "name phone address city state")
      .populate("ngoId", "name phone address city state")
      .populate("volunteerId", "name phone points");

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch NGO donations" });
  }
});

app.post("/ngo/accept/:id", async (req, res) => {
  try {
    const donation = await ensureDonationExists(req.params.id, res);
    if (!donation) {
      return;
    }

    const ngoId = donation.currentNgoCandidate || req.body.ngoId;
    const ngo = await User.findById(ngoId);
    const donor = await User.findById(donation.donorId);

    if (!ngo) {
      return res.status(400).json({ message: "No NGO is currently assigned to this donation" });
    }

    donation.ngoId = ngo._id;
    donation.currentNgoCandidate = null;
    donation.status = "ngo_approved";
    donation.workflowStatus =
      donation.deliveryMode === "SELF_DELIVERY" ? "SELF_DELIVERY_PENDING" : "NGO_ACCEPTED";
    donation.location = donation.location || {};
    donation.location.ngo = pointFromUser(ngo);
    donation.distanceKm = donation.distanceKm || {};
    const donorNgoDistance = haversineKm(donation.location?.donor, donation.location?.ngo);
    donation.distanceKm.donorToNgo =
      donorNgoDistance === Number.MAX_SAFE_INTEGER ? null : Number(donorNgoDistance.toFixed(2));
    await addTimeline(donation, "ngo_approved", `${ngo.name} accepted the donation.`);
    await donation.save();

    await createCheckpointOtp({
      donation,
      key: donation.deliveryMode === "SELF_DELIVERY" ? "selfDelivery" : "ngoAcceptance",
      recipientUser: ngo,
      subject: "Lakhushya NGO OTP",
      heading: donation.deliveryMode === "SELF_DELIVERY"
        ? "OTP for self delivery confirmation"
        : "OTP for NGO handover confirmation"
    });

    if (donation.deliveryMode === "SCHEDULE_PICKUP") {
      await assignNextVolunteer(donation, ngo, donor);
    }

    res.json({
      message: "Donation accepted by NGO",
      donation: serializeDonation(await loadDonation(donation._id))
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to accept donation", error: error.message });
  }
});

app.post("/ngo/decline/:id", async (req, res) => {
  try {
    const donation = await ensureDonationExists(req.params.id, res);
    if (!donation) {
      return;
    }

    donation.status = "ngo_declined";
    donation.workflowStatus = "NGO_REJECTED";
    await addTimeline(donation, "ngo_declined", "NGO declined the donation. Trying the next nearest NGO.");
    await donation.save();

    const donor = await User.findById(donation.donorId);
    await assignNextNgo(donation, donor);

    const updated = await loadDonation(donation._id);
    res.json({
      message:
        updated.status === "failed"
          ? ((updated.ngoAttempts || []).length
              ? "All NGO attempts exhausted"
              : `No NGO nearby within ${MAX_NGO_DISTANCE_KM} km`)
          : "Donation sent to next NGO",
      donation: serializeDonation(updated)
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to decline donation", error: error.message });
  }
});

app.get("/volunteer/pickups/:volunteerId", async (req, res) => {
  try {
    const donations = await Donation.find({
      $or: [
        { currentVolunteerCandidate: req.params.volunteerId },
        { volunteerId: req.params.volunteerId }
      ]
    })
      .sort({ createdAt: -1 })
      .populate("donorId", "name phone address city state points")
      .populate("ngoId", "name phone address city state")
      .populate("volunteerId", "name phone points")
      .populate("currentVolunteerCandidate", "name phone points");

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch volunteer tasks" });
  }
});

app.post("/volunteer/accept/:id", async (req, res) => {
  try {
    const donation = await ensureDonationExists(req.params.id, res);
    if (!donation) {
      return;
    }

    const volunteerId = req.body.volunteerId || donation.currentVolunteerCandidate;
    const volunteer = await User.findById(volunteerId);
    if (!volunteer) {
      return res.status(400).json({ message: "Volunteer not found" });
    }

    donation.volunteerId = volunteer._id;
    donation.currentVolunteerCandidate = null;
    donation.status = "accepted";
    donation.workflowStatus = "VOLUNTEER_ASSIGNED";
    donation.location = donation.location || {};
    donation.location.volunteer = pointFromUser(volunteer);
    donation.distanceKm = donation.distanceKm || {};
    const donorVolunteerDistance = haversineKm(donation.location?.donor, donation.location?.volunteer);
    const volunteerNgoDistance = haversineKm(donation.location?.volunteer, donation.location?.ngo);
    donation.distanceKm.donorToVolunteer =
      donorVolunteerDistance === Number.MAX_SAFE_INTEGER ? null : Number(donorVolunteerDistance.toFixed(2));
    donation.distanceKm.volunteerToNgo =
      volunteerNgoDistance === Number.MAX_SAFE_INTEGER ? null : Number(volunteerNgoDistance.toFixed(2));
    donation.etaMinutes = donation.etaMinutes || {};
    donation.etaMinutes.donorToVolunteer = estimateEtaMinutes(donation.distanceKm.donorToVolunteer);
    donation.etaMinutes.volunteerToNgo = estimateEtaMinutes(donation.distanceKm.volunteerToNgo);
    await addTimeline(donation, "accepted", `${volunteer.name} accepted the volunteer task.`);
    await donation.save();

    const donor = await User.findById(donation.donorId);
    await createCheckpointOtp({
      donation,
      key: "pickup",
      recipientUser: donor,
      subject: "Lakhushya Pickup OTP",
      heading: "OTP for volunteer pickup verification"
    });

    res.json({
      message: "Volunteer assigned successfully",
      donation: serializeDonation(await loadDonation(donation._id))
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to accept volunteer task", error: error.message });
  }
});

app.post("/volunteer/decline/:id", async (req, res) => {
  try {
    const donation = await ensureDonationExists(req.params.id, res);
    if (!donation) {
      return;
    }

    donation.status = "pending_volunteer";
    await addTimeline(donation, "pending_volunteer", "Volunteer declined. Searching for the next volunteer.");
    await donation.save();

    const ngo = donation.ngoId ? await User.findById(donation.ngoId) : null;
    const donor = await User.findById(donation.donorId);
    await assignNextVolunteer(donation, ngo, donor);

    res.json({
      message: "Volunteer reassignment attempted",
      donation: serializeDonation(await loadDonation(donation._id))
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to decline volunteer task", error: error.message });
  }
});

app.post("/donation/:id/pickup/verify", async (req, res) => {
  try {
    const donation = await ensureDonationExists(req.params.id, res);
    if (!donation) {
      return;
    }

    const otp = String(req.body.otp || "");
    const checkpoint = donation.otp?.pickup;
    if (!checkpoint?.code || checkpoint.code !== otp || new Date(checkpoint.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    checkpoint.verifiedAt = new Date();
    checkpoint.verifiedByUserId = req.body.volunteerId || donation.volunteerId;
    donation.status = "picked_up";
    donation.workflowStatus = "PICKED_UP";
    await addTimeline(donation, "picked_up", "Pickup verified successfully.");
    await donation.save();

    const volunteer = donation.volunteerId ? await User.findById(donation.volunteerId) : null;
    if (volunteer) {
      volunteer.points = (volunteer.points || 0) + 10;
      await volunteer.save();
    }

    res.json({
      message: "Pickup verified",
      donation: serializeDonation(await loadDonation(donation._id))
    });
  } catch (error) {
    res.status(500).json({ message: "Pickup verification failed", error: error.message });
  }
});

app.post("/donation/:id/ngo-delivery/verify", async (req, res) => {
  try {
    const donation = await ensureDonationExists(req.params.id, res);
    if (!donation) {
      return;
    }

    const otp = String(req.body.otp || "");
    const checkpoint = donation.otp?.ngoAcceptance;
    if (!checkpoint?.code || checkpoint.code !== otp || new Date(checkpoint.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    checkpoint.verifiedAt = new Date();
    checkpoint.verifiedByUserId = req.body.volunteerId || donation.volunteerId;
    donation.status = "delivered";
    donation.workflowStatus = "DELIVERED";
    await addTimeline(donation, "delivered", "Donation delivered to NGO.");
    await donation.save();

    const donor = donation.donorId ? await User.findById(donation.donorId) : null;
    if (donor) {
      donor.impactScore = (donor.impactScore || 0) + 5;
      donor.points = (donor.points || 0) + 20;
      await donor.save();
    }

    const volunteer = donation.volunteerId ? await User.findById(donation.volunteerId) : null;
    if (volunteer) {
      volunteer.points = (volunteer.points || 0) + 15;
      await volunteer.save();
    }

    if (donation.requestId) {
      const request = await Request.findById(donation.requestId);
      if (request) {
        request.status = "fulfilled";
        request.fulfilledAt = new Date();
        request.pickupStatus = "delivered";
        await request.save();
      }
    }

    res.json({
      message: "NGO delivery verified",
      donation: serializeDonation(await loadDonation(donation._id))
    });
  } catch (error) {
    res.status(500).json({ message: "NGO verification failed", error: error.message });
  }
});

app.post("/donation/:id/self-delivery/verify", async (req, res) => {
  try {
    const donation = await ensureDonationExists(req.params.id, res);
    if (!donation) {
      return;
    }

    const otp = String(req.body.otp || "");
    const checkpoint = donation.otp?.selfDelivery;
    if (!checkpoint?.code || checkpoint.code !== otp || new Date(checkpoint.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    checkpoint.verifiedAt = new Date();
    checkpoint.verifiedByUserId = req.body.donorId || donation.donorId;
    donation.status = "delivered";
    donation.workflowStatus = "DELIVERED";
    await addTimeline(donation, "delivered", "Self delivery verified successfully.");
    await donation.save();

    const donor = donation.donorId ? await User.findById(donation.donorId) : null;
    if (donor) {
      donor.impactScore = (donor.impactScore || 0) + 5;
      donor.points = (donor.points || 0) + 20;
      await donor.save();
    }

    res.json({
      message: "Self delivery verified",
      donation: serializeDonation(await loadDonation(donation._id))
    });
  } catch (error) {
    res.status(500).json({ message: "Self delivery verification failed", error: error.message });
  }
});

app.post("/tracking/location", async (req, res) => {
  try {
    const { donationId, actorType, actorId } = req.body;
    const point = getPointFromBody(req.body);

    if (!donationId || !actorType || !point) {
      return res.status(400).json({ message: "Donation, actor type and location are required" });
    }

    const donation = await ensureDonationExists(donationId, res);
    if (!donation) {
      return;
    }

    donation.location = donation.location || {};
    donation.location[actorType] = point;
    donation.location.lastUpdatedBy = actorType;
    donation.trackingHistory.push({
      actorType,
      actorId: actorId || null,
      location: point
    });

    if (actorType === "volunteer") {
      donation.distanceKm = donation.distanceKm || {};
      const donorVolunteerDistance = haversineKm(donation.location?.donor, point);
      const volunteerNgoDistance = haversineKm(point, donation.location?.ngo);
      donation.distanceKm.donorToVolunteer =
        donorVolunteerDistance === Number.MAX_SAFE_INTEGER ? null : Number(donorVolunteerDistance.toFixed(2));
      donation.distanceKm.volunteerToNgo =
        volunteerNgoDistance === Number.MAX_SAFE_INTEGER ? null : Number(volunteerNgoDistance.toFixed(2));
      donation.etaMinutes = donation.etaMinutes || {};
      donation.etaMinutes.donorToVolunteer = estimateEtaMinutes(donation.distanceKm.donorToVolunteer);
      donation.etaMinutes.volunteerToNgo = estimateEtaMinutes(donation.distanceKm.volunteerToNgo);
    }

    await donation.save();
    const populated = await loadDonation(donation._id);
    emitDonationUpdate(populated);
    io.to(`donation:${donation._id}`).emit("tracking:update", serializeDonation(populated));

    res.json({
      message: "Location updated",
      donation: serializeDonation(populated)
    });
  } catch (error) {
    res.status(500).json({ message: "Location update failed", error: error.message });
  }
});

app.get("/tracking/:donationId", async (req, res) => {
  try {
    const donation = await loadDonation(req.params.donationId);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json(serializeDonation(donation));
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch tracking data" });
  }
});

app.post("/request/create", async (req, res) => {
  try {
    const { ngoId, category, quantity, date, description, title, urgency } = req.body;

    if (!ngoId || !category || !quantity || !date || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isPastDate(date)) {
      return res.status(400).json({ message: "Date cannot be in past" });
    }

    const request = await Request.create({
      ngoId,
      title: title || `${category} needed`,
      category,
      itemType: category,
      quantity: Number(quantity),
      quantityNeeded: Number(quantity),
      date,
      expiryDate: date,
      description,
      urgency: urgency || "MEDIUM"
    });

    res.json({ message: "Request published successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Request creation failed", error: error.message });
  }
});

app.get("/request/all", async (req, res) => {
  try {
    await refreshRequestStatuses();
    const requests = await Request.find({
      status: { $ne: "expired" }
    })
      .sort({ createdAt: -1 })
      .populate("ngoId", "name city state")
      .populate("donorId", "name email")
      .populate("donationId", "status quantity category");

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch requests" });
  }
});

app.post("/request/accept/:requestId", async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already fulfilled or accepted" });
    }

    request.status = "accepted";
    request.donorId = req.body.donorId || request.donorId;
    request.acceptedAt = new Date();
    await request.save();

    res.json({ message: "Request accepted successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Unable to accept request", error: error.message });
  }
});

app.post("/feedback", async (req, res) => {
  try {
    const { donationId, donorId, rating, message } = req.body;
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    const feedback = await Feedback.create({
      donationId,
      donorId,
      ngoId: donation.ngoId,
      volunteerId: donation.volunteerId,
      rating: Number(rating),
      message: message || ""
    });

    res.status(201).json({ message: "Feedback submitted", feedback });
  } catch (error) {
    res.status(500).json({ message: "Unable to save feedback", error: error.message });
  }
});

app.get("/admin/feedback", async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate("donationId", "category status")
      .populate("donorId", "name")
      .populate("ngoId", "name")
      .populate("volunteerId", "name");

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch feedback" });
  }
});

app.get("/donation/:id/qr", async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).select("qrCode");
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json({ qrCode: donation.qrCode });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch QR code" });
  }
});

app.post("/qr/verify", async (req, res) => {
  try {
    const qrCode = String(req.body.qrCode || "");
    const donation = await Donation.findOne({ qrCode });

    if (!donation) {
      return res.status(404).json({ message: "Invalid QR code" });
    }

    res.json({
      message: "QR verified successfully",
      donationId: donation._id,
      status: donation.status
    });
  } catch (error) {
    res.status(500).json({ message: "QR verification failed" });
  }
});

app.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch users" });
  }
});

app.get("/admin/pending-ngos", async (req, res) => {
  try {
    const pendingNgos = await User.find({
      role: "NGO",
      $or: [
        { verificationStatus: "pending" },
        { verificationStatus: { $exists: false }, verified: false }
      ]
    }).sort({ createdAt: -1 });

    res.json(pendingNgos);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch pending NGOs" });
  }
});

app.post("/admin/verify-ngo/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || user.role !== "NGO") {
      return res.status(404).json({ message: "NGO not found" });
    }

    user.verified = true;
    user.verificationStatus = "approved";
    user.verifiedAt = new Date();
    user.verifiedByAdminId = req.body.adminId || null;
    await user.save();

    res.json({ message: "NGO verified successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Unable to verify NGO" });
  }
});

app.post("/admin/reject-ngo/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || user.role !== "NGO") {
      return res.status(404).json({ message: "NGO not found" });
    }

    user.verified = false;
    user.verificationStatus = "rejected";
    user.verifiedAt = undefined;
    user.verifiedByAdminId = req.body.adminId || null;
    await user.save();

    res.json({ message: "NGO rejected successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Unable to reject NGO" });
  }
});

app.get("/admin/donations", async (req, res) => {
  try {
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .populate("donorId", "name role")
      .populate("ngoId", "name role")
      .populate("volunteerId", "name role");
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch donations" });
  }
});

app.get("/admin/analytics", async (req, res) => {
  try {
    const [totalDonations, activeDeliveries, users, feedback, donations] = await Promise.all([
      Donation.countDocuments(),
      Donation.countDocuments({ status: { $in: ["accepted", "picked_up", "pickup_pending"] } }),
      User.find({}, "role"),
      Feedback.find().sort({ createdAt: -1 }).limit(20).populate("donationId", "category status"),
      Donation.find().select("category status createdAt")
    ]);

    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const donationsByCategory = donations.reduce((acc, donation) => {
      acc[donation.category] = (acc[donation.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalDonations,
      activeDeliveries,
      totalUsers: users.length,
      usersByRole,
      donationsByCategory,
      feedback
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch analytics" });
  }
});

app.get("/admin/live-map", async (req, res) => {
  try {
    const donations = await Donation.find({
      status: { $in: ["accepted", "picked_up"] }
    })
      .populate("donorId", "name")
      .populate("ngoId", "name")
      .populate("volunteerId", "name");

    res.json(donations.map((donation) => serializeDonation(donation)));
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch live deliveries" });
  }
});

app.post("/events/create", async (req, res) => {
  try {
    const { ngoId, title, description, date, location } = req.body;

    if (!ngoId || !title || !date || !location || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const event = await Event.create({
      ngoId,
      title,
      description,
      date,
      location,
      registeredUsers: []
    });

    res.json({ message: "Event created successfully", event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/events", async (req, res) => {
  try {
    const events = await Event.find().populate("ngoId", "name");
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    await refreshRequestStatuses();
    setInterval(() => {
      refreshRequestStatuses().catch(() => {});
    }, 60 * 1000);

    server.listen(PORT, () => {
      console.log(`Lakhushya backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
