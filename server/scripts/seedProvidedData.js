require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const College = require("../models/College");
const User = require("../models/User");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const Claim = require("../models/Claim");
const Notification = require("../models/Notification");

const rawData = {
  colleges: [
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000001"),
      name: "Swaminarayan University",
      domain: "swaminarayanuniversity.ac.in",
      createdAt: new Date("2026-08-15T09:00:00.000Z"),
    },
  ],
  users: [
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000011"),
      fullName: "Kavya Mehta",
      email: "kavya.mehta@swaminarayanuniversity.ac.in",
      phone: "+91 9898123456",
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      createdAt: new Date("2026-08-16T08:00:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000012"),
      fullName: "Dev Prajapati",
      email: "dev.prajapati@swaminarayanuniversity.ac.in",
      phone: "+91 9925678901",
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      createdAt: new Date("2026-08-17T10:20:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000013"),
      fullName: "Riya Solanki",
      email: "riya.solanki@swaminarayanuniversity.ac.in",
      phone: "+91 9712233445",
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      createdAt: new Date("2026-08-18T11:45:00.000Z"),
    },
  ],
  lostItems: [
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000201"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000011"),
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "Silver Casio Wristwatch",
      description: "Silver Casio analog watch with a black leather strap, small scratch near the 6 o'clock mark.",
      category: "Other",
      location: "Sports Ground",
      dateLost: new Date("2026-08-29T00:00:00.000Z"),
      approxTime: "Evening",
      imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80",
      status: "lost",
      createdAt: new Date("2026-08-29T19:30:00.000Z"),
      updatedAt: new Date("2026-08-29T19:30:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000202"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000012"),
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "Samsung Galaxy Buds Case",
      description: "White Galaxy Buds charging case with a small crack on the lid hinge.",
      category: "Electronics",
      location: "Canteen",
      dateLost: new Date("2026-08-30T00:00:00.000Z"),
      approxTime: "Afternoon",
      imageUrl: "",
      status: "lost",
      createdAt: new Date("2026-08-30T14:10:00.000Z"),
      updatedAt: new Date("2026-08-30T14:10:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000203"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000013"),
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "Maroon Hostel ID Card",
      description: "Hostel ID card, name Riya Solanki, second year Pharmacy. Was clipped to my bag strap.",
      category: "ID Card",
      location: "Classroom",
      dateLost: new Date("2026-08-28T00:00:00.000Z"),
      approxTime: "Morning",
      imageUrl: "",
      status: "lost",
      createdAt: new Date("2026-08-28T09:50:00.000Z"),
      updatedAt: new Date("2026-08-28T09:50:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000204"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000011"),
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "Bunch of Hostel Room Keys",
      description: "Two keys on a plain metal ring, one for the room and one for a cupboard lock.",
      category: "Keys",
      location: "Parking",
      dateLost: new Date("2026-08-31T00:00:00.000Z"),
      approxTime: "Morning",
      imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80",
      status: "lost",
      createdAt: new Date("2026-08-31T08:15:00.000Z"),
      updatedAt: new Date("2026-08-31T08:15:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000205"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000012"),
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "Blue Sipper Water Bottle",
      description: "Milton blue steel sipper bottle with a dented cap, has a cricket team sticker on the side.",
      category: "Other",
      location: "Auditorium",
      dateLost: new Date("2026-08-27T00:00:00.000Z"),
      approxTime: "Afternoon",
      imageUrl: "",
      status: "returned",
      createdAt: new Date("2026-08-27T13:25:00.000Z"),
      updatedAt: new Date("2026-08-28T10:00:00.000Z"),
    },
  ],
  foundItems: [
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000301"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000013"), // Riya Solanki found it
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "Silver Wristwatch Found on Ground",
      description: "Found a silver analog wristwatch with a black strap near the sports ground benches.",
      category: "Other",
      location: "Sports Ground",
      dateFound: new Date("2026-08-29T00:00:00.000Z"),
      imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80",
      holdingLocation: "with_me",
      privateNotes: "Small scratch visible near the 6 o'clock marker, brand is Casio.",
      status: "claim_requested",
      createdAt: new Date("2026-08-29T20:00:00.000Z"),
      updatedAt: new Date("2026-08-30T09:00:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000302"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000011"),
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "Earphone Case Found in Canteen",
      description: "Found a white earbuds charging case left on a canteen table during lunch.",
      category: "Electronics",
      location: "Canteen",
      dateFound: new Date("2026-08-30T00:00:00.000Z"),
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
      holdingLocation: "college_office",
      privateNotes: "Small crack on the lid hinge, Samsung branding inside the lid.",
      status: "found",
      createdAt: new Date("2026-08-30T14:45:00.000Z"),
      updatedAt: new Date("2026-08-30T14:45:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000303"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000012"),
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "ID Card Found Near Classroom Block",
      description: "Found a hostel ID card lying near the classroom block stairs.",
      category: "ID Card",
      location: "Classroom",
      dateFound: new Date("2026-08-28T00:00:00.000Z"),
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      holdingLocation: "security_office",
      privateNotes: "Name printed as Riya S., Pharmacy department, second year.",
      status: "found",
      createdAt: new Date("2026-08-28T10:30:00.000Z"),
      updatedAt: new Date("2026-08-28T10:30:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000304"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000013"),
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "Bunch of Keys Found in Parking Area",
      description: "Found two keys on a plain metal ring near the two-wheeler parking area.",
      category: "Keys",
      location: "Parking",
      dateFound: new Date("2026-08-31T00:00:00.000Z"),
      imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80",
      holdingLocation: "with_me",
      privateNotes: "One key has a small red paint mark near the head.",
      status: "found",
      createdAt: new Date("2026-08-31T09:00:00.000Z"),
      updatedAt: new Date("2026-08-31T09:00:00.000Z"),
    },
    {
      _id: new mongoose.Types.ObjectId("66d500000000000000000305"),
      userId: new mongoose.Types.ObjectId("66d500000000000000000011"),
      collegeId: new mongoose.Types.ObjectId("66d500000000000000000001"),
      title: "Blue Water Bottle Found in Auditorium",
      description: "Found a blue steel sipper bottle left under a seat after the seminar.",
      category: "Other",
      location: "Classroom",
      dateFound: new Date("2026-08-27T00:00:00.000Z"),
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
      holdingLocation: "college_office",
      privateNotes: "Dented cap, has a cricket team sticker on the side.",
      status: "returned",
      createdAt: new Date("2026-08-27T14:00:00.000Z"),
      updatedAt: new Date("2026-08-28T10:00:00.000Z"),
    },
  ],
};

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI is not defined in .env");

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.\n");

    // 1. Seed or find College by domain
    let college = await College.findOne({ domain: "swaminarayanuniversity.ac.in" });
    if (!college) {
      college = await College.create(rawData.colleges[0]);
    } else {
      await College.findByIdAndUpdate(college._id, { name: rawData.colleges[0].name });
    }
    const collegeId = college._id;
    console.log(`✅ College ready: ${college.name} (${college.domain}) [_id: ${collegeId}]`);

    // 2. Standard password for all users so login always works: "Student@123"
    const salt = await bcrypt.genSalt(10);
    const standardPasswordHash = await bcrypt.hash("Student@123", salt);

    // 3. Seed Users (link with collegeId)
    const userMap = {};
    for (const u of rawData.users) {
      const userData = {
        ...u,
        collegeId: collegeId,
        passwordHash: standardPasswordHash,
      };
      // Upsert by email
      const existing = await User.findOneAndUpdate({ email: u.email }, userData, { upsert: true, new: true });
      userMap[u.email] = existing._id;
      console.log(`✅ User seeded: ${existing.fullName} (${existing.email}) [_id: ${existing._id}] [Password: Student@123]`);
    }

    const kavyaId = userMap["kavya.mehta@swaminarayanuniversity.ac.in"];
    const devId = userMap["dev.prajapati@swaminarayanuniversity.ac.in"];
    const riyaId = userMap["riya.solanki@swaminarayanuniversity.ac.in"];

    // Map the old IDs to actual user IDs
    const resolveUserId = (oldId) => {
      const str = oldId.toString();
      if (str.endsWith("11")) return kavyaId;
      if (str.endsWith("12")) return devId;
      if (str.endsWith("13")) return riyaId;
      return kavyaId;
    };

    // 4. Seed Lost Items
    for (const item of rawData.lostItems) {
      const itemData = {
        ...item,
        collegeId: collegeId,
        userId: resolveUserId(item.userId),
      };
      await LostItem.findByIdAndUpdate(item._id, itemData, { upsert: true, new: true });
      console.log(`✅ Lost Item seeded: "${item.title}"`);
    }

    // 5. Seed Found Items
    for (const item of rawData.foundItems) {
      const itemData = {
        ...item,
        collegeId: collegeId,
        userId: resolveUserId(item.userId),
      };
      await FoundItem.findByIdAndUpdate(item._id, itemData, { upsert: true, new: true });
      console.log(`✅ Found Item seeded: "${item.title}" [Status: ${item.status}]`);
    }

    // 6. Seed active Claim & Notification for Item 301
    const claimId = new mongoose.Types.ObjectId("66d500000000000000000401");
    const claimData = {
      _id: claimId,
      foundItemId: new mongoose.Types.ObjectId("66d500000000000000000301"),
      claimantId: kavyaId, // Kavya Mehta
      proofDetails: "It's my Casio watch with black strap! It has a tiny scratch right next to the 6 o'clock mark.",
      status: "pending",
      createdAt: new Date("2026-08-30T09:00:00.000Z"),
    };
    await Claim.findByIdAndUpdate(claimId, claimData, { upsert: true, new: true });
    console.log(`✅ Claim seeded: Kavya Mehta -> Silver Wristwatch [Status: pending]`);

    // Notification for Riya Solanki (the finder of Item 301)
    const notificationId = new mongoose.Types.ObjectId("66d500000000000000000501");
    const notificationData = {
      _id: notificationId,
      userId: riyaId, // Riya Solanki
      type: "claim_request",
      referenceId: claimId,
      title: "New Claim Request",
      body: 'Kavya Mehta has claimed your found item: "Silver Wristwatch Found on Ground". Review their proof details.',
      isRead: false,
      createdAt: new Date("2026-08-30T09:00:00.000Z"),
    };
    await Notification.findByIdAndUpdate(notificationId, notificationData, { upsert: true, new: true });
    console.log(`✅ Notification seeded for Riya Solanki: New Claim Request`);

    console.log("\n🎉 All dummy data successfully inserted into MongoDB Atlas!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    process.exit(1);
  }
}

seed();
