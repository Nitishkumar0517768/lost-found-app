const express = require("express");
const LostItem = require("../models/LostItem");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadToCloudinary } = require("../utils/cloudinary");
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get Lost Items (College Scoped)
router.get("/", async (req, res) => {
  try {
    const { collegeId } = req.user;
    const { search, category, location, dateFilter, startDate, endDate, page = 1, limit = 10, status } = req.query;

    const query = { collegeId };

    // Default status filter (exclude returned unless specified)
    if (status) {
      query.status = status;
    } else {
      query.status = "lost";
    }

    // Search filter (text index or simple regex)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // Location filter
    if (location && location !== "All") {
      query.location = location;
    }

    // Date filters
    if (dateFilter) {
      const now = new Date();
      if (dateFilter === "Today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.dateLost = { $gte: today };
      } else if (dateFilter === "This Week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        query.dateLost = { $gte: oneWeekAgo };
      }
    } else if (startDate || endDate) {
      query.dateLost = {};
      if (startDate) query.dateLost.$gte = new Date(startDate);
      if (endDate) query.dateLost.$lte = new Date(endDate);
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);

    const total = await LostItem.countDocuments(query);
    const items = await LostItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit))
      .populate("userId", "fullName email phone");

    res.json({
      items,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    console.error("Error fetching lost items:", error);
    res.status(500).json({ error: "Server error fetching lost items." });
  }
});

// Create Lost Item report
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { id: userId, collegeId } = req.user;
    const { title, description, category, location, dateLost, approxTime, imageUrl } = req.body;

    if (!title || !description || !category || !location || !dateLost) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (new Date(dateLost) > endOfToday) {
      return res.status(400).json({ error: "Date lost cannot be in the future." });
    }

    // Determine imageUrl: uploaded file or direct URL in request body
    let finalImageUrl = imageUrl || "";
    if (req.file) {
      finalImageUrl = req.file.path;
    }

    if (finalImageUrl.startsWith("data:image") || req.file) {
      finalImageUrl = await uploadToCloudinary(finalImageUrl);
    }

    const item = await LostItem.create({
      userId,
      collegeId,
      title,
      description,
      category,
      location,
      dateLost: new Date(dateLost),
      approxTime,
      imageUrl: finalImageUrl,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Error creating lost item:", error);
    res.status(500).json({ error: "Server error creating lost item report." });
  }
});

module.exports = router;
