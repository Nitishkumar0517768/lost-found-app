const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const College = require("../models/College");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Register/Signup
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, phone, collegeName, profilePic } = req.body;

    if (!fullName || !email || !password || !phone || !collegeName) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailParts = normalizedEmail.split("@");
    if (emailParts.length !== 2 || !emailParts[1].includes(".")) {
      return res.status(400).json({ error: "Invalid email format. Please provide a valid college email address." });
    }

    const domain = emailParts[1].toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    // Find existing college by domain or create a new one
    let college = await College.findOne({ domain });
    if (!college) {
      college = await College.create({
        name: collegeName.trim(),
        domain: domain,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone.trim(),
      collegeId: college._id,
      profilePic: profilePic || "",
    });

    // Create JWT
    const token = jwt.sign(
      { id: user._id, collegeId: college._id },
      process.env.JWT_SECRET || "campus_lost_found_jwt_secret_key_12345",
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        collegeId: college._id,
        collegeName: college.name,
        profilePic: user.profilePic || "",
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Search case-insensitively to match any legacy or freshly registered emails
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    }).populate("collegeId");

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const collegeId = user.collegeId?._id || user.collegeId;
    const collegeName = user.collegeId?.name || "Campus";

    const token = jwt.sign(
      { id: user._id, collegeId },
      process.env.JWT_SECRET || "campus_lost_found_jwt_secret_key_12345",
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        collegeId,
        collegeName,
        profilePic: user.profilePic || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
});

// Get Current User Profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("collegeId");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        collegeId: user.collegeId?._id || user.collegeId,
        collegeName: user.collegeId?.name || "Campus",
        profilePic: user.profilePic || "",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

// Update Profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { fullName, phone, collegeName, profilePic } = req.body;

    const user = await User.findById(req.user.id).populate("collegeId");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (fullName && fullName.trim()) {
      user.fullName = fullName.trim();
    }
    if (phone && phone.trim()) {
      user.phone = phone.trim();
    }
    if (typeof profilePic !== "undefined") {
      user.profilePic = profilePic;
    }

    if (collegeName && collegeName.trim()) {
      const trimmedCollege = collegeName.trim();
      if (user.collegeId) {
        await College.findByIdAndUpdate(user.collegeId._id || user.collegeId, {
          name: trimmedCollege,
        });
      }
    }

    await user.save();

    const updatedUser = await User.findById(user._id).populate("collegeId");

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        collegeId: updatedUser.collegeId?._id,
        collegeName: updatedUser.collegeId?.name || collegeName || "Campus",
        profilePic: updatedUser.profilePic || "",
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update user profile." });
  }
});

module.exports = router;
