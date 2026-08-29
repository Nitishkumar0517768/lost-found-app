const mongoose = require("mongoose");

const FoundItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true }, // public description
    category: { type: String, required: true },
    location: { type: String, required: true },
    dateFound: { type: Date, required: true },
    imageUrl: { type: String, required: true }, // required
    holdingLocation: { type: String, required: true }, // 'with_me' | 'security_office' | 'college_office' etc.
    privateNotes: { type: String }, // specific identifying details
    status: { type: String, enum: ["found", "claim_requested", "returned"], default: "found" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoundItem", FoundItemSchema);
