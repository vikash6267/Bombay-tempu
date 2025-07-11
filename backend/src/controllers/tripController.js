const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const cloudinary = require("../utils/cloudinary");
const Email = require("../utils/email");
const { CounterService } = require("../models/Counter");
const mongoose = require("mongoose");
const Expense = require('../models/Expenses'); // ✅ Import your Expense model

const { isValidObjectId } = mongoose;

const getAllTrips = catchAsync(async (req, res, next) => {
  const filter = {};

  // Apply role-based filtering
  switch (req.user.role) {
    case "client":
      filter["clients.client"] = req.user.id;
      break;
    case "fleet_owner":
      filter["vehicleOwner.ownerId"] = req.user.id;
      filter["vehicleOwner.ownershipType"] = "fleet_owner";
      break;
    case "driver":
      filter.driver = req.user.id;
      break;
    // admin can see all trips
  }

  // const features = new APIFeatures(Trip.find(filter), req.query).filter().sort().limitFields().paginate()

  const trips = await Trip.find(filter)
    .populate("clients.client", "name email phone")
    .populate("vehicle", "registrationNumber make model ownershipType")
    .populate("driver", "name email phone")
    .populate("vehicleOwner.ownerId", "name email phone").sort({ createdAt: -1 });
  res.status(200).json({
    status: "success",
    results: trips.length,
    data: {
      trips,
    },
  });
});

const getTrip = catchAsync(async (req, res, next) => {
  const filter = { _id: req.params.id };

  // Apply role-based filtering
  switch (req.user.role) {
    case "client":
      filter["clients.client"] = req.user.id;
      break;
    case "fleet_owner":
      filter["vehicleOwner.ownerId"] = req.user.id;
      filter["vehicleOwner.ownershipType"] = "fleet_owner";
      break;
    case "driver":
      filter.driver = req.user.id;
      break;
    // admin can access any trip
  }

  const trip = await Trip.findOne(filter)
    .populate("clients.client", "name email phone address")
    .populate(
      "vehicle",
      "registrationNumber make model capacity vehicleType ownershipType"
    )
    .populate("driver", "name email phone licenseNumber")
    .populate("vehicleOwner.ownerId", "name email phone")
    .populate("createdBy", "name email")
    .populate("documents.proofOfDelivery.uploadedBy", "name email")
    .populate("documents.proofOfDelivery.verifiedBy", "name email");

  if (!trip) {
    return next(new AppError("No trip found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      trip,
    },
  });
});

const createTrip = catchAsync(async (req, res, next) => {
  try {
    const {
      clients,
      vehicle,
      driver,
      origin,
      destination,
      scheduledDate,
      estimatedDuration,
      estimatedDistance,
      specialInstructions,
      podBalance,
      commission,
      rate,
    } = req.body;


    console.log(req.body)

    // Validate clients array
    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return next(new AppError("At least one client is required", 400));
    }

    for (const clientData of clients) {
      if (
        !clientData.client ||
        !isValidObjectId(clientData.client) ||
        !clientData.loadDetails ||
        !clientData.rate
      ) {
        return next(
          new AppError(
            "Each client must have a valid client ID, load details, and rate",
            400
          )
        );
      }

      const clientUser = await User.findById(clientData.client);
      if (!clientUser || clientUser.role !== "client") {
        return next(
          new AppError(`Invalid client specified: ${clientData.client}`, 400)
        );
      }

      if (
        req.user.role === "client" &&
        req.user.id !== clientData.client.toString()
      ) {
        return next(
          new AppError("Clients can only create trips for themselves", 403)
        );
      }
    }

    // Validate vehicle
    if (!isValidObjectId(vehicle)) {
      return next(new AppError("Invalid vehicle ID format", 400));
    }

    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return next(new AppError("Invalid vehicle specified", 400));
    }

    // if (vehicleDoc.status !== "available") {
    //   return next(new AppError("Vehicle is not available for booking", 400));
    // }

    const vehicleOwnerDetails = vehicleDoc.getOwnerDetails();
    const ownershipType = vehicleOwnerDetails.type;

    let driverUser = null;

    // If vehicle is self-owned, driver is required
    if (ownershipType === "self") {
      if (!driver || !isValidObjectId(driver)) {
        return next(
          new AppError("Valid driver is required for self-owned vehicles", 400)
        );
      }

      driverUser = await User.findById(driver);
      if (!driverUser || driverUser.role !== "driver") {
        return next(new AppError("Invalid driver specified", 400));
      }

      const activeTrip = await Trip.findOne({
        driver: driver,
        status: { $in: ["booked", "in_progress"] },
      });

      // if (activeTrip) {
      //   return next(
      //     new AppError("Driver is already assigned to another active trip", 400)
      //   );
      // }
    }

    const { number: tripNumber } = await CounterService.getNext("trip");

    // Map clients to include totalRate = rate
    const updatedClients = clients.map((client) => ({
      ...client,
      totalRate: client.rate,
    }));

    const tripData = {
      clients: updatedClients,
      vehicle,
      origin,
      destination,
      scheduledDate,
      estimatedDuration,
      estimatedDistance,
      specialInstructions,
      podBalance,
      commission,
      rate,
      createdBy: req.user.id,
      tripNumber: tripNumber,
      vehicleOwner: {
        ownershipType: ownershipType === "self" ? "self" : "fleet_owner",
        ownerId:
          ownershipType === "self"
            ? vehicleOwnerDetails.details.adminId
            : vehicleOwnerDetails.details._id,
        ownerDetails: vehicleOwnerDetails.details,
        commissionRate: vehicleOwnerDetails.commissionRate,
      },
    };

    // Add driver only if self-owned
    if (ownershipType === "self") {
      tripData.driver = driver;
    }

    const trip = await Trip.create(tripData);

    await Vehicle.findByIdAndUpdate(vehicle, { status: "booked" });

    await trip.populate([
      { path: "clients.client", select: "name email phone" },
      { path: "vehicle", select: "registrationNumber make model" },
      { path: "driver", select: "name email phone" },
      { path: "vehicleOwner.ownerId", select: "name email phone" },
    ]);

    // Notifications
    try {
      if (ownershipType === "self") {
        await new Email(driverUser, "").sendTripNotification(
          trip,
          "trip_assigned"
        );
      }

      if (ownershipType === "fleet_owner") {
        await new Email(vehicleOwnerDetails.details, "").sendTripNotification(
          trip,
          "trip_assigned"
        );
      }

      for (const clientData of clients) {
        const client = await User.findById(clientData.client);
        await new Email(client, "").sendTripNotification(trip, "trip_created");
      }
    } catch (notifyErr) {
      console.error("Error sending trip notifications:", notifyErr);
    }

    res.status(201).json({
      status: "success",
      data: {
        trip,
      },
    });
  } catch (error) {
    console.log("Trip creation error:", error);
    next(error);
  }
});


