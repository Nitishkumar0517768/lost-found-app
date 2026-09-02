const express = require("express");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.use(authMiddleware);

// Get User's Notifications
router.get("/", async (req, res) => {
  try {
    const { id: userId } = req.user;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // limit to last 50 notifications

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error fetching notifications." });
  }
});

// Mark Notification as Read
router.patch("/:id/read", async (req, res) => {
  try {
    const { id: userId } = req.user;
    const notification = await Notification.findOne({ _id: req.params.id, userId });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found." });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error("Error reading notification:", error);
    res.status(500).json({ error: "Server error marking notification as read." });
  }
});

module.exports = router;
