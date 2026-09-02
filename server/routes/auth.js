const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const College = require("../models/College");
const router = express.Router();

const authMiddleware = require("../middleware/auth");

/**
 * Validates that the student's email matches their college name using the JavaScript `.includes()` method.
 * Returns true if email includes the college name / domain or vice versa.
 */
function doesEmailMatchCollege(email, collegeName) {
  if (!email || !collegeName) return false;

  const emailLower = email.toLowerCase().trim();
  const collegeLower = collegeName.toLowerCase().trim();

  // 1. Direct includes match: e.g. email includes full college name
  if (emailLower.includes(collegeLower)) {
    return true;
  }

  // 2. Alphanumeric clean match using .includes()
  const cleanEmail = emailLower.replace(/[^a-z0-9]/g, "");
  const cleanCollege = collegeLower.replace(/[^a-z0-9]/g, "");

  if (cleanEmail.includes(cleanCollege) || cleanCollege.includes(cleanEmail)) {
    return true;
  }

  // 3. Domain match using .includes()
  const domain = emailLower.split("@")[1] || "";
  const domainParts = domain.split(".");
  const domainMain = domainParts[0] || ""; // e.g. "paruluniversity" or "parul"

  if (domainMain && domainMain.length >= 3) {
    if (collegeLower.includes(domainMain) || cleanCollege.includes(domainMain) || domain.includes(cleanCollege)) {
      return true;
    }
  }

  // 4. Significant words from college name using .includes() (e.g. "Parul" in "Parul University")
  const genericWords = ["college", "university", "institute", "school", "academy", "campus", "of", "and", "the", "for", "in"];
  const collegeWords = collegeLower
    .split(/[\s,.-]+/)
    .filter((w) => w.length >= 3 && !genericWords.includes(w));

  for (const word of collegeWords) {
    if (emailLower.includes(word) || domain.includes(word)) {
      return true;
    }
  }

  // 5. Significant parts of domain checked in college name using .includes()
  for (const part of domainParts) {
    if (part.length >= 3 && !["com", "edu", "ac", "in", "org", "net", "gov"].includes(part)) {
      if (collegeLower.includes(part)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Removes all student IDs (User documents) from the database that have no matching email with their college name.
 */
async function removeStudentsWithMismatchedCollegeEmail() {
  try {
    const allUsers = await User.find().populate("collegeId");
    const idsToRemove = [];

    for (const u of allUsers) {
      const collegeName = u.collegeId?.name;
      if (!collegeName || !doesEmailMatchCollege(u.email, collegeName)) {
        idsToRemove.push(u._id);
      }
    }

    if (idsToRemove.length > 0) {
      console.log(`[CLEANUP] Removing ${idsToRemove.length} student ID(s) with mismatched email and college name:`, idsToRemove);
      await User.deleteMany({ _id: { $in: idsToRemove } });
    }

    return idsToRemove;
  } catch (error) {
    console.error("Error removing students with mismatched college email:", error);
    return [];
  }
}

// Register/Signup
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, phone, collegeName, profilePic } = req.body;

    if (!fullName || !email || !password || !phone || !collegeName) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Extract email domain (e.g. user@paruluniversity.ac.in -> paruluniversity.ac.in)
    const emailParts = email.split("@");
    if (emailParts.length !== 2) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    const domain = emailParts[1].toLowerCase();

    // Verify email matches college name using .includes()
    if (!doesEmailMatchCollege(email, collegeName)) {
      return res.status(400).json({
        error: `Your email (${email}) does not match your college name (${collegeName}). Email must include college name or domain.`,
      });
    }

    // Clean up any existing student IDs in the database whose email has no match with their college name
    await removeStudentsWithMismatchedCollegeEmail();

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

    // Clean up all student IDs that have no matching email with college name
    await removeStudentsWithMismatchedCollegeEmail();

    const user = await User.findOne({ email }).populate("collegeId");
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Verify this user's email matches their registered college name using .includes()
    if (!user.collegeId || !doesEmailMatchCollege(user.email, user.collegeId.name)) {
      // Remove this student ID from the database
      await User.findByIdAndDelete(user._id);
      return res.status(403).json({
        error: "Access denied. Your student account has been removed because your email does not match your college name.",
      });
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

    // If collegeName is updated, verify it matches email using .includes()
    if (collegeName && collegeName.trim()) {
      const trimmedCollege = collegeName.trim();
      if (!doesEmailMatchCollege(user.email, trimmedCollege)) {
        return res.status(400).json({
          error: `College name (${trimmedCollege}) does not match your email (${user.email}).`,
        });
      }
      if (user.collegeId) {
        // Update current college name
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
        collegeName: updatedUser.collegeId?.name || collegeName || "",
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
