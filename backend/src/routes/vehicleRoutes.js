
const express = require("express")
const vehicleController = require("../controllers/vehicleController")
const { protect, restrictTo } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

// Protect all routes
router.use(protect)


router
  .route("/")
  .get(vehicleController.getAllVehicles)
  .post(restrictTo("admin", "fleet_owner"), vehicleController.createVehicle)


router.get("/ownership/:ownershipType", vehicleController.getVehiclesByOwnership)


router.get("/expiring-documents", vehicleController.getExpiringDocuments)


router.get("/emi-due", vehicleController.getEMIDueVehicles)


router
  .route("/:id")
  .get(vehicleController.getVehicle)
  .patch(vehicleController.updateVehicle)
  .delete(restrictTo("admin"), vehicleController.deleteVehicle)

router.post("/:id/documents", upload.single("file"), vehicleController.uploadDocument)


router.get("/:id/maintenance", vehicleController.getMaintenanceRecords)
router.get("/:vehicleId/finace", vehicleController.getVehicleMonthlyFinance)

module.exports = router
