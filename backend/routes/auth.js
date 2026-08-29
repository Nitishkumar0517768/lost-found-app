const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const College = require("../models/College");
const router = express.Router();

// Register/Signup
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, phone, collegeName } = req.body;

    if (!fullName || !email || !password || !phone || !collegeName) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Extract email domain (e.g. user@paruluniversity.ac.in -> paruluniversity.ac.in)
    const emailParts = email.split("@");
    if (emailParts.length !== 2) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    const domain = emailParts[1].toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    // Find or create College
    let college = await College.findOne({ domain });
    if (!college) {
      college = await College.create({
        name: collegeName,
        domain: domain,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      phone,
      collegeId: college._id,
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

    const user = await User.findOne({ email }).populate("collegeId");
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, collegeId: user.collegeId._id },
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
        collegeId: user.collegeId._id,
        collegeName: user.collegeId.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
});

module.exports = router;
