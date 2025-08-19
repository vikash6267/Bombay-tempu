// models/Advance.js
const mongoose = require("mongoose");

const advanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // driver/fleet_owner
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null }, // optional
  amount: { type: Number, required: true },
  reason: { type: String }, // agar trip null hai to yaha trip number/notes daal do
  paidBy: { type: String }, // req.user.name
  paymentType: {    type: String, },
  type: {    type: String,default :"credit" },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Advance", advanceSchema);
