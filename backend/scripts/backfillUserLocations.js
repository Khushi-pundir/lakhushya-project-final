require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lakhushya_db";

function hasLocation(user) {
  return Boolean(
    user?.location &&
      Array.isArray(user.location.coordinates) &&
      user.location.coordinates.length === 2 &&
      typeof user.location.latitude === "number" &&
      typeof user.location.longitude === "number"
  );
}

function normalizeText(value = "") {
  return String(value)
    .replace(/UttarPradesh/gi, "Uttar Pradesh")
    .replace(/Lucknoq/gi, "Lucknow")
    .replace(/\s+/g, " ")
    .trim();
}

async function geocodeUser(user) {
  const address = normalizeText(user.address);
  const city = normalizeText(user.city);
  const state = normalizeText(user.state);
  const pincode = normalizeText(user.pincode);
  const country = normalizeText(user.nationality || "India");

  const attempts = [...new Set(
    [
      `${address}, ${city}, ${state}, ${pincode}, ${country}`,
      `${city}, ${state}, ${pincode}, ${country}`,
      `${address}, ${city}, ${state}, ${country}`,
      `${city}, ${state}, ${country}`,
      `${state}, ${country}`,
    ].filter(Boolean)
  )];

  for (const query of attempts) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Lakhushya/1.0",
        },
      }
    );

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    if (data.length) {
      return {
        latitude: Number(data[0].lat),
        longitude: Number(data[0].lon),
      };
    }
  }

  return null;
}

async function run() {
  await mongoose.connect(MONGODB_URI);

  const users = await User.find({
    role: { $in: ["Donor", "NGO", "Volunteer"] },
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    if (hasLocation(user)) {
      skipped += 1;
      console.log(`SKIP  ${user.role}  ${user.name} already has coordinates`);
      continue;
    }

    const location = await geocodeUser(user);

    if (!location) {
      failed += 1;
      console.log(`FAIL  ${user.role}  ${user.name} could not be geocoded`);
      continue;
    }

    user.city = normalizeText(user.city);
    user.state = normalizeText(user.state);
    user.location = {
      type: "Point",
      coordinates: [location.longitude, location.latitude],
      latitude: location.latitude,
      longitude: location.longitude,
    };

    await user.save();
    updated += 1;
    console.log(
      `DONE  ${user.role}  ${user.name} -> ${location.latitude}, ${location.longitude}`
    );
  }

  console.log("");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Backfill failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    // no-op
  }
  process.exit(1);
});
