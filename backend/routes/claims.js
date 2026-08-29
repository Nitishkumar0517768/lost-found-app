const express = require("express");
const Claim = require("../models/Claim");
const FoundItem = require("../models/FoundItem");
const Notification = require("../models/Notification");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { sendNotification } = require("../utils/socket");
const { sendEmail } = require("../utils/email");
const router = express.Router();

router.use(authMiddleware);

// Submit a claim on a found item
router.post("/", async (req, res) => {
  try {
    const { id: claimantId } = req.user;
    const { foundItemId, proofDetails } = req.body;

    if (!foundItemId || !proofDetails) {
      return res.status(400).json({ error: "Found item ID and proof details are required." });
    }

    const item = await FoundItem.findById(foundItemId).populate("userId");
    if (!item) {
      return res.status(404).json({ error: "Found item not found." });
    }

    if (item.userId._id.toString() === claimantId.toString()) {
      return res.status(400).json({ error: "You cannot claim your own found item." });
    }

    if (item.status === "returned") {
      return res.status(400).json({ error: "This item has already been returned." });
    }

    // Check if claimant already made a pending claim on this item
    const existingClaim = await Claim.findOne({ foundItemId, claimantId, status: "pending" });
    if (existingClaim) {
      return res.status(400).json({ error: "You already have a pending claim on this item." });
    }

    // Create claim
    const claim = await Claim.create({
      foundItemId,
      claimantId,
      proofDetails,
    });

    // Update item status if it was "found"
    if (item.status === "found") {
      item.status = "claim_requested";
      await item.save();
    }

    // Create In-App Notification for Finder
    const finderId = item.userId._id;
    const claimantUser = await User.findById(claimantId);

    const notification = await Notification.create({
      userId: finderId,
      type: "claim_request",
      referenceId: claim._id,
      title: "New Claim Request",
      body: `${claimantUser.fullName} has claimed your found item: "${item.title}". Review their proof details.`,
    });

    // Push Socket.io event
    sendNotification(finderId, notification);

    // Send Email notification to finder
    await sendEmail({
      to: item.userId.email,
      subject: `Claim Request for ${item.title}`,
      text: `Hello ${item.userId.fullName},\n\nSomeone has submitted a claim for "${item.title}".\nProof Details: ${proofDetails}\n\nLogin to the app to accept or reject this claim.`,
      html: `<p>Hello <strong>${item.userId.fullName}</strong>,</p><p>Someone has submitted a claim for <strong>"${item.title}"</strong>.</p><p><strong>Proof Details:</strong> ${proofDetails}</p><p>Login to the app to accept or reject this claim.</p>`,
    });

    res.status(201).json(claim);
  } catch (error) {
    console.error("Error submitting claim:", error);
    res.status(500).json({ error: "Server error submitting claim." });
  }
});

// List claims received on items found by current user
router.get("/received", async (req, res) => {
  try {
    const { id: userId } = req.user;

    // Find all items found by this user
    const items = await FoundItem.find({ userId });
    const itemIds = items.map(i => i._id);

    // Find claims on these items
    const claims = await Claim.find({ foundItemId: { $in: itemIds } })
      .populate("foundItemId")
      .populate("claimantId", "fullName email phone")
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (error) {
    console.error("Error fetching received claims:", error);
    res.status(500).json({ error: "Server error fetching received claims." });
  }
});

// Accept or reject a claim
router.patch("/:id", async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { status } = req.body; // "accepted" or "rejected"

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid claim status update." });
    }

    const claim = await Claim.findById(req.params.id)
      .populate("foundItemId")
      .populate("claimantId");

    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    // Verify user owns the found item
    const item = await FoundItem.findById(claim.foundItemId._id).populate("userId");
    if (item.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the finder can accept or reject claims." });
    }

    if (claim.status !== "pending") {
      return res.status(400).json({ error: `Claim has already been ${claim.status}.` });
    }

    if (status === "accepted") {
      // Accept this claim
      claim.status = "accepted";
      await claim.save();

      // Update FoundItem status to returned
      item.status = "returned";
      await item.save();

      // Reject all other pending claims on this item
      await Claim.updateMany(
        { foundItemId: item._id, _id: { $ne: claim._id }, status: "pending" },
        { status: "rejected" }
      );

      // Create Notification for Claimant
      const claimantNotification = await Notification.create({
        userId: claim.claimantId._id,
        type: "claim_accepted",
        referenceId: claim._id,
        title: "Claim Accepted!",
        body: `Congratulations! ${item.userId.fullName} accepted your claim for "${item.title}". Contact them at ${item.userId.phone}.`,
      });

      sendNotification(claim.claimantId._id, claimantNotification);

      // Send Email to Claimant
      await sendEmail({
        to: claim.claimantId.email,
        subject: `Claim Accepted for ${item.title}`,
        text: `Hello ${claim.claimantId.fullName},\n\nYour claim for "${item.title}" has been ACCEPTED by ${item.userId.fullName}.\nYou can reach out to them at ${item.userId.phone} to retrieve your item.`,
        html: `<p>Hello <strong>${claim.claimantId.fullName}</strong>,</p><p>Your claim for <strong>"${item.title}"</strong> has been <strong>ACCEPTED</strong> by ${item.userId.fullName}.</p><p>You can reach out to them at <strong>${item.userId.phone}</strong> to retrieve your item.</p>`,
      });

      // Send Email/Notification details back in response
      return res.json({
        message: "Claim accepted successfully.",
        claim,
        claimantPhone: claim.claimantId.phone,
      });
    } else {
      // Reject claim
      claim.status = "rejected";
      await claim.save();

      // Check if there are other pending claims
      const pendingClaimsCount = await Claim.countDocuments({
        foundItemId: item._id,
        status: "pending",
      });

      if (pendingClaimsCount === 0) {
        item.status = "found";
        await item.save();
      }

      // Create Notification for Claimant
      const claimantNotification = await Notification.create({
        userId: claim.claimantId._id,
        type: "claim_rejected",
        referenceId: claim._id,
        title: "Claim Rejected",
        body: `Sorry, your claim for "${item.title}" was rejected by the finder.`,
      });

      sendNotification(claim.claimantId._id, claimantNotification);

      // Send Email to Claimant
      await sendEmail({
        to: claim.claimantId.email,
        subject: `Claim Rejected for ${item.title}`,
        text: `Hello ${claim.claimantId.fullName},\n\nWe regret to inform you that your claim for "${item.title}" was rejected.`,
        html: `<p>Hello <strong>${claim.claimantId.fullName}</strong>,</p><p>We regret to inform you that your claim for <strong>"${item.title}"</strong> was rejected.</p>`,
      });

      return res.json({ message: "Claim rejected successfully.", claim });
    }
  } catch (error) {
    console.error("Error updating claim:", error);
    res.status(500).json({ error: "Server error updating claim status." });
  }
});

module.exports = router;
