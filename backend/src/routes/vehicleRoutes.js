// const express = require("express")
// const vehicleController = require("../controllers/vehicleController")
// const { protect, restrictTo } = require("../middleware/auth")
// const upload = require("../middleware/upload")

// const router = express.Router()

// // Protect all routes after this middleware
// router.use(protect)

// /**
//  * @swagger
//  * /vehicles:
//  *   get:
//  *     summary: Get all vehicles
//  *     tags: [Vehicles]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: status
//  *         schema:
//  *           type: string
//  *           enum: [available, booked, maintenance, inactive]
//  *       - in: query
//  *         name: vehicleType
//  *         schema:
//  *           type: string
//  *           enum: [truck, tempo, mini_truck, trailer, container]
//  *       - in: query
//  *         name: owner
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: List of vehicles retrieved successfully
//  *   post:
//  *     summary: Create a new vehicle
//  *     tags: [Vehicles]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Vehicle'
//  *     responses:
//  *       201:
//  *         description: Vehicle created successfully
//  */
// router
//   .route("/")
//   .get(vehicleController.getAllVehicles)
//   .post(restrictTo("admin", "fleet_owner"), vehicleController.createVehicle)

// /**
//  * @swagger
//  * /vehicles/{id}:
//  *   get:
//  *     summary: Get vehicle by ID
//  *     tags: [Vehicles]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Vehicle retrieved successfully
//  *       404:
//  *         description: Vehicle not found
//  */
// router
//   .route("/:id")
//   .get(vehicleController.getVehicle)
//   .patch(restrictTo("admin", "fleet_owner"), vehicleController.updateVehicle)
//   .delete(restrictTo("admin"), vehicleController.deleteVehicle)

// /**
//  * @swagger
//  * /vehicles/{id}/documents:
//  *   post:
//  *     summary: Upload vehicle documents
//  *     tags: [Vehicles]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               documentType:
//  *                 type: string
//  *                 enum: [registration, insurance, fitness, permit, pollution]
//  *               file:
//  *                 type: string
//  *                 format: binary
//  *     responses:
//  *       200:
//  *         description: Document uploaded successfully
//  */
// router.post(
//   "/:id/documents",
//   restrictTo("admin", "fleet_owner"),
//   upload.single("file"),
//   vehicleController.uploadDocument,
// )

// /**
//  * @swagger
//  * /vehicles/{id}/maintenance:
//  *   get:
//  *     summary: Get vehicle maintenance records
//  *     tags: [Vehicles]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Maintenance records retrieved successfully
//  */
// router.get("/:id/maintenance", vehicleController.getMaintenanceRecords)

// /**
//  * @swagger
//  * /vehicles/expiring-documents:
//  *   get:
//  *     summary: Get vehicles with expiring documents
//  *     tags: [Vehicles]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: days
//  *         schema:
//  *           type: number
//  *           default: 30
//  *     responses:
//  *       200:
//  *         description: Vehicles with expiring documents retrieved successfully
//  */
// router.get("/expiring-documents", restrictTo("admin", "fleet_owner"), vehicleController.getExpiringDocuments)

// /**
//  * @swagger
//  * /vehicles/emi-due:
//  *   get:
//  *     summary: Get vehicles with EMI due
//  *     tags: [Vehicles]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Vehicles with EMI due retrieved successfully
//  */
// router.get("/emi-due", restrictTo("admin", "fleet_owner"), vehicleController.getEMIDueVehicles)

// module.exports = router


const express = require("express")
const vehicleController = require("../controllers/vehicleController")
const { protect, restrictTo } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

// Protect all routes
router.use(protect)

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Get all vehicles
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, booked, maintenance, inactive]
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [truck, tempo, mini_truck, trailer, container]
 *       - in: query
 *         name: ownershipType
 *         schema:
 *           type: string
 *           enum: [self, fleet_owner]
 *     responses:
 *       200:
 *         description: List of vehicles retrieved successfully
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registrationNumber
 *               - make
 *               - model
 *               - year
 *               - vehicleType
 *               - capacity
 *               - ownershipType
 *             properties:
 *               ownershipType:
 *                 type: string
 *                 enum: [self, fleet_owner]
 *               owner:
 *                 type: string
 *                 description: Required for fleet_owner type
 *               commissionRate:
 *                 type: number
 *                 description: Required for fleet_owner type (0-100)
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 */
router
  .route("/")
  .get(vehicleController.getAllVehicles)
  .post(restrictTo("admin", "fleet_owner"), vehicleController.createVehicle)

/**
 * @swagger
 * /vehicles/ownership/{ownershipType}:
 *   get:
 *     summary: Get vehicles by ownership type
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownershipType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [self, fleet_owner]
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 */
router.get("/ownership/:ownershipType", vehicleController.getVehiclesByOwnership)

/**
 * @swagger
 * /vehicles/expiring-documents:
 *   get:
 *     summary: Get vehicles with expiring documents
 *     tags: [Vehicles]
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
 *         description: Vehicles with expiring documents retrieved successfully
 */
router.get("/expiring-documents", vehicleController.getExpiringDocuments)

/**
 * @swagger
 * /vehicles/emi-due:
 *   get:
 *     summary: Get vehicles with EMI due
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicles with EMI due retrieved successfully
 */
router.get("/emi-due", vehicleController.getEMIDueVehicles)

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
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
 *         description: Vehicle retrieved successfully
 */
router
  .route("/:id")
  .get(vehicleController.getVehicle)
  .patch(vehicleController.updateVehicle)
  .delete(restrictTo("admin"), vehicleController.deleteVehicle)

/**
 * @swagger
 * /vehicles/{id}/documents:
 *   post:
 *     summary: Upload vehicle documents
 *     tags: [Vehicles]
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
 *                 enum: [registrationCertificate, insurance, fitnessCertificate, permit, pollution]
 *               file:
 *                 type: string
 *                 format: binary
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               policyNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
router.post("/:id/documents", upload.single("file"), vehicleController.uploadDocument)

/**
 * @swagger
 * /vehicles/{id}/maintenance:
 *   get:
 *     summary: Get vehicle maintenance records
 *     tags: [Vehicles]
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
 *         description: Maintenance records retrieved successfully
 */
router.get("/:id/maintenance", vehicleController.getMaintenanceRecords)
router.get("/:vehicleId/finace", vehicleController.getVehicleMonthlyFinance)

module.exports = router
