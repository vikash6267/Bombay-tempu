const express = require("express");
const { protect } = require("../middleware/auth");
const authController = require("../controllers/authController");
const tripController = require("../controllers/tripController");
const vehicleController = require("../controllers/vehicleController");
const { createAdvance, getAdvancesByUser, createDeposit } = require("../controllers/advanceCtrl");

const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);
router.get("/dashboard", tripController.getDashboardData);
router.get("/:vehicleId/expenses", vehicleController.getVehicleExpenseTotal);

router.post("/logout", authController.logout);

router.post("/forgot-password", authController.forgotPassword);

router.patch("/reset-password/:token", authController.resetPassword);

router.get("/verify-email/:token", authController.verifyEmail);
router.get("/trip-balances/:clientId", authController.getClientTripBalances);

// Protected routes
router.use(protect);

router.get("/me", authController.getMe);

router.patch("/update-password", authController.updatePassword);


//ADNVACE
router.post("/create-advance", protect,createAdvance);
router.post("/create-deposite", protect,createDeposit);
router.get("/user/:userId", getAdvancesByUser);
module.exports = router;
