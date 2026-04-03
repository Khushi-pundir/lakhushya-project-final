require("dotenv").config();

const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const User = require("../models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lakhushya_db";

function normalizeLocationText(value = "") {
  return String(value)
    .replace(/UttarPradesh/gi, "Uttar Pradesh")
    .replace(/Lucknoq/gi, "Lucknow")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function pointFromUser(user) {
  if (!user?.location) {
    return null;
  }

  if (Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
    return {
      lng: user.location.coordinates[0],
      lat: user.location.coordinates[1],
    };
  }

  if (typeof user.location.latitude === "number" && typeof user.location.longitude === "number") {
    return {
      lat: user.location.latitude,
      lng: user.location.longitude,
    };
  }

  return null;
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

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function textMatchScore(reference = "", candidate = "") {
  if (!reference || !candidate) {
    return 0;
  }

  return normalizeLocationText(reference) === normalizeLocationText(candidate) ? 1 : 0;
}

async function getRankedNgoForDonation(donation, donor) {
  const donorPoint = donation.location?.donor || pointFromUser(donor);
  const ngos = await User.find({ role: "NGO" });

  const ranked = ngos
    .map((ngo) => {
      const ngoPoint = pointFromUser(ngo);
      const geoDistance = haversineKm(donorPoint, ngoPoint);
      const hasCoordinates = geoDistance !== Number.MAX_SAFE_INTEGER;
      const cityScore = textMatchScore(donor?.city, ngo?.city);
      const stateScore = textMatchScore(donor?.state, ngo?.state);

      return {
        ngo,
        point: ngoPoint,
        hasCoordinates,
        cityScore,
        stateScore,
        distanceKm: geoDistance,
      };
    })
    .sort((a, b) => {
      if (a.hasCoordinates !== b.hasCoordinates) {
        return a.hasCoordinates ? -1 : 1;
      }
      if (a.hasCoordinates && b.hasCoordinates && a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.cityScore !== b.cityScore) {
        return b.cityScore - a.cityScore;
      }
      if (a.stateScore !== b.stateScore) {
        return b.stateScore - a.stateScore;
      }
      return String(a.ngo.name || "").localeCompare(String(b.ngo.name || ""));
    });

  const filtered = ranked.some((entry) => entry.hasCoordinates)
    ? ranked.filter((entry) => entry.hasCoordinates)
    : ranked.filter((entry) => entry.cityScore > 0 || entry.stateScore > 0);

  return filtered[0] || null;
}

async function run() {
  await mongoose.connect(MONGODB_URI);

  const donations = await Donation.find({
    status: "pending_ngo",
  });

  let updated = 0;
  let skipped = 0;

  for (const donation of donations) {
    const donor = await User.findById(donation.donorId);
    if (!donor) {
      skipped += 1;
      console.log(`SKIP donation ${donation._id} donor missing`);
      continue;
    }

    const nextNgo = await getRankedNgoForDonation(donation, donor);
    if (!nextNgo) {
      skipped += 1;
      console.log(`SKIP donation ${donation._id} no ranked NGO found`);
      continue;
    }

    donation.currentNgoCandidate = nextNgo.ngo._id;
    donation.ngoAttempts = [nextNgo.ngo._id];
    donation.location = donation.location || {};
    donation.location.ngo = nextNgo.point || donation.location.ngo;
    donation.distanceKm = donation.distanceKm || {};
    donation.distanceKm.donorToNgo =
      nextNgo.distanceKm === Number.MAX_SAFE_INTEGER ? null : Number(nextNgo.distanceKm.toFixed(2));

    await donation.save();
    updated += 1;
    console.log(`DONE donation ${donation._id} -> ${nextNgo.ngo.name}`);
  }

  console.log("");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Reassignment failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    // no-op
  }
  process.exit(1);
});