const updateTrip = catchAsync(async (req, res, next) => {
  try {
    const  tripId  = req.params.id;
    const {
      clients,
      vehicle,
      driver,
      origin,
      destination,
      scheduledDate,
      estimatedDuration,
      estimatedDistance,
      specialInstructions,
      podBalance,
      commission,
      rate,
    } = req.body;

    console.log(req.body)
    const trip = await Trip.findById(tripId);
    console.log(trip)
    if (!trip) {
      return next(new AppError("Trip not found", 404));
    }

    // Validate and update clients if provided
    if (clients) {
      if (!Array.isArray(clients) || clients.length === 0) {
        return next(new AppError("At least one client is required", 400));
      }

      for (const clientData of clients) {
        if (
          !clientData.client ||
          !isValidObjectId(clientData.client) ||
          !clientData.loadDetails ||
          !clientData.rate
        ) {
          return next(
            new AppError(
              "Each client must have a valid client ID, load details, and rate",
              400
            )
          );
        }

        const clientUser = await User.findById(clientData.client);
        if (!clientUser || clientUser.role !== "client") {
          return next(
            new AppError(`Invalid client specified: ${clientData.client}`, 400)
          );
        }

        if (
          req.user.role === "client" &&
          req.user.id !== clientData.client.toString()
        ) {
          return next(
            new AppError("Clients can only edit trips for themselves", 403)
          );
        }
      }

      // Update clients with totalRate
      trip.clients = clients.map((client) => ({
        ...client,
        totalRate: client.rate,
      }));
    }

    // Vehicle validation if changed
    if (vehicle && vehicle !== trip.vehicle.toString()) {
      if (!isValidObjectId(vehicle)) {
        return next(new AppError("Invalid vehicle ID format", 400));
      }

      const vehicleDoc = await Vehicle.findById(vehicle);
      if (!vehicleDoc) {
        return next(new AppError("Invalid vehicle specified", 400));
      }

      trip.vehicle = vehicle;
      const vehicleOwnerDetails = vehicleDoc.getOwnerDetails();
      const ownershipType = vehicleOwnerDetails.type;

      trip.vehicleOwner = {
        ownershipType: ownershipType === "self" ? "self" : "fleet_owner",
        ownerId:
          ownershipType === "self"
            ? vehicleOwnerDetails.details.adminId
            : vehicleOwnerDetails.details._id,
        ownerDetails: vehicleOwnerDetails.details,
        commissionRate: vehicleOwnerDetails.commissionRate,
      };

      // For self-owned vehicles, driver must be revalidated
      if (ownershipType === "self") {
        if (!driver || !isValidObjectId(driver)) {
          return next(new AppError("Valid driver is required", 400));
        }

        const driverUser = await User.findById(driver);
        if (!driverUser || driverUser.role !== "driver") {
          return next(new AppError("Invalid driver specified", 400));
        }

        const activeTrip = await Trip.findOne({
          _id: { $ne: tripId },
          driver: driver,
          status: { $in: ["booked", "in_progress"] },
        });

        // if (activeTrip) {
        //   return next(
        //     new AppError("Driver is already assigned to another active trip", 400)
        //   );
        // }

        trip.driver = driver;
      } else {
        trip.driver = undefined;
      }

      // Update old vehicle's status
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });
      await Vehicle.findByIdAndUpdate(vehicle, { status: "booked" });
    }

    // Optional fields update
    if (origin) trip.origin = origin;
    if (destination) trip.destination = destination;
    if (scheduledDate) trip.scheduledDate = scheduledDate;
    if (estimatedDuration) trip.estimatedDuration = estimatedDuration;
    if (estimatedDistance) trip.estimatedDistance = estimatedDistance;
    if (specialInstructions) trip.specialInstructions = specialInstructions;
    if (podBalance) trip.podBalance = podBalance;
    if (commission) trip.commission = commission;
    if (rate) trip.rate = rate;

    await trip.save();

    await trip.populate([
      { path: "clients.client", select: "name email phone" },
      { path: "vehicle", select: "registrationNumber make model" },
      { path: "driver", select: "name email phone" },
      { path: "vehicleOwner.ownerId", select: "name email phone" },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        trip,
      },
    });
  } catch (error) {
    console.log("Trip update error:", error);
    next(error);
  }
});


const updateTripStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const filter = { _id: req.params.id };

  // Apply role-based filtering and status change permissions
  switch (req.user.role) {
    case "driver":
      filter.driver = req.user.id;
      // Drivers can only change status from booked to in_progress
      if (!["in_progress"].includes(status)) {
        return next(new AppError("Drivers can only start trips", 403));
      }
      break;
    case "fleet_owner":
      filter["vehicleOwner.ownerId"] = req.user.id;
      filter["vehicleOwner.ownershipType"] = "fleet_owner";
      break;
    case "client":
      filter["clients.client"] = req.user.id;
      // Clients can only cancel booked trips
      if (status !== "cancelled") {
        return next(new AppError("Clients can only cancel trips", 403));
      }
      break;
    // admin can change any status
  }

  const trip = await Trip.findOne(filter);
  if (!trip) {
    return next(new AppError("No trip found with that ID", 404));
  }

  // Validate status transitions
  const validTransitions = {
    booked: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"], // Note: completed requires POD
    completed: ["billed"],
    billed: ["paid"],
    cancelled: [],
    paid: [],
  };

  if (!validTransitions[trip.status].includes(status)) {
    return next(
      new AppError(`Cannot change status from ${trip.status} to ${status}`, 400)
    );
  }

  // Special handling for completion - requires POD
  if (status === "completed") {
    if (
      !trip.documents.proofOfDelivery ||
      !trip.documents.proofOfDelivery.url
    ) {
      return next(
        new AppError(
          "Proof of Delivery (POD) is required to complete the trip",
          400
        )
      );
    }

    if (trip.documents.proofOfDelivery.status !== "verified") {
      // Auto-verify POD if uploaded by admin or if admin is updating status
      if (req.user.role === "admin") {
        await trip.verifyPODAndComplete(req.user.id);
      } else {
        return next(
          new AppError("POD must be verified before trip can be completed", 400)
        );
      }
    } else {
      // Update trip status
      await trip.updateStatus(status, req.user.id);
    }
  } else {
    // Update trip status
    await trip.updateStatus(status, req.user.id);
  }

  // Update vehicle status based on trip status
  if (status === "completed" || status === "cancelled") {
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });
  }

  // Send notifications for completed trips
  if (status === "completed") {
    try {
      // Notify all clients
      for (const clientData of trip.clients) {
        const client = await User.findById(clientData.client);
        await new Email(client, "").sendTripNotification(
          trip,
          "trip_completed"
        );
      }
    } catch (error) {
      console.error("Error sending completion notification:", error);
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      trip,
    },
  });
});

const uploadPOD = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a POD file", 400));
  }

  const filter = { _id: req.params.id };

  // Apply role-based filtering - only driver and admin can upload POD
  switch (req.user.role) {
    case "driver":
      filter.driver = req.user.id;
      break;
    case "admin":
      // Admin can upload POD for any trip
      break;
    default:
      return next(new AppError("Only drivers and admin can upload POD", 403));
  }

  const trip = await Trip.findOne(filter);
  if (!trip) {
    return next(new AppError("No trip found with that ID", 404));
  }

  // Check if trip is in progress
  if (trip.status !== "in_progress") {
    return next(
      new AppError("POD can only be uploaded for trips in progress", 400)
    );
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: `trips/${trip._id}/pod`,
    resource_type: "auto",
  });

  // Upload POD
  await trip.uploadPOD({ url: result.secure_url }, req.user.id);

  // If admin uploaded, auto-verify and complete
  if (req.user.role === "admin") {
    await trip.verifyPODAndComplete(req.user.id);

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });

    // Send completion notifications
    try {
      for (const clientData of trip.clients) {
        const client = await User.findById(clientData.client);
        await new Email(client, "").sendTripNotification(
          trip,
          "trip_completed"
        );
      }
    } catch (error) {
      console.error("Error sending completion notification:", error);
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      trip,
      podUrl: result.secure_url,
      message:
        req.user.role === "admin"
          ? "POD uploaded and trip completed"
          : "POD uploaded successfully. Awaiting verification.",
    },
  });
});

