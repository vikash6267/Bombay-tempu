const DriverCalculation = require("../models/DriverHisab");
const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");

// Create Driver Calculation
exports.createDriverCalculation = async (req, res) => {
  try {
    const calculation = new DriverCalculation(req.body);

    // Save calculation first
    await calculation.save();

    // Loop through original trips to update vehicles
    if (req.body.originalTripData && req.body.originalTripData.length > 0) {
      for (const tripItem of req.body.originalTripData) {
        const trip = await Trip.findById(tripItem.tripId).populate("vehicle");
        if (trip && trip.vehicle) {
          const vehicle = await Vehicle.findById(trip.vehicle._id);

          // Update currentKilometers
          vehicle.currentKilometers = req.body.newKM;

          // Update nextServiceAtKm
          vehicle.nextServiceAtKm = req.body.nextSeriveKM;

          await vehicle.save();
        }
      }
    }

    res.status(201).json({ success: true, data: calculation });
  } catch (err) {
    console.error("Error creating driver calculation:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Driver Calculations
exports.getAllDriverCalculations = async (req, res) => {
  try {
    const calculations = await DriverCalculation.find()
      .populate("driverId")
      .populate("tripIds");
    res.status(200).json({ success: true, data: calculations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Single Driver Calculation by ID
exports.getDriverCalculationById = async (req, res) => {
  try {
    const calculation = await DriverCalculation.findById(req.params.id)
      .populate("driverId")
      .populate({
        path: "tripIds",
        populate: {
          path: "vehicle",   // populate vehicle inside each trip
          model: "Vehicle",  // vehicle model name
        },
      });

    if (!calculation) {
      return res.status(404).json({ success: false, message: "Calculation not found" });
    }

    res.status(200).json({ success: true, data: calculation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Update Driver Calculation
exports.updateDriverCalculation = async (req, res) => {
  try {
    const calculation = await DriverCalculation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!calculation) {
      return res.status(404).json({ success: false, message: "Calculation not found" });
    }

    res.status(200).json({ success: true, data: calculation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Driver Calculation
exports.deleteDriverCalculation = async (req, res) => {
  try {
    const calculation = await DriverCalculation.findByIdAndDelete(req.params.id);

    if (!calculation) {
      return res.status(404).json({ success: false, message: "Calculation not found" });
    }

    res.status(200).json({ success: true, message: "Calculation deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// किसी particular trip ka हिसाब निकालना
exports.getDriverCalculationByDriver = async (req, res) => {
  try {
    const calcs = await DriverCalculation.find({ tripId: req.params.tripId })
      .populate("driverId") // driver details
      .populate({
        path: "tripIds",
        populate: {
          path: "vehicle",   // vehicle info populate karne ke liye
          model: "Vehicle",  // Vehicle model name
        },
      });

    if (!calcs || calcs.length === 0) {
      return res.status(404).json({ message: "No calculation found for this trip" });
    }

    res.json(calcs);
  } catch (err) {
    console.error("Error in getDriverCalculationByTrip:", err);
    res.status(500).json({ message: err.message });
  }
};

