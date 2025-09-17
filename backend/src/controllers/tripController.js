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
const Expense = require("../models/Expenses"); // ✅ Import your Expense model
const { logActivity } = require("../middleware/activityLogger");

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
    .populate("vehicleOwner.ownerId", "name email phone")
    .sort({ createdAt: -1 });
  res.status(200).json({
    status: "success",
    results: trips.length,
    data: {
      trips,
    },
  });
});




// const getAllTrips = catchAsync(async (req, res, next) => {
//   const filter = {};
//   const { search, page = 1, limit = 10 } = req.query;

//   console.log(req.query); // Debugging

//   // Role-based filtering
//   switch (req.user.role) {
//     case "client":
//       filter["clients.client"] = req.user.id;
//       break;
//     case "fleet_owner":
//       filter["vehicleOwner.ownerId"] = req.user.id;
//       filter["vehicleOwner.ownershipType"] = "fleet_owner";
//       break;
//     case "driver":
//       filter.driver = req.user.id;
//       break;
//   }

//   // Search by Trip Number
//   if (search) {
//     filter.tripNumber = { $regex: search, $options: "i" };
//   }

//   // Pagination calculation
//   const skip = (Number(page) - 1) * Number(limit);

//   // Query with pagination
//   const [trips, total] = await Promise.all([
//     Trip.find(filter)
//       .populate("clients.client", "name email phone")
//       .populate("vehicle", "registrationNumber make model ownershipType")
//       .populate("driver", "name email phone")
//       .populate("vehicleOwner.ownerId", "name email phone")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit)),
//     Trip.countDocuments(filter),
//   ]);

//   res.status(200).json({
//     status: "success",
//     results: trips.length,
//     total,
//     currentPage: Number(page),
//     totalPages: Math.ceil(total / Number(limit)),
//     data: { trips },
//   });
// });

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
    .populate("driver", "name email phone licenseNumber advanceAmount")
    .populate("vehicleOwner.ownerId", "name email phone advanceAmount")
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

    console.log(req.body);

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

    if (vehicleDoc.status !== "available") {
      return next(new AppError("Vehicle is not available for booking", 400));
    }

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
    const tripId = req.params.id;
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

    console.log(req.body);
    const trip = await Trip.findById(tripId);
    console.log(trip);
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

const uploadPOD = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a POD file", 400));
  }

  const filter = { _id: req.params.id };

  // Role based filter (driver/admin)
  switch (req.user.role) {
    case "driver":
      filter.driver = req.user.id;
      break;
    case "admin":
      break;
    default:
      return next(new AppError("Only drivers and admin can upload POD", 403));
  }

  const trip = await Trip.findOne(filter);
  if (!trip) {
    return next(new AppError("No trip found with that ID", 404));
  }

  if (trip.status !== "in_progress") {
    return next(
      new AppError("POD can only be uploaded for trips in progress", 400)
    );
  }

  // ---------- UPDATED START ----------
  const { clientIndex } = req.body;
  if (
    typeof clientIndex !== "number" ||
    !trip.clients ||
    !trip.clients[clientIndex]
  ) {
    return next(new AppError("Invalid client index", 400));
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: `trips/${trip._id}/clients/${clientIndex}/pod`,
    resource_type: "auto",
  });

  // Save POD in client object (not trip.documents)
  trip.clients[clientIndex].documents =
    trip.clients[clientIndex].documents || {};
  trip.clients[clientIndex].documents.proofOfDelivery = {
    url: result.secure_url,
    uploadedAt: new Date(),
    uploadedBy: req.user.id,
    status: "pending",
  };
  trip.markModified(`clients.${clientIndex}.documents`);
  await trip.save();

  // Admin auto-verifies and completes POD
  if (req.user.role === "admin") {
    trip.clients[clientIndex].documents.proofOfDelivery.status = "verified";
    trip.clients[clientIndex].documents.proofOfDelivery.verifiedBy =
      req.user.id;
    trip.clients[clientIndex].documents.proofOfDelivery.verifiedAt = new Date();
    trip.markModified(`clients.${clientIndex}.documents`);
    await trip.save();

    // Check if ALL client PODs verified, then mark trip as completed
    const allVerified = trip.clients.every(
      (c) => c.documents?.proofOfDelivery?.status === "verified"
    );
    if (allVerified) {
      trip.status = "completed";
      await trip.save();
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });

      // Notify all clients
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
  }

  res.status(200).json({
    status: "success",
    data: {
      trip,
      podUrl: result.secure_url,
      message:
        req.user.role === "admin"
          ? "POD uploaded and client POD verified"
          : "POD uploaded successfully. Awaiting verification.",
    },
  });
});
// ---------- UPDATED END ----------

