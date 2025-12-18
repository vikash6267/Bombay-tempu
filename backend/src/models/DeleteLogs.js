// models/DeleteLog.js
const mongoose = require("mongoose");

const deleteLogSchema = new mongoose.Schema({
  type: { type: String, enum: ["advance", "expense"], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true }, // trip advance/expense id
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // client/driver id
  amount: Number,
  purpose: String,
  description: String,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who deleted (req.user)
  deletedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeleteLog", deleteLogSchema);
