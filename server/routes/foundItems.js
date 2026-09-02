const express = require("express");
const FoundItem = require("../models/FoundItem");
const Claim = require("../models/Claim");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadToCloudinary } = require("../utils/cloudinary");
const router = express.Router();

router.use(authMiddleware);

// Helper function to strip privateNotes if requester is not the finder
const sanitizeFoundItem = (item, requesterId) => {
  const itemObj = item.toObject ? item.toObject() : item;
  if (itemObj.userId && itemObj.userId._id) {
    if (itemObj.userId._id.toString() !== requesterId.toString()) {
      delete itemObj.privateNotes;
    }
  } else if (itemObj.userId) {
    if (itemObj.userId.toString() !== requesterId.toString()) {
      delete itemObj.privateNotes;
    }
  }
  return itemObj;
};

// Get Found Items reported by currently logged-in user
router.get("/my", async (req, res) => {
  try {
    const { id: userId } = req.user;
    const items = await FoundItem.find({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName email phone");

    const itemsWithClaims = await Promise.all(
      items.map(async (item) => {
        const itemObj = item.toObject();
        const pendingClaims = await Claim.countDocuments({
          foundItemId: item._id,
          status: "pending",
        });
        itemObj.pendingClaimsCount = pendingClaims;
        return itemObj;
      })
    );

    res.json(itemsWithClaims);
  } catch (error) {
    console.error("Error fetching user's found items:", error);
    res.status(500).json({ error: "Server error fetching your found items." });
  }
});

// Delete a Found Item (only by the finder who reported it)
router.delete("/:id", async (req, res) => {
  try {
    const { id: userId } = req.user;
    const item = await FoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: "Found item not found." });
    }

    if (item.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own found items." });
    }

    await FoundItem.findByIdAndDelete(req.params.id);
    await Claim.deleteMany({ foundItemId: req.params.id });

    res.json({ message: "Found item removed successfully." });
  } catch (error) {
    console.error("Error deleting found item:", error);
    res.status(500).json({ error: "Server error deleting found item." });
  }
});

// Get Found Items (College Scoped)
router.get("/", async (req, res) => {
  try {
    const { collegeId, id: requesterId } = req.user;
    const { search, category, location, dateFilter, startDate, endDate, page = 1, limit = 10, status } = req.query;

    const query = { collegeId };

    if (status) {
      query.status = status;
    } else {
      // Show found and claim_requested items by default. Exclude returned.
      query.status = { $in: ["found", "claim_requested"] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (location && location !== "All") {
      query.location = location;
    }

    if (dateFilter) {
      const now = new Date();
      if (dateFilter === "Today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.dateFound = { $gte: today };
      } else if (dateFilter === "This Week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        query.dateFound = { $gte: oneWeekAgo };
      }
    } else if (startDate || endDate) {
      query.dateFound = {};
      if (startDate) query.dateFound.$gte = new Date(startDate);
      if (endDate) query.dateFound.$lte = new Date(endDate);
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);

    const total = await FoundItem.countDocuments(query);
    const items = await FoundItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit))
      .populate("userId", "fullName email phone");

    // Map through items and sanitize privateNotes
    const sanitizedItems = items.map(item => sanitizeFoundItem(item, requesterId));

    res.json({
      items: sanitizedItems,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    console.error("Error fetching found items:", error);
    res.status(500).json({ error: "Server error fetching found items." });
  }
});

// Get Single Found Item Detail
router.get("/:id", async (req, res) => {
  try {
    const { collegeId, id: requesterId } = req.user;
    const item = await FoundItem.findById(req.params.id)
      .populate("userId", "fullName email phone");

    if (!item) {
      return res.status(404).json({ error: "Item not found." });
    }

    // Verify same college
    if (item.collegeId.toString() !== collegeId.toString()) {
      return res.status(403).json({ error: "Access denied. Resource belongs to another college." });
    }

    const sanitized = sanitizeFoundItem(item, requesterId);
    res.json(sanitized);
  } catch (error) {
    console.error("Error fetching found item detail:", error);
    res.status(500).json({ error: "Server error fetching item details." });
  }
});

// Create Found Item report
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { id: userId, collegeId } = req.user;
    const { title, description, category, location, dateFound, holdingLocation, privateNotes, imageUrl } = req.body;

    if (!title || !description || !category || !location || !dateFound || !holdingLocation) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (new Date(dateFound) > endOfToday) {
      return res.status(400).json({ error: "Date found cannot be in the future." });
    }

    let finalImageUrl = imageUrl || "";
    if (req.file) {
      finalImageUrl = req.file.path;
    }

    if (!finalImageUrl) {
      return res.status(400).json({ error: "Photo upload is required for found items." });
    }

    // Convert to Cloudinary URL
    if (finalImageUrl.startsWith("data:image") || req.file) {
      finalImageUrl = await uploadToCloudinary(finalImageUrl);
    }

    const item = await FoundItem.create({
      userId,
      collegeId,
      title,
      description,
      category,
      location,
      dateFound: new Date(dateFound),
      imageUrl: finalImageUrl,
      holdingLocation,
      privateNotes,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Error creating found item:", error);
    res.status(500).json({ error: "Server error creating found item report." });
  }
});

module.exports = router;
