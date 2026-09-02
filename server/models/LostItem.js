const mongoose = require("mongoose");

const LostItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    dateLost: { type: Date, required: true },
    approxTime: { type: String }, // e.g. "Morning", "Afternoon", "Evening"
    imageUrl: { type: String },
    status: { type: String, enum: ["lost", "returned"], default: "lost" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LostItem", LostItemSchema);
