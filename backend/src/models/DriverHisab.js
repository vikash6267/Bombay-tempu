const mongoose = require("mongoose");

const DriverCalculationSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tripIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Trip" }],
  oldKM: Number,
  newKM: Number,
  perKMRate: Number,
  pichla: Number,
  totalKM: Number,
  kmValue: Number,
  totalExpenses: Number,
  totalAdvances: Number,
  total: Number,
  due: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.DriverCalculation || mongoose.model("DriverCalculation", DriverCalculationSchema);
