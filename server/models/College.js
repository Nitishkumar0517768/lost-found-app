const mongoose = require("mongoose");

const CollegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    domain: { type: String, required: true, unique: true }, // e.g. "paruluniversity.ac.in"
  },
  { timestamps: true }
);

module.exports = mongoose.model("College", CollegeSchema);
