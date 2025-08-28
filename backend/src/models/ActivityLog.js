const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "add",
        "remove",
        "upload",
        "verify",
        "approve",
        "reject",
        "login",
        "logout",
        "payment",
        "advance",
        "expense",
        "status_change",
        "pod_update",
      ],
    },
    category: {
      type: String,
      required: true,
      enum: [
        "trip",
        "user",
        "vehicle",
        "payment",
        "advance",
        "expense",
        "authentication",
        "document",
        "pod",
        "financial",
        "system",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      // Flexible object to store additional details
      amount: Number,
      transactionType: String,
      paymentMethod: String,
      tripNumber: String,
      vehicleNumber: String,
      driverName: String,
      clientName: String,
      expenseType: String,
      advanceType: String,
      podStatus: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      ipAddress: String,
      userAgent: String,
      referenceNumber: String,
      paymentNumber: String,
      invoiceNumber: String,
      receiptNumber: String,
      documentType: String,
      documentUrl: String,
      notes: String,
      purpose: String,
      paidBy: String,
      paidTo: String,
      paymentType: String,
      loginTime: Date,
      logoutTime: Date,
      scheduledDate: Date,
      dueDate: Date,
      completedDate: Date,
      origin: String,
      destination: String,
      distance: Number,
      duration: Number,
      fuelConsumed: Number,
      commission: Number,
      totalAmount: Number,
      paidAmount: Number,
      dueAmount: Number,
      balanceAmount: Number,
      clientCount: Number,
      ownershipType: String,
      vehicleType: String,
      loadType: String,
      weight: Number,
      quantity: Number,
      rate: Number,
      expenseFor: String,
      paymentFor: String,
      recipientName: String,
      reason: String,
      podGive: Number,
    },
    relatedTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    relatedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    relatedPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending", "cancelled"],
      default: "success",
    },
    metadata: {
      // Additional metadata
      sessionId: String,
      requestId: String,
      apiVersion: String,
      clientVersion: String,
      platform: String,
      browser: String,
      location: {
        country: String,
        state: String,
        city: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
      deviceInfo: {
        type: String,
        model: String,
        os: String,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ relatedTrip: 1, createdAt: -1 });
activityLogSchema.index({ relatedUser: 1, createdAt: -1 });
activityLogSchema.index({ relatedVehicle: 1, createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });
activityLogSchema.index({ status: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

// Compound indexes
activityLogSchema.index({ user: 1, category: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ relatedTrip: 1, category: 1, createdAt: -1 });

// Virtual for formatted timestamp
activityLogSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Virtual for time ago
activityLogSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
});

// Static method to log activity
activityLogSchema.statics.logActivity = async function (logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

// Static method to get user activity summary
activityLogSchema.statics.getUserActivitySummary = async function (
  userId,
  days = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        lastActivity: { $max: "$createdAt" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Static method to get financial activity summary
activityLogSchema.statics.getFinancialSummary = async function (
  userId,
  days = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        category: { $in: ["payment", "advance", "expense", "financial"] },
        createdAt: { $gte: startDate },
        "details.amount": { $exists: true },
      },
    },
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: "$details.amount" },
        count: { $sum: 1 },
        avgAmount: { $avg: "$details.amount" },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);
};

module.exports = mongoose.model("ActivityLog", activityLogSchema);