const verifyPOD = catchAsync(async (req, res, next) => {
  const { action, rejectionReason } = req.body; // action: 'verify' or 'reject'

  if (!action || !["verify", "reject"].includes(action)) {
    return next(
      new AppError("Valid action is required (verify or reject)", 400)
    );
  }

  if (action === "reject" && !rejectionReason) {
    return next(
      new AppError("Rejection reason is required when rejecting POD", 400)
    );
  }

  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    return next(new AppError("No trip found with that ID", 404));
  }

  if (!trip.documents.proofOfDelivery || !trip.documents.proofOfDelivery.url) {
    return next(new AppError("No POD found for this trip", 404));
  }

  if (trip.documents.proofOfDelivery.status !== "pending") {
    return next(new AppError("POD has already been processed", 400));
  }

  if (action === "verify") {
    // Verify POD and complete trip
    await trip.verifyPODAndComplete(req.user.id);

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });

    // Send completion notifications
    try {
      for (const clientData of trip.clients) {
        const client = await User.findById(clientData.client);
        await new Email(client, "").sendTripNotification(
          trip,
          "trip_completed"
        );
      }
    } catch (error) {
      console.error("Error sending completion notification:", error);
    }
  } else {
    // Reject POD
    trip.documents.proofOfDelivery.status = "rejected";
    trip.documents.proofOfDelivery.rejectionReason = rejectionReason;
    trip.documents.proofOfDelivery.verifiedBy = req.user.id;
    trip.documents.proofOfDelivery.verifiedAt = new Date();
    await trip.save();
  }

  res.status(200).json({
    status: "success",
    data: {
      trip,
      message:
        action === "verify"
          ? "POD verified and trip completed"
          : "POD rejected",
    },
  });
});

const addPaidAmount = catchAsync(async (req, res, next) => {
  const { amount, tripId } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError("No trip found with that ID", 404));
  }

  // Validate paid amount
  if (amount <= 0) {
    return next(new AppError("Paid amount must be positive", 400));
  }

  const totalPaid = trip.totalPaid + amount;
  if (totalPaid > trip.totalClientAmount) {
    return next(
      new AppError("Total paid cannot exceed total client amount", 400)
    );
  }

  const paidData = {
    amount,
    paidBy: paidBy || "client",
    paidTo,
    purpose: purpose || "general",
    notes,
  };

  await trip.addPaidAmount(paidData);

  res.status(200).json({
    status: "success",
    data: {
      trip,
      message: "Paid amount added successfully",
    },
  });
});

const addAdvancePayment = catchAsync(async (req, res, next) => {
  const { amount, paidTo, purpose, notes, index, pymentMathod } = req.body;

  console.log(req.body)
  const trip = await Trip.findById(req.params.id);
  if (!trip || !trip.clients[index]) {
    return next(new AppError("Trip or client not found", 404));
  }

  const client = trip.clients[index];

  // Validate
  if (amount <= 0) {
    return next(new AppError("Advance amount must be positive", 400));
  }

  const newPaidAmount = client.paidAmount + amount;
  if (newPaidAmount > client.totalRate) {
    return next(
      new AppError("Advance exceeds total rate for this client", 400)
    );
  }

  const advanceData = {
    amount,
    paidBy: "client",
    paidTo,
    purpose: purpose || "general",
    notes,
    pymentMathod: pymentMathod || "cash",
  };

  await trip.addAdvance(advanceData, index);

  // Update user record
  const user = await User.findById(client.client);
  if (user) {
    user.advanceRecords.push({
      amount,
      paidTo,
      purpose,
      notes,
      tripId: trip._id,
    });
    await user.save();
  }

  res.status(200).json({
    status: "success",
    data: {
      trip,
      message: "Advance payment added successfully",
    },
  });
});


const addExpense = catchAsync(async (req, res, next) => {
  const { type, amount, description, paidBy, index } = req.body;

  console.log("➡️ Expense Request Body:", req.body);

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip || !trip.clients[index]) {
      return next(new AppError("Trip or client not found", 404));
    }

    if (amount <= 0) {
      return next(new AppError("Expense amount must be positive", 400));
    }

    const client = trip.clients[index];

    const oldExpense = client.totalExpense || 0;
    const newExpense = oldExpense + amount;

    console.log("📌 Old totalExpense:", oldExpense);
    console.log("📌 Adding Expense Amount:", amount);
    console.log("✅ Updated totalExpense:", newExpense);

    client.totalExpense = newExpense;
    client.dueAmount += newExpense
    const expenseData = {
      type,
      amount,
      description,
      paidBy: paidBy || "driver",
      paidAt: new Date(),
    };

    client.expenses.push(expenseData);

    // Mark entire client object as modified if needed
    trip.markModified(`clients.${index}`);

    console.log("📦 Saving trip...");
    await trip.save();
    console.log("✅ Trip saved");

    // Optional: User expense history
    const userId = client.client || client.user;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.expenseRecords.push({
          type,
          amount,
          description,
          tripId: trip._id,
        });
        await user.save();
        console.log("✅ User expense record updated");
      }
    }

    res.status(200).json({
      status: "success",
      message: "Expense added successfully",
      data: { trip },
    });

  } catch (err) {
    console.error("❌ Error in addExpense:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message,
    });
  }
});

const deleteAdvancePayment = catchAsync(async (req, res, next) => {
  const { id } = req.params; // tripId
  const { clientIndex, advanceIndex } = req.body;

  const trip = await Trip.findById(id);
  if (!trip || !trip.clients?.[clientIndex]) {
    return next(new AppError("Trip or client not found", 404));
  }

  const client = trip.clients[clientIndex];
  const advance = client.advances?.[advanceIndex];

  if (!advance) {
    return next(new AppError("Advance payment not found", 404));
  }

  const amount = advance.amount || 0;
  const paidTo = advance.paidTo;
  const purpose = advance.purpose;
  const notes = advance.notes;

  // Subtract amount from paidAmount
  client.paidAmount = (client.paidAmount || 0) - amount;

  // Remove from client advances
  client.advances.splice(advanceIndex, 1);
  trip.markModified(`clients.${clientIndex}`);

  await trip.save();

  // Remove from user.advanceRecords
  const user = await User.findById(client.client);
  if (user) {
    user.advanceRecords = user.advanceRecords.filter((record) => {
      return !(
        record.tripId?.toString() === trip._id.toString() &&
        record.amount === amount &&
        record.paidTo === paidTo &&
        record.purpose === purpose &&
        record.notes === notes
      );
    });
    await user.save();
  }

  res.status(200).json({
    status: "success",
    message: "Advance payment deleted successfully",
    data: { trip },
  });
});




