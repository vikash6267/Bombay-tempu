const express = require("express");
const router = express.Router();
const {
  createDriverCalculation,
  getAllDriverCalculations,
  getDriverCalculationById,
  updateDriverCalculation,
  deleteDriverCalculation,getDriverCalculationByDriver} = require("../controllers/driverHisabCtrl");

// Routes
router.post("/", createDriverCalculation);
router.get("/", getAllDriverCalculations);
router.get("/:id", getDriverCalculationById);
router.patch("/:id", updateDriverCalculation);
router.delete("/:id", deleteDriverCalculation);
router.get("/driver/:driverId", getDriverCalculationByDriver); // हिसाब by driverId

module.exports = router;
