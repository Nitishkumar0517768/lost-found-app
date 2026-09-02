const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema(
  {
    foundItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoundItem", required: true },
    claimantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    proofDetails: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", ClaimSchema);
