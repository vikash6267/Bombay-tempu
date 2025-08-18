const Advance = require("../models/advanceSchema");
const User = require("../models/User");


exports.createAdvance = async (req, res) => {
  try {
    const { userId, tripId, amount, reason, paymentType } = req.body;

    const advance = await Advance.create({
      user: userId,
      trip: tripId || null,
      amount,
      reason,
      paymentType,
      paidBy: req.user.name, // sirf name save karega
    });

    // user ke schema me push + advanceAmount increase
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: { advances: advance._id },      // agar history maintain karni hai
        $inc: { advanceAmount: +amount },      // amount increment karega
      },
      { new: true }
    );

    res.status(201).json({
      message: "Advance created successfully",
      advance,
      userAdvanceBalance: user.advanceAmount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAdvancesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const advances = await Advance.find({ user: userId })
      .populate("trip", "tripNumber")
      .populate("user", "name role")
      .sort({ createdAt: -1 }); // 👈 newest first

    res.json({ advances });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
