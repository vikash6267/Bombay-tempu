const ActivityLog = require("../models/ActivityLog");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

// Helper function to log activity (for use by other controllers)
const logActivity = async (logData) => {
  try {
    return await ActivityLog.logActivity(logData);
  } catch (error) {
    console.error("Error in logActivity helper:", error);
    // Don't throw error to avoid breaking main functionality
    return null;
  }
};

// Create activity log
const createActivityLog = catchAsync(async (req, res, next) => {
  const logData = {
    user: req.user.id,
    ...req.body,
  };

  const log = await ActivityLog.logActivity(logData);

  res.status(201).json({
    status: "success",
    data: {
      log,
    },
  });
});

// Get all activity logs with filtering and pagination
const getAllActivityLogs = catchAsync(async (req, res, next) => {
  let filter = {};
  const { page = 1, limit = 10 } = req.query;
  console.log(req.query);

  // Role-based access control
  if (req.user.role !== "admin") {
    // Non-admin users can only see their own logs
    filter.user = req.user.id;
  }

  // Apply additional filters from query params
  if (req.query.category) filter.category = req.query.category;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.relatedTrip) filter.relatedTrip = req.query.relatedTrip;
  if (req.query.relatedUser) filter.relatedUser = req.query.relatedUser;
  if (req.query.relatedVehicle) filter.relatedVehicle = req.query.relatedVehicle;

  // 🔹 Description search with regex
  if (req.query.search) {
    const search = req.query.search;
    const regex = new RegExp(search, "i");
    filter.description = regex;
  }

  console.log(filter);
  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) {
      filter.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  // Pagination calculation
  const skip = (Number(page) - 1) * Number(limit);

  // Query with pagination
  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate("user", "name email role")
      .populate("relatedTrip", "tripNumber")
      .populate("relatedUser", "name email")
      .populate("relatedVehicle", "registrationNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ActivityLog.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: logs.length,
    total,
    currentPage: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    data: {
      logs,
    },
  });
});


// Get activity log by ID
const getActivityLog = catchAsync(async (req, res, next) => {
  let filter = { _id: req.params.id };

  // Role-based access control
  if (req.user.role !== "admin") {
    filter.user = req.user.id;
  }

  const log = await ActivityLog.findOne(filter)
    .populate("user", "name email role")
    .populate("relatedTrip", "tripNumber")
    .populate("relatedUser", "name email")
    .populate("relatedVehicle", "registrationNumber");

  if (!log) {
    return next(new AppError("No activity log found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      log,
    },
  });
});

// Get logs by category
const getLogsByCategory = catchAsync(async (req, res, next) => {
  let filter = { category: req.params.category };

  // Role-based access control
  if (req.user.role !== "admin") {
    filter.user = req.user.id;
  }

  const features = new APIFeatures(ActivityLog.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const logs = await features.query
    .populate("user", "name email role")
    .populate("relatedTrip", "tripNumber")
    .populate("relatedUser", "name email")
    .populate("relatedVehicle", "registrationNumber");

  res.status(200).json({
    status: "success",
    results: logs.length,
    data: {
      logs,
    },
  });
});

// Get recent activities
const getRecentActivities = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  let filter = {};

  // Role-based access control
  if (req.user.role !== "admin") {
    filter.user = req.user.id;
  }

  const logs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "name email role")
    .populate("relatedTrip", "tripNumber")
    .populate("relatedUser", "name email")
    .populate("relatedVehicle", "registrationNumber");

  res.status(200).json({
    status: "success",
    results: logs.length,
    data: {
      logs,
    },
  });
});

// Get user activity summary
const getUserActivitySummary = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user.id;
  const days = parseInt(req.query.days) || 30;

  // Role-based access control
  if (req.user.role !== "admin" && userId !== req.user.id) {
    return next(
      new AppError("You can only view your own activity summary", 403)
    );
  }

  const summary = await ActivityLog.getUserActivitySummary(userId, days);

  res.status(200).json({
    status: "success",
    data: {
      summary,
      period: `${days} days`,
      userId,
    },
  });
});

// Get financial summary
const getFinancialSummary = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user.id;
  const days = parseInt(req.query.days) || 30;

  // Role-based access control - only admin and fleet owners can view financial summaries
  if (
    req.user.role !== "admin" &&
    req.user.role !== "fleet_owner" &&
    userId !== req.user.id
  ) {
    return next(
      new AppError("You don't have permission to view financial summary", 403)
    );
  }

  const summary = await ActivityLog.getFinancialSummary(userId, days);

  res.status(200).json({
    status: "success",
    data: {
      summary,
      period: `${days} days`,
      userId,
    },
  });
});

// Delete activity log (admin only)
const deleteActivityLog = catchAsync(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to delete activity logs", 403)
    );
  }

  const log = await ActivityLog.findByIdAndDelete(req.params.id);

  if (!log) {
    return next(new AppError("No activity log found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Bulk delete activity logs (admin only)
const bulkDeleteActivityLogs = catchAsync(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to delete activity logs", 403)
    );
  }

  const { ids, filter } = req.body;
  let deleteFilter = {};

  if (ids && Array.isArray(ids)) {
    deleteFilter._id = { $in: ids };
  } else if (filter) {
    deleteFilter = filter;
    // Add safety checks for bulk delete
    if (filter.olderThan) {
      deleteFilter.createdAt = { $lt: new Date(filter.olderThan) };
      delete deleteFilter.olderThan;
    }
  } else {
    return next(
      new AppError("Please provide either ids array or filter object", 400)
    );
  }

  const result = await ActivityLog.deleteMany(deleteFilter);

  res.status(200).json({
    status: "success",
    data: {
      deletedCount: result.deletedCount,
    },
  });
});

module.exports = {
  logActivity, // Helper function for other controllers
  createActivityLog,
  getAllActivityLogs,
  getActivityLog,
  getLogsByCategory,
  getRecentActivities,
  getUserActivitySummary,
  getFinancialSummary,
  deleteActivityLog,
  bulkDeleteActivityLogs,
};