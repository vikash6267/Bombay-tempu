const Advance = require("../models/advanceSchema");
const User = require("../models/User");
const ActivityLog = require('../models/ActivityLog');

exports.createAdvance = async (req, res) => {
  try {
    const { userId, tripId, amount, reason, paymentType } = req.body;

    const advance = await Advance.create({
      user: userId,
      trip: tripId || null,
      amount,
      reason,
      paymentType,
      paidBy: req.user.name,
      type: "credit",
    });

    // user ke schema me push + advanceAmount increase
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: { advances: advance._id }, // agar history maintain karni hai
        $inc: { advanceAmount: +amount }, // amount increment karega
      },
      { new: true }
    );

    // Log the activity (if user is authenticated)
    if (req.user && req.user._id) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'create',
        category: 'ADVANCE',
        description: `Created advance of ${amount} for user ${user.name}`,
        details: {
          advanceId: advance._id,
          userId,
          tripId,
          amount,
          reason,
          paymentType,
          userAdvanceBalance: user.advanceAmount
        },
        severity: 'INFO'
      });
    }

    res.status(201).json({
      message: "Advance created successfully",
      advance,
      userAdvanceBalance: user.advanceAmount,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.createDeposit = async (req, res) => {
  try {
    const { userId, tripId, amount, reason, paymentType } = req.body;

    // User fetch karo pehle
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if advanceAmount sufficient hai
    if (amount > user.advanceAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient advance balance. Current advance: ${user.advanceAmount}`,
      });
    }

    // Deposit create
    const deposit = await Advance.create({
      user: userId,
      trip: tripId || null,
      amount,
      reason,
      paymentType,
      paidBy: req.user.name,
      type: "deposit",
    });

    // User schema me deposit update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: { deposits: deposit._id }, // deposit history maintain
        $inc: { advanceAmount: -amount }, // advance balance me amount kam hoga
      },
      { new: true }
    );

    // Log the activity (if user is authenticated)
    if (req.user && req.user._id) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'create',
        category: 'DEPOSIT',
        description: `Created deposit of ${amount} for user ${user.name}`,
        details: {
          depositId: deposit._id,
          userId,
          tripId,
          amount,
          reason,
          paymentType,
          remainingAdvanceBalance: updatedUser.advanceAmount
        },
        severity: 'INFO'
      });
    }

    res.status(201).json({
      success: true, // ✅ success flag
      message: `Deposit of ${amount} created successfully. Remaining advance balance: ${updatedUser.advanceAmount}`,
      deposit,
      deductedAmount: amount,
      remainingAdvanceBalance: updatedUser.advanceAmount,
    });
  } catch (err) {
    res.status(500).json({
      success: false, // ✅ error case bhi
      message: err.message,
    });
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
