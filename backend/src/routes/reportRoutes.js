const express = require("express")
const reportController = require("../controllers/reportController")
const { protect, restrictTo } = require("../middleware/auth")

const router = express.Router()

// Protect all routes
router.use(protect)

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get("/dashboard", reportController.getDashboardStats)

/**
 * @swagger
 * /reports/financial:
 *   get:
 *     summary: Get financial reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [revenue, profit_loss, commission]
 *     responses:
 *       200:
 *         description: Financial reports retrieved successfully
 */
router.get("/financial", restrictTo("admin"), reportController.getFinancialReports)

/**
 * @swagger
 * /reports/operational:
 *   get:
 *     summary: Get operational reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Operational reports retrieved successfully
 */
router.get("/operational", restrictTo("admin", "fleet_owner"), reportController.getOperationalReports)

/**
 * @swagger
 * /reports/vehicle-performance:
 *   get:
 *     summary: Get vehicle performance reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Vehicle performance reports retrieved successfully
 */
router.get("/vehicle-performance", restrictTo("admin", "fleet_owner"), reportController.getVehiclePerformance)

module.exports = router
