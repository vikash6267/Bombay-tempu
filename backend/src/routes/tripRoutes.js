

const express = require("express");
const tripController = require("../controllers/tripController");
const {protect, restrictTo} = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(protect)
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

router.patch("/:tripId/status", tripController.updateTripStatus);

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
router.post(
  "/:id/del-advance",
  restrictTo("admin"),
  tripController.deleteAdvancePayment
);

router.post("/:id/expense", tripController.addExpense);
router.post("/:id/del-expense", tripController.deleteExpense);

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
router.post("/:tripId/del-fleet-advance",  tripController.deleteFleetAdvance);
router.post("/:tripId/fleet-expense",  tripController.addFleetExpense);

router.post("/:tripId/self-expense", tripController.addSelfExpense);
router.post("/:tripId/del-self-expense", tripController.deleteSelfExpense);
router.post("/:tripId/self-advance", tripController.addSelfAdvance);
router.post("/:tripId/del-self-advance", tripController.deleteSelfAdvance);
// POD DETIALS
router.put("/:id/pod-details", tripController.updatePodDetails);
router.put("/pod-status/:tripId", tripController.updatePodStatus);
router.put("/client-pod-status/:tripId/:clientId", tripController.clientUpdatePodStatus);






router.post(
  "/:tripId/podDocument",
  upload.single("file"),
  tripController.uploadPodDocument
);

router.post("/:tripId/client/podDocument", upload.single("file"), tripController.uploadPodDocumentForClient);


router.get("/driver-summary/:driverId", tripController.getDriverSelfSummary);
// In routes/trip.js or wherever appropriate
router.get("/argestment/:clientId", tripController.getClientArgestment);

router.patch("/argestment/:clientId/pay", tripController.payClientAdjustment);
router.get("/pod-status/statement", tripController.getPodStatusReport);
router.post("/fleet/statement", tripController.getFleetOwnerStatement);

module.exports = router;