const deleteExpense = catchAsync(async (req, res, next) => {
  const { id } = req.params; // tripId
  const { clientIndex, expenseIndex } = req.body;

  const trip = await Trip.findById(id);
  if (!trip || !trip.clients?.[clientIndex]) {
    return next(new AppError("Trip or client not found", 404));
  }

  const client = trip.clients[clientIndex];
  const expense = client.expenses?.[expenseIndex];

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  const amount = expense.amount || 0;
  const type = expense.type;
  const description = expense.description;

  // Subtract from totalExpense and dueAmount
  client.totalExpense = (client.totalExpense || 0) - amount;
  client.dueAmount = (client.dueAmount || 0) - amount;

  // Remove from client expenses
  client.expenses.splice(expenseIndex, 1);
  trip.markModified(`clients.${clientIndex}`);

  await trip.save();

  // Remove from user.expenseRecords
  const userId = client.client || client.user;
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      user.expenseRecords = user.expenseRecords.filter((record) => {
        return !(
          record.tripId?.toString() === trip._id.toString() &&
          record.amount === amount &&
          record.type === type &&
          record.description === description
        );
      });
      await user.save();
    }
  }

  res.status(200).json({
    status: "success",
    message: "Expense deleted successfully",
    data: { trip },
  });
});









const uploadDocument = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a file", 400));
  }

  const { documentType, description, clientId } = req.body;
  if (!documentType) {
    return next(new AppError("Please specify document type", 400));
  }

  const filter = { _id: req.params.id };

  // Apply role-based filtering
  switch (req.user.role) {
    case "driver":
      filter.driver = req.user.id;
      break;
    case "fleet_owner":
      filter["vehicleOwner.ownerId"] = req.user.id;
      filter["vehicleOwner.ownershipType"] = "fleet_owner";
      break;
    case "client":
      filter["clients.client"] = req.user.id;
      break;
    // admin can upload to any trip
  }

  const trip = await Trip.findOne(filter);
  if (!trip) {
    return next(new AppError("No trip found with that ID", 404));
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: `trips/${trip._id}/documents`,
    resource_type: "auto",
  });

  // Update trip document
  const updateData = {};
  const now = new Date();

  switch (documentType) {
    case "loading_receipt":
      updateData["documents.loadingReceipt"] = {
        url: result.secure_url,
        uploadedAt: now,
        uploadedBy: req.user.id,
      };
      break;
    case "delivery_receipt":
      updateData["documents.deliveryReceipt"] = {
        url: result.secure_url,
        uploadedAt: now,
        uploadedBy: req.user.id,
      };
      break;
    case "invoice":
      updateData.$push = {
        "documents.invoices": {
          clientId: clientId,
          url: result.secure_url,
          type: req.body.invoiceType || "client_invoice",
          uploadedAt: now,
        },
      };
      break;
    case "photo":
      updateData.$push = {
        "documents.photos": {
          url: result.secure_url,
          description: description || "",
          uploadedAt: now,
          uploadedBy: req.user.id,
        },
      };
      break;
    default:
      return next(new AppError("Invalid document type", 400));
  }

  const updatedTrip = await Trip.findByIdAndUpdate(trip._id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      trip: updatedTrip,
      documentUrl: result.secure_url,
    },
  });
});

const generateClientInvoices = catchAsync(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    return next(new AppError("No trip found with that ID", 404));
  }

  if (trip.status !== "completed") {
    return next(
      new AppError("Invoices can only be generated for completed trips", 400)
    );
  }

  const invoices = await trip.generateClientInvoices();

  res.status(200).json({
    status: "success",
    data: {
      trip,
      invoices,
      message: "Client invoices generated successfully",
    },
  });
});

const deleteTrip = catchAsync(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return next(new AppError("No trip found with that ID", 404));
  }

  // Only allow deletion of trips that haven't started
  if (trip.status !== "booked") {
    return next(
      new AppError("Cannot delete trips that have started or completed", 400)
    );
  }

  // Update vehicle status back to available
  await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });

  await Trip.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

