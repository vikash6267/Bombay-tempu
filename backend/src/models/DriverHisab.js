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

  originalTripData: [
    {
      tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
      tripNumber: String,
      scheduledDate: Date,
      vehicle: {
        _id: mongoose.Schema.Types.ObjectId,
        registrationNumber: String,
      },
      selfAdvances: [
        {
          amount: Number,
          reason: String,
          paidAt: Date,
          description: String,
        }
      ],
      selfExpenses: [
        {
          amount: Number,
          reason: String,
          category: String,
          paidAt: Date,
          description: String,
        }
      ]
    }
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.DriverCalculation || mongoose.model("DriverCalculation", DriverCalculationSchema);
