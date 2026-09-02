require("dotenv").config();
const mongoose = require("mongoose");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const Claim = require("../models/Claim");
const Notification = require("../models/Notification");

async function clearItems() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    const lostCountBefore = await LostItem.countDocuments();
    const foundCountBefore = await FoundItem.countDocuments();
    const claimCountBefore = await Claim.countDocuments();
    const notifCountBefore = await Notification.countDocuments();

    console.log(`Found before cleanup:`);
    console.log(`- Lost Items: ${lostCountBefore}`);
    console.log(`- Found Items: ${foundCountBefore}`);
    console.log(`- Claims: ${claimCountBefore}`);
    console.log(`- Notifications: ${notifCountBefore}`);

    const lostRes = await LostItem.deleteMany({});
    const foundRes = await FoundItem.deleteMany({});
    const claimRes = await Claim.deleteMany({});
    const notifRes = await Notification.deleteMany({});

    console.log(`\nSuccessfully deleted:`);
    console.log(`- Deleted ${lostRes.deletedCount} lost item(s)`);
    console.log(`- Deleted ${foundRes.deletedCount} found item(s)`);
    console.log(`- Deleted ${claimRes.deletedCount} claim(s)`);
    console.log(`- Deleted ${notifRes.deletedCount} notification(s)`);

    console.log("\nDatabase for lost and found items is now completely clean!");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing database:", err);
    process.exit(1);
  }
}

clearItems();