const getMyTrips = catchAsync(async (req, res, next) => {
  const filter = {};

  switch (req.user.role) {
    case "client":
      filter["clients.client"] = req.user.id;
      break;
    case "driver":
      filter.driver = req.user.id;
      break;
    case "fleet_owner":
      filter["vehicleOwner.ownerId"] = req.user.id;
      filter["vehicleOwner.ownershipType"] = "fleet_owner";
      break;
    default:
      return next(new AppError("Invalid user role for this endpoint", 400));
  }

  const features = new APIFeatures(Trip.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const trips = await features.query
    .populate("clients.client", "name email phone")
    .populate("vehicle", "registrationNumber make model")
    .populate("driver", "name email phone")
    .populate("vehicleOwner.ownerId", "name email phone");

  res.status(200).json({
    status: "success",
    results: trips.length,
    data: {
      trips,
    },
  });
});

const getTripStats = catchAsync(async (req, res, next) => {
  const stats = await Trip.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$totalClientAmount" },
        totalCommission: { $sum: "$totalCommission" },
        avgCommission: { $avg: "$totalCommission" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // Get monthly stats for current year
  const currentYear = new Date().getFullYear();
  const monthlyStats = await Trip.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        count: { $sum: 1 },
        revenue: { $sum: "$totalClientAmount" },
        commission: { $sum: "$totalCommission" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Get top clients by total business
  const topClients = await Trip.aggregate([
    { $unwind: "$clients" },
    {
      $group: {
        _id: "$clients.client",
        tripCount: { $sum: 1 },
        totalRevenue: { $sum: "$clients.rate" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "clientInfo",
      },
    },
    {
      $unwind: "$clientInfo",
    },
    {
      $project: {
        name: "$clientInfo.name",
        email: "$clientInfo.email",
        tripCount: 1,
        totalRevenue: 1,
      },
    },
    {
      $sort: { totalRevenue: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      statusStats: stats,
      monthlyStats,
      topClients,
    },
  });
});





// POST /api/trips/:tripId/fleet-advances

const addFleetAdvance = async (req, res) => {
  const { tripId } = req.params;
  const { date, paymentType, reason, amount } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const newAdvance = {
      date: date ? new Date(date) : new Date(),
      paymentType,
      reason,
      amount,
    };

    trip.fleetAdvances.push(newAdvance);
    trip.totalFleetAdvance += amount;

    await trip.save();

    // Update fleet owner’s record too
    if (
      trip.vehicleOwner &&
      trip.vehicleOwner.ownershipType === "fleet_owner" &&
      trip.vehicleOwner.ownerId
    ) {
      await User.findByIdAndUpdate(trip.vehicleOwner.ownerId, {
        $push: {
          fleetAdvances: {
            trip: trip._id,
            ...newAdvance,
          },
        },
      });
    }

    res.status(200).json({ success: true, trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


const deleteFleetAdvance = async (req, res) => {
  const { tripId } = req.params;
  const { advanceIndex } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    if (
      !trip.fleetAdvances ||
      !Array.isArray(trip.fleetAdvances) ||
      !trip.fleetAdvances[advanceIndex]
    ) {
      return res.status(404).json({ message: "Fleet advance not found" });
    }

    const deletedAdvance = trip.fleetAdvances[advanceIndex];

    // Deduct the advance amount
    trip.totalFleetAdvance = (trip.totalFleetAdvance || 0) - (deletedAdvance.amount || 0);

    // Remove from trip
    trip.fleetAdvances.splice(advanceIndex, 1);
    await trip.save();

    // Also remove from fleet owner's user record
    if (
      trip.vehicleOwner &&
      trip.vehicleOwner.ownershipType === "fleet_owner" &&
      trip.vehicleOwner.ownerId
    ) {
      const user = await User.findById(trip.vehicleOwner.ownerId);
      if (user) {
        user.fleetAdvances = user.fleetAdvances.filter((record) => {
          return !(
            record.trip?.toString() === tripId &&
            record.amount === deletedAdvance.amount &&
            record.reason === deletedAdvance.reason &&
            record.referenceNumber === deletedAdvance.referenceNumber
          );
        });
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Fleet advance deleted successfully",
      trip,
    });
  } catch (err) {
    console.error("❌ Error deleting fleet advance:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



const addFleetExpense = async (req, res) => {
  const { tripId } = req.params;
  const { amount, reason, category, description, receiptNumber } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const newExpense = {
      amount,
      reason,
      category,
      description,
      receiptNumber,
      date: new Date(),
    };

    trip.fleetExpenses.push(newExpense);
    trip.totalFleetExpense += amount;

    // Save to trip
    await trip.save();

    // Also update fleet owner's user record
    if (
      trip.vehicleOwner &&
      trip.vehicleOwner.ownershipType === "fleet_owner" &&
      trip.vehicleOwner.ownerId
    ) {
      await User.findByIdAndUpdate(trip.vehicleOwner.ownerId, {
        $push: {
          fleetExpenses: {
            trip: trip._id,
            ...newExpense,
          },
        },
      });
    }

    res.status(200).json({ success: true, trip });
  } catch (err) {
    console.log(err)
    res.status(500).json({ success: false, message: err.message });
  }
};




// Add Self Expense
const addSelfExpense = async (req, res) => {
  const { tripId } = req.params;
  const { amount, reason, category, expenseFor, description, receiptNumber } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const expenseData = {
      amount,
      reason,
      category,
      expenseFor,
      description,
      receiptNumber,
      paidAt: new Date(),
      tripId
    };

    trip.selfExpenses.push(expenseData);

    if (expenseFor === "driver" && trip.driver) {
      const driver = await User.findById(trip.driver);
      if (driver) {
        driver.driverExpenseHistory.push(expenseData);
        await driver.save();
      }
    }

    if (expenseFor === "vehicle" && trip.vehicle) {
      const vehicle = await Vehicle.findById(trip.vehicle);
      console.log(vehicle)
      if (vehicle) {
        vehicle.vehicleExpenseHistory.push(expenseData);
        await vehicle.save();
      }
    }

    await trip.save();
    res.status(200).json({ success: true, message: "Self expense added successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// DELETE self expense
const deleteSelfExpense = async (req, res) => {
  const { tripId } = req.params;
  const { expenseIndex } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip || !trip.selfExpenses?.[expenseIndex]) {
      return res.status(404).json({ message: "Trip or expense not found" });
    }

    const expense = trip.selfExpenses[expenseIndex];

    // Remove from driver history if applicable
    if (expense.expenseFor === "driver" && trip.driver) {
      await User.findByIdAndUpdate(trip.driver, {
        $pull: { driverExpenseHistory: { paidAt: expense.paidAt, amount: expense.amount } }
      });
    }

    // Remove from vehicle history if applicable
    if (expense.expenseFor === "vehicle" && trip.vehicle) {
      await Vehicle.findByIdAndUpdate(trip.vehicle, {
        $pull: { vehicleExpenseHistory: { paidAt: expense.paidAt, amount: expense.amount } }
      });
    }

    // Remove from trip
    trip.selfExpenses.splice(expenseIndex, 1);
    await trip.save();

    res.status(200).json({ success: true, message: "Self expense deleted successfully", trip });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Add Self Advance
const addSelfAdvance = async (req, res) => {
  const { tripId } = req.params;
  const { amount, reason, paymentFor, recipientName, description, referenceNumber } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const advanceData = {
      amount,
      reason,
      paymentFor,
      recipientName,
      description,
      referenceNumber,
      paidAt: new Date(),
      tripId
    };

    trip.selfAdvances.push(advanceData);

    if (paymentFor === "driver" && trip.driver) {
      const driver = await User.findById(trip.driver);
      if (driver) {
        driver.advanceDriver.push(advanceData);
        await driver.save();
      }
    }

    if (paymentFor === "vehicle" && trip.vehicle) {
      const vehicle = await Vehicle.findById(trip.vehicle);
      if (vehicle) {
        vehicle.vehicleAdvances.push(advanceData);
        await vehicle.save();
      }
    }

    await trip.save();
    res.status(200).json({ success: true, message: "Self advance added successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const deleteSelfAdvance = async (req, res) => {
  const { tripId } = req.params;
  const { advanceIndex } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip || !trip.selfAdvances?.[advanceIndex]) {
      return res.status(404).json({ message: "Trip or advance not found" });
    }

    const advance = trip.selfAdvances[advanceIndex];

    // Remove from driver history if applicable
    if (advance.paymentFor === "driver" && trip.driver) {
      await User.findByIdAndUpdate(trip.driver, {
        $pull: {
          advanceDriver: {
            paidAt: advance.paidAt,
            amount: advance.amount,
          },
        },
      });
    }

    // Remove from vehicle history if applicable
    if (advance.paymentFor === "vehicle" && trip.vehicle) {
      await Vehicle.findByIdAndUpdate(trip.vehicle, {
        $pull: {
          vehicleAdvances: {
            paidAt: advance.paidAt,
            amount: advance.amount,
          },
        },
      });
    }

    // Remove from trip
    trip.selfAdvances.splice(advanceIndex, 1);
    await trip.save();

    res.status(200).json({
      success: true,
      message: "Self advance deleted successfully",
      trip,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};



const updatePodDetails = async (req, res) => {
  const { id } = req.params; // Trip ID
  const { podGive, paymentType, notes } = req.body;

  try {
    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "❌ Trip not found",
      });
    }

    // Update podDetails
    trip.podDetails = {
      date: new Date(),
      paymentType: paymentType || trip.podDetails?.paymentType || "",
      podGive,
      notes: notes || "",
    };
    trip.podBalance = 0
    await trip.save();

    res.status(200).json({
      success: true,
      message: "✅ POD details updated successfully",
      podDetails: trip.podDetails,
      tripId: trip._id,
    });
  } catch (error) {
    console.error("Error updating podDetails:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal Server Error",
      error: error.message,
    });
  }
};

const updatePodStatus = async (req, res) => {
  try {
    const { tripId } = req.params
    const { status, document } = req.body


    console.log(req.files)
    console.log(req.file)
    console.log(req.body)
    const trip = await Trip.findById(tripId)

    if (status === "complete") {
      // ✅ Make vehicle available
      if (trip.vehicle) {
        await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });
      }
      trip.status = "completed"
      // ✅ Make driver available
      if (trip.driver) {
        await User.findByIdAndUpdate(trip.driver, { status: "available" });
      }
    }

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" })
    }

    // Update podManage object
    trip.podManage = {
      status,
      date: new Date(),
    }



    // If document is also provided (optional)
    if (document?.url) {

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `trips/${trip._id}/pod`,
        resource_type: "auto",
      });
      trip.podManage.document = {
        url: result.url,
        fileType: result.fileType || "unknown",
        uploadedAt: new Date(),

      }
    }

    await trip.save()

    res.json({ success: true, trip })
  } catch (err) {
    console.error("Error updating POD status:", err)
    res.status(500).json({ error: "Failed to update POD status" })
  }
}

const uploadPodDocument = async (req, res) => {
  try {
    const { tripId } = req.params;

    console.log(req.body)
    console.log(req.files)
    console.log(req.file)
    // console.log(req.file)
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `trips/${tripId}/pod`,
      resource_type: "auto",
    });

    // Update trip document
    trip.podManage.document = {
      url: result.secure_url,
      fileType: result.format || "unknown",
      uploadedAt: new Date(),
    };

    await trip.save();

    res.status(200).json({
      success: true,
      message: "POD document uploaded successfully",
      document: trip.podManage.document,
    });
  } catch (error) {
    console.error("Error uploading POD document:", error);
    res.status(500).json({ error: "Failed to upload POD document" });
  }
};


const getDashboardData = async (req, res) => {
  try {
    const trips = await Trip.find().lean();
    const otherExpenses = await Expense.find().lean(); // ✅ Fetch other expenses

    let totalTrips = trips.length;
    let totalPods = 0;
    let totalProfitBeforeExpenses = 0;
    let totalTripExpenses = 0;
    let pendingPodClientsCount = 0;

    trips.forEach(trip => {
      const podBalance = trip.podBalance || 0;
      totalPods += podBalance;

      if (podBalance > 0 && Array.isArray(trip.clients)) {
        trip.clients.forEach(client => {
          if (!client.podReceived) {
            pendingPodClientsCount += 1;
          }
        });
      }

      if (trip.vehicleOwner?.ownershipType === "fleet_owner") {
        const clientTotalRate = trip.clients?.reduce((sum, c) => sum + (c.rate || 0), 0) || 0;
        const clientTruckCost = trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;

        const profit =
          (clientTotalRate - clientTruckCost) +
          clientTruckCost -
          (trip.rate || 0) +
          (trip.commission || 0);

        totalProfitBeforeExpenses += profit;

      } else if (trip.vehicleOwner?.ownershipType === "self") {
        const profit =
          (trip.totalClientAmount || 0) -
          (trip.rate || 0) +
          (trip.commission || 0);

        totalProfitBeforeExpenses += profit;

        if (Array.isArray(trip.selfExpenses)) {
          totalTripExpenses += trip.selfExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        }
      }
    });

    // ✅ Sum all other expenses
    const totalOtherExpense = otherExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const totalExpenses = totalTripExpenses + totalOtherExpense;
    const totalFinalProfit = totalProfitBeforeExpenses - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        totalTrips,
        totalPods,
        totalProfitBeforeExpenses,
        totalExpenses,
        otherExpense: totalOtherExpense, // ✅ Included
        totalFinalProfit,
        pendingPodClientsCount,
      },
    });

  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};


const getDriverSelfSummary = async (req, res) => {
  try {
    const { driverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ error: "Invalid driver ID" });
    }

    const trips = await Trip.find({ driver: driverId })
      .populate("vehicle", "number model type registrationNumber")
      .select("tripNumber scheduledDate vehicle selfExpenses selfAdvances");

    const detailedTrips = [];
    let totalAdvance = 0;
    let totalExpense = 0;
    let totalAdvanceCount = 0;
    let totalExpenseCount = 0;

    for (const trip of trips) {
      const selfAdvances = (trip.selfAdvances || []).filter(
        (adv) => adv.paymentFor?.toLowerCase() === "driver"
      ).map((adv) => ({
        amount: adv.amount,
        reason: adv.reason,
        paidAt: adv.paidAt,
        description: adv.description,
        referenceNumber: adv.referenceNumber
      }));

      const selfExpenses = (trip.selfExpenses || []).filter(
        (exp) => exp.expenseFor?.toLowerCase() === "driver"
      ).map((exp) => ({
        amount: exp.amount,
        reason: exp.reason,
        category: exp.category,
        paidAt: exp.paidAt,
        description: exp.description,
        receiptNumber: exp.receiptNumber
      }));

      totalAdvance += selfAdvances.reduce((sum, a) => sum + a.amount, 0);
      totalExpense += selfExpenses.reduce((sum, e) => sum + e.amount, 0);
      totalAdvanceCount += selfAdvances.length;
      totalExpenseCount += selfExpenses.length;

      detailedTrips.push({
        tripId: trip._id,
        tripNumber: trip.tripNumber,
        scheduledDate: trip.scheduledDate,
        vehicle: trip.vehicle || null,
        selfAdvances,
        selfExpenses
      });
    }

    const driver = await User.findById(driverId).select("name email phone address");

    return res.status(200).json({
      success: true,
      message: "Driver trip-wise summary fetched successfully",
      driver,
      driverId,
      totalTrips: trips.length,
      totalSelfAdvance: totalAdvance,
      totalSelfAdvanceCount: totalAdvanceCount,
      totalSelfExpense: totalExpense,
      totalSelfExpenseCount: totalExpenseCount,
      trips: detailedTrips
    });
  } catch (error) {
    console.error("Error fetching driver trip summary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};




module.exports = {
  getAllTrips,
  getTrip,
  createTrip,
  updateTrip,
  updateTripStatus,
  uploadPOD,
  verifyPOD,
  addAdvancePayment,
  addExpense,
  deleteAdvancePayment,
  deleteExpense,
  uploadDocument,
  generateClientInvoices,
  deleteTrip,
  getMyTrips,
  getTripStats,
  addFleetAdvance,
  addFleetExpense,
  addSelfExpense,
  addSelfAdvance,
  updatePodDetails,
  updatePodStatus,
  uploadPodDocument,
  getDashboardData,
  deleteFleetAdvance,
deleteSelfExpense,
getDriverSelfSummary,
deleteSelfAdvance


};