// ---- CUT HERE ----
// Per-client POD VERIFY/REJECT
// ---- REPLACE YOUR verifyPOD FUNCTION WITH THIS ----
const verifyPOD = catchAsync(async (req, res, next) => {
  const { action, rejectionReason, clientIndex } = req.body; // now get clientIndex

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

  // ---------- UPDATED START ----------
  if (
    typeof clientIndex !== "number" ||
    !trip.clients ||
    !trip.clients[clientIndex]
  ) {
    return next(new AppError("Invalid client index", 400));
  }

  const pod = trip.clients[clientIndex].documents?.proofOfDelivery;
  if (!pod || !pod.url) {
    return next(new AppError("No POD found for this client", 404));
  }
  if (pod.status !== "pending") {
    return next(new AppError("POD has already been processed", 400));
  }

  if (action === "verify") {
    pod.status = "verified";
    pod.verifiedBy = req.user.id;
    pod.verifiedAt = new Date();
    trip.markModified(`clients.${clientIndex}.documents`);
    await trip.save();

    // Check if ALL client PODs verified, then mark trip as completed
    const allVerified = trip.clients.every(
      (c) => c.documents?.proofOfDelivery?.status === "verified"
    );
    if (allVerified) {
      trip.status = "completed";
      await trip.save();
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });

      // Notify all clients
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
  } else {
    // reject
    pod.status = "rejected";
    pod.rejectionReason = rejectionReason;
    pod.verifiedBy = req.user.id;
    pod.verifiedAt = new Date();
    trip.markModified(`clients.${clientIndex}.documents`);
    await trip.save();
  }

  res.status(200).json({
    status: "success",
    data: {
      trip,
      message:
        action === "verify"
          ? "POD verified for client"
          : "POD rejected for client",
    },
  });
});
// ---------- UPDATED END ----------
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

  console.log(req.body);
