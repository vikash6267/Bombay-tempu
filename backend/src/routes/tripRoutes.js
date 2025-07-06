

const express = require("express");
const tripController = require("../controllers/tripController");
const {protect, restrictTo} = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route("/")
  .get(tripController.getAllTrips)
  .post(restrictTo("admin", "client"), tripController.createTrip);

router.get("/stats", restrictTo("admin"), tripController.getTripStats);

router.get("/my-trips", tripController.getMyTrips);

router
  .route("/:id")
  .get(tripController.getTrip)
  .patch(tripController.updateTrip)
  .delete(restrictTo("admin"), tripController.deleteTrip);

router.patch("/:id/status", tripController.updateTripStatus);

router.post(
  "/:id/pod",
  restrictTo("admin", "driver"),
  upload.single("file"),
  tripController.uploadPOD
);

router.patch("/:id/pod/verify", restrictTo("admin"), tripController.verifyPOD);
router.post(
  "/:id/advance",
  restrictTo("admin"),
  tripController.addAdvancePayment
);

router.post("/:id/expense", tripController.addExpense);

router.post(
  "/:id/documents",
  upload.single("file"),
  tripController.uploadDocument
);

router.post(
  "/:id/invoices",
  restrictTo("admin"),
  tripController.generateClientInvoices
);


// ✅ NEW: Fleet Advance & Expense Routes
router.post("/:tripId/fleet-advance",  tripController.addFleetAdvance);
router.post("/:tripId/fleet-expense",  tripController.addFleetExpense);

router.post("/:tripId/self-expense", tripController.addSelfExpense);
router.post("/:tripId/self-advance", tripController.addSelfAdvance);
// POD DETIALS
router.put("/:id/pod-details", tripController.updatePodDetails);
router.put("/pod-status/:tripId", tripController.updatePodStatus);
router.post(
  "/:tripId/podDocument",
  upload.single("file"),
  tripController.uploadPodDocument
);



module.exports = router;
