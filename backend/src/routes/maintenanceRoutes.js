const express = require("express")
const maintenanceController = require("../controllers/maintenanceController")
const { protect, restrictTo } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

// Protect all routes
router.use(protect)

/**
 * @swagger
 * /maintenance:
 *   get:
 *     summary: Get all maintenance records
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicle
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *       - in: query
 *         name: maintenanceType
 *         schema:
 *           type: string
 *           enum: [scheduled, breakdown, accident, inspection, repair, service]
 *     responses:
 *       200:
 *         description: List of maintenance records retrieved successfully
 *   post:
 *     summary: Create a new maintenance record
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Maintenance'
 *     responses:
 *       201:
 *         description: Maintenance record created successfully
 */
router
  .route("/")
  .get(maintenanceController.getAllMaintenance)
  .post(restrictTo("admin", "fleet_owner"), maintenanceController.createMaintenance)

/**
 * @swagger
 * /maintenance/upcoming:
 *   get:
 *     summary: Get upcoming maintenance
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 30
 *     responses:
 *       200:
 *         description: Upcoming maintenance records retrieved successfully
 */
router.get("/upcoming", restrictTo("admin", "fleet_owner"), maintenanceController.getUpcomingMaintenance)

/**
 * @swagger
 * /maintenance/stats:
 *   get:
 *     summary: Get maintenance statistics
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance statistics retrieved successfully
 */
router.get("/stats", restrictTo("admin", "fleet_owner"), maintenanceController.getMaintenanceStats)

/**
 * @swagger
 * /maintenance/{id}:
 *   get:
 *     summary: Get maintenance record by ID
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance record retrieved successfully
 */
router
  .route("/:id")
  .get(maintenanceController.getMaintenance)
  .patch(restrictTo("admin", "fleet_owner"), maintenanceController.updateMaintenance)
  .delete(restrictTo("admin"), maintenanceController.deleteMaintenance)

/**
 * @swagger
 * /maintenance/{id}/complete:
 *   patch:
 *     summary: Mark maintenance as completed
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance marked as completed successfully
 */
router.patch("/:id/complete", restrictTo("admin", "fleet_owner"), maintenanceController.completeMaintenance)

/**
 * @swagger
 * /maintenance/{id}/documents:
 *   post:
 *     summary: Upload maintenance documents
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documentType:
 *                 type: string
 *                 enum: [invoice, receipt, work_order, photo]
 *               file:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
router.post("/:id/documents", upload.single("file"), maintenanceController.uploadDocument)

module.exports = router
