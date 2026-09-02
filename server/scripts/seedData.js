require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const College = require("../models/College");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    // 1. Find or create the primary college
    let college = await College.findOne({ domain: "paruluniversity.ac.in" });
    if (!college) {
      college = await College.findOne();
    }
    if (!college) {
      college = await College.create({
        name: "Parul University",
        domain: "paruluniversity.ac.in",
      });
    }
    console.log(`Using College: ${college.name} (${college._id})`);

    // 2. Sample Student Users
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash("Student@123", salt);

    const sampleUsersData = [
      {
        fullName: "Ravi Patel",
        email: "ravi.patel@paruluniversity.ac.in",
        phone: "+91 9876543210",
        collegeId: college._id,
        passwordHash: defaultPasswordHash,
      },
      {
        fullName: "Aarav Shah",
        email: "aarav.shah@paruluniversity.ac.in",
        phone: "+91 9823456781",
        collegeId: college._id,
        passwordHash: defaultPasswordHash,
      },
      {
        fullName: "Priya Sharma",
        email: "priya.sharma@paruluniversity.ac.in",
        phone: "+91 9712345678",
        collegeId: college._id,
        passwordHash: defaultPasswordHash,
      },
      {
        fullName: "Sneha Joshi",
        email: "sneha.joshi@paruluniversity.ac.in",
        phone: "+91 9634567892",
        collegeId: college._id,
        passwordHash: defaultPasswordHash,
      },
      {
        fullName: "Aman Verma",
        email: "aman.verma@paruluniversity.ac.in",
        phone: "+91 9543216789",
        collegeId: college._id,
        passwordHash: defaultPasswordHash,
      },
    ];

    const userMap = {};
    for (const u of sampleUsersData) {
      let existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        existingUser = await User.create(u);
      }
      userMap[u.fullName] = existingUser._id;
    }

    // Also get the main existing user if present
    const mainUser = await User.findOne({ email: "nitish@paruluniversity.ac.in" });
    const mainUserId = mainUser ? mainUser._id : userMap["Ravi Patel"];

    // 3. Sample Lost Items
    const sampleLostItems = [
      {
        userId: userMap["Ravi Patel"] || mainUserId,
        collegeId: college._id,
        title: "Black Leather Wallet",
        description: "Black bi-fold leather wallet with a small silver clasp. Had my college ID and a debit card inside.",
        category: "Wallet",
        location: "Library",
        dateLost: new Date("2026-08-27T00:00:00.000Z"),
        approxTime: "Afternoon",
        imageUrl: "",
        status: "lost",
      },
      {
        userId: userMap["Aarav Shah"] || mainUserId,
        collegeId: college._id,
        title: "iPhone 13 - Blue",
        description: "Blue iPhone 13 with a cracked corner on the screen protector. Has a transparent case with a college fest sticker on the back.",
        category: "Phone",
        location: "Canteen",
        dateLost: new Date("2026-08-26T00:00:00.000Z"),
        approxTime: "Evening",
        imageUrl: "https://images.unsplash.com/photo-1592286927505-b0e846f4f7a6?w=600&auto=format&fit=crop&q=80",
        status: "lost",
      },
      {
        userId: userMap["Ravi Patel"] || mainUserId,
        collegeId: college._id,
        title: "College ID Card",
        description: "Student ID card, name printed as Ravi Patel, third year Computer Engineering. Might have fallen near the seating area.",
        category: "ID Card",
        location: "Auditorium",
        dateLost: new Date("2026-08-25T00:00:00.000Z"),
        approxTime: "Morning",
        imageUrl: "",
        status: "lost",
      },
      {
        userId: userMap["Aman Verma"] || mainUserId,
        collegeId: college._id,
        title: "Set of Keys with Red Keychain",
        description: "Bunch of 4 keys (bike + hostel room) attached to a red rubber keychain shaped like a cricket bat.",
        category: "Keys",
        location: "Parking",
        dateLost: new Date("2026-08-28T00:00:00.000Z"),
        approxTime: "Morning",
        imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80",
        status: "returned",
      },
      {
        userId: userMap["Sneha Joshi"] || mainUserId,
        collegeId: college._id,
        title: "Grey Backpack",
        description: "Grey Wildcraft backpack with a laptop compartment. Had two notebooks and a charger inside.",
        category: "Bag",
        location: "Classroom",
        dateLost: new Date("2026-08-24T00:00:00.000Z"),
        approxTime: "Afternoon",
        imageUrl: "",
        status: "lost",
      },
    ];

    // 4. Sample Found Items
    const sampleFoundItems = [
      {
        userId: userMap["Priya Sharma"] || mainUserId,
        collegeId: college._id,
        title: "Black Wallet Found Near Library",
        description: "Found a black leather wallet near the library entrance steps. Handed over details are private, contact if it's yours.",
        category: "Wallet",
        location: "Library",
        dateFound: new Date("2026-08-27T00:00:00.000Z"),
        imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80",
        holdingLocation: "with_me",
        privateNotes: "Contains a debit card ending in 4521, one college ID card, and ₹350 cash.",
        status: "claim_requested",
      },
      {
        userId: userMap["Aman Verma"] || mainUserId,
        collegeId: college._id,
        title: "Blue Smartphone Found in Canteen",
        description: "Found a blue smartphone on a canteen table during lunch hours. Screen is locked.",
        category: "Phone",
        location: "Canteen",
        dateFound: new Date("2026-08-26T00:00:00.000Z"),
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
        holdingLocation: "college_office",
        privateNotes: "Lock screen wallpaper shows a dog photo. Has a cricket-themed sticker on the case back.",
        status: "found",
      },
      {
        userId: userMap["Ravi Patel"] || mainUserId,
        collegeId: college._id,
        title: "Keys with Red Keychain",
        description: "Found a bunch of keys with a red cricket-bat shaped keychain near the parking area.",
        category: "Keys",
        location: "Parking",
        dateFound: new Date("2026-08-28T00:00:00.000Z"),
        imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80",
        holdingLocation: "security_office",
        privateNotes: "4 keys total, one labeled 'Room 214' in marker.",
        status: "returned",
      },
      {
        userId: userMap["Aarav Shah"] || mainUserId,
        collegeId: college._id,
        title: "boAt Earphones in Sports Ground",
        description: "Found white wired earphones under a seat after the sports event near the ground.",
        category: "Electronics",
        location: "Parking",
        dateFound: new Date("2026-08-25T00:00:00.000Z"),
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
        holdingLocation: "with_me",
        privateNotes: "Left earbud has boAt logo, slightly worn cord near the jack.",
        status: "found",
      },
      {
        userId: userMap["Sneha Joshi"] || mainUserId,
        collegeId: college._id,
        title: "Notebook & Documents in Classroom",
        description: "Found a spiral notebook along with printed handout sheets left behind on a classroom bench.",
        category: "Documents",
        location: "Classroom",
        dateFound: new Date("2026-08-24T00:00:00.000Z"),
        imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
        holdingLocation: "college_office",
        privateNotes: "Name 'Priya S.' handwritten on the first page of the notebook.",
        status: "found",
      },
    ];

    // 5. Insert Lost Items (skip if already exists with same title)
    let lostInserted = 0;
    for (const item of sampleLostItems) {
      const exists = await LostItem.findOne({ title: item.title, collegeId: item.collegeId });
      if (!exists) {
        await LostItem.create(item);
        lostInserted++;
      }
    }
    console.log(`Inserted ${lostInserted} new lost items.`);

    // 6. Insert Found Items (skip if already exists with same title)
    let foundInserted = 0;
    for (const item of sampleFoundItems) {
      const exists = await FoundItem.findOne({ title: item.title, collegeId: item.collegeId });
      if (!exists) {
        await FoundItem.create(item);
        foundInserted++;
      }
    }
    console.log(`Inserted ${foundInserted} new found items.`);

    console.log("Seeding finished successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