const trip = await Trip.findById(req.params.id)
  .populate({
    path: "clients.client", // ✅ clients array ke andar client ko populate karega
    select: "name email phone", // jo fields chahiye wo select karo
  });  if (!trip || !trip.clients[index]) {
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

  const tripDetails = await trip.addAdvance(advanceData, index);
console.log(client)
  // Log activity
  await logActivity({
    user: req.user._id,
    action: 'advance',
    category: 'financial',
    description: `Client (${client?.client?.name}) advance payment added: ₹${amount} for trip ${trip.tripNumber}`,
    details: {
      amount,
      paidTo,
      purpose,
      notes,
      paymentMethod: pymentMathod,
      clientIndex: index,
      tripNumber: trip.tripNumber,
      clientName: client.client?.name || 'Unknown'
    },
    relatedTrip: trip._id,
    relatedUser: client.client,
    req
  });

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
   const trip = await Trip.findById(req.params.id)
  .populate({
    path: "clients.client", // ✅ clients array ke andar client ko populate karega
    select: "name email phone", // jo fields chahiye wo select karo
  });



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
    client.dueAmount += newExpense;
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

    // Log activity
    await logActivity({
      user: req.user._id,
      action: 'expense',
      category: 'financial',
      description: `Client (${client?.client?.name}) expense added: ₹${amount} for trip ${trip.tripNumber}`,
      details: {
        type,
        amount,
        description,
        paidBy,
        clientIndex: index,
        tripNumber: trip.tripNumber,
        oldExpense,
        newExpense,
        clientName: client.client?.name || 'Unknown'
      },
      relatedTrip: trip._id,
      relatedUser: client.client,
      req
    });

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
    const trip = await Trip.findById(tripId).populate({
    path: "vehicleOwner.ownerId", // ✅ Vehicle Owner details
    select: "name email phone",
  });
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

    // Log activity
    console.log('🔍 Attempting to log fleet advance activity...');
    try {
      await logActivity({
        user: req.user?._id,
        action: 'advance',
        category: 'financial',
        description: `Fleet advance (${trip?.vehicleOwner?.ownerId?.name}) of ₹${amount} added to trip ${trip.tripNumber}`,
        details: {
          amount,
          paymentType,
          reason,
          date: newAdvance.date,
          tripNumber: trip.tripNumber,
          totalFleetAdvance: trip.totalFleetAdvance,
          fleetOwnerId: trip.vehicleOwner?.ownerId
        },
        relatedTrip: trip._id,
        severity: 'medium',
        req
      });
      console.log('✅ Fleet advance activity logged successfully');
    } catch (logError) {
      console.error('❌ Failed to log fleet advance activity:', logError);
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
const trip = await Trip.findById(tripId)
  .populate({
    path: "vehicleOwner.ownerId", // ✅ Vehicle Owner ke andar ownerId
    select: "name email phone", // jo fields chahiye
  });


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
    trip.totalFleetAdvance =
      (trip.totalFleetAdvance || 0) - (deletedAdvance.amount || 0);

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

    // Log activity
    await logActivity({
      user: req.user?._id,
      action: 'advance',
      category: 'financial',
      description: `Fleet (${trip?.vehicleOwner?.ownerId?.name}) advance of ₹${deletedAdvance.amount} deleted from trip ${trip.tripNumber}`,
      details: {
        deletedAmount: deletedAdvance.amount,
        deletedReason: deletedAdvance.reason,
        deletedPaymentType: deletedAdvance.paymentType,
        advanceIndex,
        tripNumber: trip.tripNumber,
        remainingFleetAdvance: trip.totalFleetAdvance,
        fleetOwnerId: trip.vehicleOwner?.ownerId
      },
      relatedTrip: trip._id,
      severity: 'medium',
      req
    });

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
const trip = await Trip.findById(tripId)
  .populate({
    path: "vehicleOwner.ownerId", // ✅ Vehicle Owner ke andar ownerId
    select: "name email phone", // jo fields chahiye
  });
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

    // Log activity
    await logActivity({
      user: req.user?._id,
      action: 'expense',
      category: 'financial',
      description: `Fleet (${trip?.vehicleOwner?.ownerId?.name}) expense of ₹${amount} added to trip ${trip.tripNumber}`,
      details: {
        amount,
        reason,
        category,
        description,
        receiptNumber,
        tripNumber: trip.tripNumber,
        totalFleetExpense: trip.totalFleetExpense,
        fleetOwnerId: trip.vehicleOwner?.ownerId
      },
      relatedTrip: trip._id,
      severity: 'medium',
      req
    });

    res.status(200).json({ success: true, trip });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add Self Expense
const addSelfExpense = async (req, res) => {
  const { tripId } = req.params;
  const { amount, reason, category, expenseFor, description, receiptNumber } =
    req.body;

  try {
    const trip = await Trip.findById(tripId)
  .populate({
    path: "driver", // ✅ Driver details
    select: "name email phone",
  });

    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const expenseData = {
      amount,
      reason,
      category,
      expenseFor,
      description,
      receiptNumber,
      paidAt: new Date(),
      tripId,
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
      console.log(vehicle);
      if (vehicle) {
        vehicle.vehicleExpenseHistory.push(expenseData);
        await vehicle.save();
      }
    }

    await trip.save();

    // Log activity
    await logActivity({
      user: req.user?._id,
      action: 'expense',
      category: 'financial',
      description: `Self expense (${trip.driver?.name}) added: ₹${amount} for ${expenseFor} in trip ${trip.tripNumber}`,
      details: {
        amount,
        reason,
        category,
        expenseFor,
        description,
        receiptNumber,
        tripNumber: trip.tripNumber
      },
      relatedTrip: trip._id,
      relatedUser: expenseFor === 'driver' ? trip.driver : null,
      relatedVehicle: expenseFor === 'vehicle' ? trip.vehicle : null,
      severity: 'medium',
      req
    });

    res
      .status(200)
      .json({ success: true, message: "Self expense added successfully" });
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
    const trip = await Trip.findById(tripIdeq.params.id)
  .populate({
    path: "driver", // ✅ Driver details
    select: "name email phone",
  });
      if (!trip || !trip.selfExpenses?.[expenseIndex]) {
      return res.status(404).json({ message: "Trip or expense not found" });
    }

    const expense = trip.selfExpenses[expenseIndex];

    // Remove from driver history if applicable
    if (expense.expenseFor === "driver" && trip.driver) {
      await User.findByIdAndUpdate(trip.driver, {
        $pull: {
          driverExpenseHistory: {
            paidAt: expense.paidAt,
            amount: expense.amount,
          },
        },
      });
    }

    // Remove from vehicle history if applicable
    if (expense.expenseFor === "vehicle" && trip.vehicle) {
      await Vehicle.findByIdAndUpdate(trip.vehicle, {
        $pull: {
          vehicleExpenseHistory: {
            paidAt: expense.paidAt,
            amount: expense.amount,
          },
        },
      });
    }

    // Remove from trip
    trip.selfExpenses.splice(expenseIndex, 1);
    await trip.save();

    // Log activity
    await logActivity({
      user: req.user?._id,
      action: 'delete',
      category: 'financial',
      description: `Self expense (${trip.driver?.name})(${trip.driver?.name}) of ₹${expense.amount} deleted from trip ${trip.tripNumber}`,
      details: {
        deletedAmount: expense.amount,
        deletedReason: expense.reason,
        deletedCategory: expense.category,
        expenseFor: expense.expenseFor,
        expenseIndex,
        tripNumber: trip.tripNumber
      },
      relatedTrip: trip._id,
      relatedUser: expense.expenseFor === 'driver' ? trip.driver : null,
      relatedVehicle: expense.expenseFor === 'vehicle' ? trip.vehicle : null,
      severity: 'medium',
      req
    });

    res.status(200).json({
      success: true,
      message: "Self expense deleted successfully",
      trip,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Add Self Advance
const addSelfAdvance = async (req, res) => {
  const { tripId } = req.params;
  const {
    amount,
    reason,
    paymentFor,
    recipientName,
    description,
    referenceNumber,
  } = req.body;

  try {
    const trip = await Trip.findById(tripId)
  .populate({
    path: "driver", // ✅ Driver details
    select: "name email phone",
  });
      if (!trip) return res.status(404).json({ message: "Trip not found" });

    const advanceData = {
      amount,
      reason,
      paymentFor,
      recipientName,
      description,
      referenceNumber,
      paidAt: new Date(),
      tripId,
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

    // Log activity
    await logActivity({
      user: req.user?._id,
      action: 'advance',
      category: 'financial',
      description: `Self advance (${trip.driver?.name}) added: ₹${amount} for driver in trip ${trip.tripNumber}`,
      details: {
        amount,
        reason,
        paymentFor,
        recipientName,
        description,
        referenceNumber,
        tripNumber: trip.tripNumber
      },
      relatedTrip: trip._id,
      relatedUser: paymentFor === 'driver' ? trip.driver : null,
      relatedVehicle: paymentFor === 'vehicle' ? trip.vehicle : null,
      severity: 'medium',
      req
    });

    res
      .status(200)
      .json({ success: true, message: "Self advance added successfully" });
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

    // Log activity
    await logActivity({
      user: req.user?._id,
      action: 'delete',
      category: 'financial',
      description: `Self advance of ₹${advance.amount} deleted from trip ${trip.tripNumber}`,
      details: {
        deletedAmount: advance.amount,
        deletedReason: advance.reason,
        paymentFor: advance.paymentFor,
        description: advance.description,
        advanceIndex,
        tripNumber: trip.tripNumber
      },
      relatedTrip: trip._id,
      relatedUser: advance.paymentFor === 'driver' ? trip.driver : null,
      relatedVehicle: advance.paymentFor === 'vehicle' ? trip.vehicle : null,
      severity: 'medium',
      req
    });

    res.status(200).json({
      success: true,
      message: "Self advance deleted successfully",
      trip,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
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
    trip.podBalance = 0;
    await trip.save();

    // Log activity
    await logActivity({
      user: req.user?._id,
      action: 'pod_details_update',
      category: 'trip_management',
      description: `POD details updated for trip ${trip.tripNumber}`,
      details: {
        podGive,
        paymentType,
        notes,
        tripNumber: trip.tripNumber,
        podBalanceCleared: true
      },
      relatedTrip: trip._id,
      req
    });

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
    const { tripId } = req.params;
    const { status, document } = req.body;

    console.log(req.files);
    console.log(req.file);
    console.log(req.body);
    const trip = await Trip.findById(tripId);

    if (status === "booked" || status === "in_progress") {
      if (trip.vehicle) {
        await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "booked" });
      }
      trip.status = "booked";
      // ✅ Make driver available
      if (trip.driver) {
        await User.findByIdAndUpdate(trip.driver, { status: "booked" });
      }
    }
    if (status === "complete") {
      // ✅ Make vehicle available
      if (trip.vehicle) {
        await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });
      }
      trip.status = "completed";
      // ✅ Make driver available
      if (trip.driver) {
        await User.findByIdAndUpdate(trip.driver, { status: "available" });
      }
    }

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Update podManage object
    trip.podManage = {
      status,
      date: new Date(),
    };

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
      };
    }

    await trip.save();

    res.json({ success: true, trip });
  } catch (err) {
    console.error("Error updating POD status:", err);
    res.status(500).json({ error: "Failed to update POD status" });
  }
};

const clientUpdatePodStatus = async (req, res) => {
  try {
    const { tripId, clientId } = req.params;
    const { status, document } = req.body;

    if (!tripId || !clientId || !status) {
      return res
        .status(400)
        .json({ error: "tripId, clientId, and status are required" });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Find the index of the specific client in the clients array
    const clientIndex = trip.clients.findIndex(
      (c) => c.client.toString() === clientId
    );
    if (clientIndex === -1) {
      return res.status(404).json({ error: "Client not found in trip" });
    }

    // Update podManage fields for that client
    trip.clients[clientIndex].podManage.status = status;
    trip.clients[clientIndex].podManage.date = new Date();

    // If document is provided via file upload (req.file)
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `trips/${trip._id}/pod`,
        resource_type: "auto",
      });

      trip.clients[clientIndex].podManage.document = {
        url: result.url,
        fileType: result.resource_type || "unknown",
        uploadedAt: new Date(),
      };
    }

    await trip.save();

    res.json({
      success: true,
      message: "POD status updated",
      clientPod: trip.clients[clientIndex].podManage,
    });
  } catch (err) {
    console.error("Error updating POD status:", err);
    res.status(500).json({ error: "Failed to update POD status" });
  }
};

const uploadPodDocumentForClient = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { clientId, stepKey } = req.body;

    console.log("🔍 Incoming POD upload request:");
    console.log("tripId:", tripId);
    console.log("clientId:", clientId);
    console.log("stepKey:", stepKey);

    // Validation
    if (!tripId || !clientId || !stepKey) {
      return res.status(400).json({
        error: "tripId, clientId, and stepKey are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Find trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Find client
    const clientIndex = trip.clients.findIndex(
      (c) => c.client.toString() === clientId
    );

    if (clientIndex === -1) {
      return res.status(404).json({ error: "Client not found in trip" });
    }

    console.log("📤 Uploading to Cloudinary...");

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `trips/${tripId}/clients/${clientId}/pod`,
      resource_type: "auto",
    });

    console.log("✅ Uploaded to Cloudinary:", result.secure_url);

    // Create document entry
    const documentEntry = {
      url: result.secure_url,
      fileType: result.format || "unknown",
      uploadedAt: new Date(),
      stepKey,
    };

    // ✅ FIXED: Ensure documents is always an array
    const clientRef = trip.clients[clientIndex];

    // Initialize documents as array if it doesn't exist or is not an array
    if (!Array.isArray(clientRef.documents)) {
      console.warn(
        "⚠️ 'documents' field is not an array. Initializing as empty array."
      );
      clientRef.documents = [];
    }

    // Add the new document
    clientRef.documents.push(documentEntry);

    // Mark the field as modified for Mongoose
    trip.markModified(`clients.${clientIndex}.documents`);

    // Save the trip
    await trip.save();

    console.log("✅ POD document saved successfully");

    return res.status(200).json({
      success: true,
      message: "POD document uploaded successfully",
      document: documentEntry,
      totalDocuments: clientRef.documents.length,
    });
  } catch (error) {
    console.error("❌ Error uploading client POD document:", error);

    // More specific error handling
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid ID format",
        details: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to upload POD document",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const uploadPodDocument = async (req, res) => {
  try {
    const { tripId } = req.params;

    console.log(req.body);
    console.log(req.files);
    console.log(req.file);
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
    const otherExpenses = await Expense.find().lean();

    let totalTrips = trips.length;
    let totalPods = 0;
    let totalTripProfit = 0; // Trip profit excluding commission
    let totalCommission = 0; // Commission earned
    let totalTripDifference = 0; // Difference between client rate and truck cost
    let totalTripExpenses = 0;
    let pendingPodClientsCount = 0;
    let totalPodProfit = 0; // POD profit for fleet owners

    trips.forEach((trip) => {
      const podBalance = trip.podBalance || 0;
      const podBalancePaid = trip.podBalanceTotalPaid || 0;
      const tripAgresment = trip.argestment || 0;
      const podProfit = podBalance - podBalancePaid; // remaining POD is our profit
      totalPods += podBalance;
      totalPodProfit += podProfit > 0 ? podProfit : 0;

      if (podBalance > 0 && Array.isArray(trip.clients)) {
        trip.clients.forEach((client) => {
          if (!client.podReceived) pendingPodClientsCount += 1;
        });
      }

      if (trip.vehicleOwner?.ownershipType === "fleet_owner") {
        const clientTotalRate =
          trip.clients?.reduce((sum, c) => sum + (c.rate || 0), 0) || 0;
        const clientTruckCost =
          trip.clients?.reduce((sum, c) => sum + (c.truckHireCost || 0), 0) || 0;

        const difference = clientTotalRate - clientTruckCost;
        totalTripDifference += difference;

        // Correct profit calculation for fleet_owner
        const profit = difference + (trip.commission || 0) + podProfit;
        totalTripProfit += profit;

        totalCommission += trip.commission || 0;
      } else if (trip.vehicleOwner?.ownershipType === "self") {
        
const tripAgresment =
  trip.argestment || // top-level
  (Array.isArray(trip.clients)
    ? trip.clients.reduce((sum, c) => sum + (c.argestment || 0), 0)
    : 0);  const profit = (trip.totalClientAmount || 0) - (trip.rate || 0) - tripAgresment;
        totalTripProfit += profit;
        totalCommission += trip.commission || 0;

        if (Array.isArray(trip.selfExpenses)) {
          totalTripExpenses += trip.selfExpenses.reduce(
            (sum, exp) => sum + (exp.amount || 0),
            0
          );
        }
        if (Array.isArray(trip.selfAdvances)) {
          totalTripExpenses += trip.selfAdvances.reduce(
            (sum, adv) => sum + (adv.amount || 0),
            0
          );
        }
      }
    });

    const totalOtherExpense = otherExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );

    const totalExpenses = totalTripExpenses + totalOtherExpense;
    const totalFinalProfit = totalTripProfit - totalExpenses; // already included commission in profit

    res.status(200).json({
      success: true,
      data: {
        totalTrips,
        totalPods,
        totalPodProfit,       // POD profit included
        totalTripProfit,      // includes difference + commission + podProfit
        totalCommission,
        totalTripDifference,
        totalExpenses,
        otherExpense: totalOtherExpense,
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
      const selfAdvances = (trip.selfAdvances || [])
        .filter((adv) => adv.paymentFor?.toLowerCase() === "driver")
        .map((adv) => ({
          amount: adv.amount,
          reason: adv.reason,
          paidAt: adv.paidAt,
          description: adv.description,
          referenceNumber: adv.referenceNumber,
        }));

      const selfExpenses = (trip.selfExpenses || [])
        .filter((exp) => exp.expenseFor?.toLowerCase() === "driver")
        .map((exp) => ({
          amount: exp.amount,
          reason: exp.reason,
          category: exp.category,
          paidAt: exp.paidAt,
          description: exp.description,
          receiptNumber: exp.receiptNumber,
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
        selfExpenses,
      });
    }

    const driver = await User.findById(driverId).select(
      "name email phone address advanceAmount"
    );

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
      trips: detailedTrips,
    });
  } catch (error) {
    console.error("Error fetching driver trip summary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getClientArgestment = async (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ message: "Client ID is required" });
  }

  try {
    const trips = await Trip.aggregate([
      { $unwind: "$clients" },
      { $match: { "clients.client": new mongoose.Types.ObjectId(clientId) } },
      {
        $lookup: {
          from: "vehicles", // ✅ CORRECT: lowercase, plural
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicleInfo",
        },
      },
      { $unwind: { path: "$vehicleInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          tripNumber: 1,
          loadDate: "$clients.loadDate",
          argestment: "$clients.argestment",
          origin: "$clients.origin.city",
          destination: "$clients.destination.city",
          vehicleNumber: "$vehicleInfo.registrationNumber",
        },
      },
    ]);

    const totalArgestment = trips.reduce(
      (sum, trip) => sum + (trip.argestment || 0),
      0
    );
    const totalTripsWithArgestment = trips.filter(
      (t) => t.argestment > 0
    ).length;

    const client = await User.findById(clientId).select(
      "name totalPayArgestment"
    );

    res.status(200).json({
      success: true,
      client: {
        _id: client._id,
        name: client.name,
        totalPayArgestment: client.totalPayArgestment || 0,
      },
      summary: {
        totalTrips: trips.length,
        totalArgestment,
        totalTripsWithArgestment,
        totalPayArgestment: client.totalPayArgestment || 0,
      },
      trips: trips.map((trip) => ({
        tripNumber: trip.tripNumber,
        vehicleNumber: trip.vehicleNumber || "N/A",
        loadDate: trip.loadDate,
        route: `${trip.origin} → ${trip.destination}`,
        argestment: trip.argestment || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching client argestment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
const payClientAdjustment = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid amount is required." });
    }

    const user = await User.findById(clientId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found." });
    }

    // Update or append payment logic
    user.totalPayArgestment += Number(amount); // or += amount if cumulative
    await user.save();

    res.status(200).json({
      success: true,
      message: "Pay adjustment saved successfully.",
      totalPayArgestment: user.totalPayArgestment,
    });
  } catch (error) {
    console.error("payClientAdjustment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// const updateTripStatus = catchAsync(async (req, res, next) => {
//   const { id } = req.params; // Trip ID
//   const { status } = req.body;

//   const trip = await Trip.findById(id);
//   if (!trip) {
//     return next(new AppError("Trip not found", 404));
//   }

//   // POD complete check logic
//   if (status === "completed") {
//     const allClientsPODVerified = trip.clients.every(
//       (c) => c.documents?.proofOfDelivery?.status === "verified"
//     );
//     if (!allClientsPODVerified) {
//       return next(
//         new AppError(
//           "All client PODs must be verified to complete the trip",
//           400
//         )
//       );
//     }
//     // Make vehicle available
//     if (trip.vehicle) {
//       await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" });
//     }
//     trip.status = "completed";
//     if (trip.driver) {
//       await User.findByIdAndUpdate(trip.driver, { status: "available" });
//     }
//   }

//   if (status === "booked" || status === "in_progress") {
//     if (trip.vehicle) {
//       await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "booked" });
//     }
//     trip.status = status;
//     if (trip.driver) {
//       await User.findByIdAndUpdate(trip.driver, { status: "booked" });
//     }
//   }

//   await trip.save();
//   res.status(200).json({
//     status: "success",
//     data: { trip },
//   });
// });

const updateTripStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;

    const trip = await Trip.findById(tripId);
    console.log(trip);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // 🚦 Update statuses for driver/vehicle based on trip status
    switch (status) {
      case "started":
        if (trip.vehicle) {
          await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "booked" });
        }
        if (trip.driver) {
          await User.findByIdAndUpdate(trip.driver, { status: "booked" });
        }
        break;

      case "complete":
      case "settled":
        if (trip.vehicle) {
          await Vehicle.findByIdAndUpdate(trip.vehicle, {
            status: "available",
          });
        }
        if (trip.driver) {
          await User.findByIdAndUpdate(trip.driver, { status: "available" });
        }
        break;

      default:
        // For pod_received, pod_submitted, etc. — no driver/vehicle change
        break;
    }

    // 🗂 Just update trip status
    trip.status = status;
    await trip.save();

    res.json({ success: true, trip });
  } catch (err) {
    console.error("Error updating trip status:", err);
    res.status(500).json({ error: "Failed to update trip status" });
  }
};


const getPodStatusReport = async (req, res) => {
  try {
    const trips = await Trip.find({})
      .populate("clients.client", "name email")
      .populate("vehicle", "registrationNumber") // ✅ Vehicle ka registrationNumber laa rahe hain
      .select("tripNumber clients scheduledDate vehicle");

    const pendingStatuses = ["started", "complete"];
    const submittedStatuses = ["pod_received", "pod_submitted", "settled"];

    let pending = [];
    let submitted = [];

    trips.forEach((trip) => {
      trip.clients.forEach((c) => {
        const status = c.podManage?.status || "started";

        const clientData = {
          tripId: trip._id,                 // ✅ Trip id
          tripNumber: trip.tripNumber,      // ✅ Trip number
          tripDate: trip.scheduledDate,     // ✅ Trip date
          vehicleNumber: trip.vehicle?.registrationNumber, // ✅ Vehicle registration number
          clientId: c.client?._id,
          clientName: c.client?.name,
          clientEmail: c.client?.email,
          from: c.origin?.city,             // ✅ From city
          to: c.destination?.city,          // ✅ To city
          status: status,
        };

        if (pendingStatuses.includes(status)) {
          pending.push(clientData);
        } else if (submittedStatuses.includes(status)) {
          submitted.push(clientData);
        }
      });
    });

    return res.json({
      success: true,
      message: "POD status report generated",
      data: {
        pending,
        submitted,
      },
    });
  } catch (err) {
    console.error("Error fetching POD report:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching POD status report",
    });
  }
};


const getFleetOwnerStatement = async (req, res) => {
  try {
    const { fleetOwnerId, filterType, startDate, endDate, search } = req.body;
    console.log(req.body);

    if (!fleetOwnerId) {
      return res.status(400).json({
        success: false,
        message: "Fleet Owner ID is required",
      });
    }

    // ✅ Base Query
    let query = { "vehicleOwner.ownerId": new mongoose.Types.ObjectId(fleetOwnerId) };

    // ✅ Date Filter
    if (startDate && endDate) {
      query.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // ✅ Search (tripNumber, driver name, vehicle number, client name, etc.)
    if (search) {
      query.$or = [
        { tripNumber: { $regex: search, $options: "i" } },
        { "driver.name": { $regex: search, $options: "i" } },
        { "vehicle.vehicleNumber": { $regex: search, $options: "i" } },
        { "client.name": { $regex: search, $options: "i" } },
      ];
    }

    const trips = await Trip.find(query);

    if (!trips.length) {
      return res.status(404).json({
        success: false,
        message: "No trips found for this fleet owner",
      });
    }

    // ✅ Trips Data + Advances Merge
    let advancesMerged = [];
    let totalAmount = 0;
    let totalAdvancesPaid = 0;
    let totalPod = 0;
    let totalPodPending = 0;

    const tripData = trips.map((trip) => {
      let amount = 0;

      if (filterType === "with_pod") {
        amount = trip.rate;
      } else if (filterType === "without_pod") {
        amount = trip.rate - (trip.podBalance || 0);
      } else {
        amount = trip.rate; // default
      }

      // Summary calculations
      totalAmount += amount;
      totalAdvancesPaid += trip.totalFleetAdvance || 0;
      totalPod += trip.podBalance || 0;
      totalPodPending += (trip.podBalance || 0) - (trip.podBalanceTotalPaid || 0);

      // Merge Fleet Advances with trip details
      if (trip.fleetAdvances && trip.fleetAdvances.length > 0) {
        trip.fleetAdvances.forEach((adv) => {
          advancesMerged.push({
            tripNumber: trip.tripNumber,
            _id: trip._id,
            scheduledDate: trip.scheduledDate,
            advanceDate: adv.date,
            amount: adv.amount,
            reason: adv.reason,
            paymentType: adv.paymentType,
          });
        });
      }

      return {
        tripNumber: trip.tripNumber,
        scheduledDate: trip.scheduledDate,
        amount,
            _id: trip._id,

        podPending: (trip.podBalance || 0) - (trip.podBalanceTotalPaid || 0),
        totalPod: trip.podBalance || 0,
        fleetAdvancesTotal: trip.totalFleetAdvance || 0,
      };
    });

    // ✅ Final Summary
    const summary = {
      totalAmount,
      totalAdvancesPaid,
      totalPending: totalAmount - totalAdvancesPaid,
      totalPod,
      totalPodPending,
    };

    return res.status(200).json({
      success: true,
      message: "Fleet Owner Statement fetched successfully",
      summary,        // ✅ summary block added
      trips: tripData,
      advances: advancesMerged,
    });
  } catch (error) {
    console.error("Error fetching fleet owner statement:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
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
  deleteSelfAdvance,
  getClientArgestment,
  payClientAdjustment,
  clientUpdatePodStatus,
  uploadPodDocumentForClient,
  getPodStatusReport,
  getFleetOwnerStatement
};
