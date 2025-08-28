const express = require("express");
const {
  createActivityLog,
  getAllActivityLogs,
  getActivityLog,
  getLogsByCategory,
  getRecentActivities,
  getUserActivitySummary,
  getFinancialSummary,
  deleteActivityLog,
  bulkDeleteActivityLogs,
} = require("../controllers/activityLogController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// Protect all routes - require authentication
router.use(protect);

// Routes accessible to all authenticated users
router.get("/recent", getRecentActivities);
router.get("/user-summary/:userId?", getUserActivitySummary);

// Routes with specific access control
router.get("/financial-summary/:userId?", getFinancialSummary);
router.get("/category/:category", getLogsByCategory);

// General CRUD routes
router.route("/").get(getAllActivityLogs).post(createActivityLog);

router.route("/:id").get(getActivityLog);

// Admin only routes
router.use(restrictTo("admin"));
router.delete("/bulk-delete", bulkDeleteActivityLogs);
router.delete("/:id", deleteActivityLog);

module.exports = router;