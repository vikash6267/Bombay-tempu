

const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const cloudinary = require("../utils/cloudinary");
const { default: mongoose } = require("mongoose");

const getAllVehicles = catchAsync(async (req, res, next) => {
  const filter = {};

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    filter.owner = req.user.id;
    filter.ownershipType = "fleet_owner";
  }

  if (req.user.role === "driver") {
    filter._id = req.user.assignedVehicle;
  }

  // Add ownership type filter if specified
  if (req.query.ownershipType) {
    filter.ownershipType = req.query.ownershipType;
  }
  //  const features = new APIFeatures(Vehicle.find(filter), req.query).filter().sort().limitFields().paginate()

  // const vehicles = await features.query
  //   .populate("owner", "name email phone")
  //   .populate("selfOwnerDetails.adminId", "name email phone");
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  // Handle sorting
  let sort = "-createdAt";
  if (req.query.sort) {
    sort = req.query.sort.split(",").join(" ");
  }

  // Handle field selection
  let select = "-__v";
  if (req.query.fields) {
    select = req.query.fields.split(",").join(" ");
  }

  const vehicles = await Vehicle.find(filter)
    .populate("owner", "name email phone")
    .populate("currentDriver", "name email phone licenseNumber")
    .populate("activeTrips", "tripId status startLocation endLocation")
    .populate("selfOwnerDetails.adminId", "name email phone")
    .sort(sort)
    .select(select)
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: "success",
    results: vehicles.length,
    data: {
      vehicles,
    },
  });
});

const getVehicle = catchAsync(async (req, res, next) => {
  const filter = {_id: req.params.id};

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    filter.owner = req.user.id;
    filter.ownershipType = "fleet_owner";
  }

  if (req.user.role === "driver") {
    if (req.user.assignedVehicle?.toString() !== req.params.id) {
      return next(
        new AppError("You can only access your assigned vehicle", 403)
      );
    }
  }

  const vehicle = await Vehicle.findOne(filter)
    .populate("owner", "name email phone")
    .populate("selfOwnerDetails.adminId", "name email phone")
    .populate("currentDriver", "name email phone licenseNumber");

  if (!vehicle) {
    return next(new AppError("No vehicle found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      vehicle,
    },
  });
});

const createVehicle = catchAsync(async (req, res, next) => {
  const {ownershipType, owner, commissionRate} = req.body;
  let vehicle;

  // Validate ownership type
  if (!ownershipType || !["self", "fleet_owner"].includes(ownershipType)) {
    return next(
      new AppError(
        "Valid ownership type is required (self or fleet_owner)",
        400
      )
    );
  }

  // Set ownership details based on type
  if (ownershipType === "self") {
    // For self-owned vehicles, remove owner and commission rate
    delete req.body.owner;
    delete req.body.commissionRate;

    // Only admin can create self-owned vehicles
    if (req.user.role !== "admin") {
      return next(
        new AppError("Only admin can create self-owned vehicles", 403)
      );
    }

    let details = {
      selfOwnerDetails: {
        adminId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
    };

    vehicle = await Vehicle.create({...req.body, ...details});
  } else if (ownershipType === "fleet_owner") {
    // For fleet owner vehicles, validate owner and commission rate
    if (!owner) {
      return next(
        new AppError("Fleet owner is required for fleet_owner vehicles", 400)
      );
    }

    if (
      commissionRate === undefined ||
      commissionRate < 0 ||
      commissionRate > 100
    ) {
      return next(
        new AppError(
          "Commission rate is required and must be between 0-100%",
          400
        )
      );
    }

    // Verify owner exists and is a fleet owner
    const ownerUser = await User.findById(owner);
    if (!ownerUser || ownerUser.role !== "fleet_owner") {
      return next(new AppError("Invalid fleet owner specified", 400));
    }

    // If user is fleet owner, they can only create vehicles for themselves
    // if (req.user.role === "fleet_owner" && req.user.id !== owner) {
    //   return next(
    //     new AppError(
    //       "Fleet owners can only create vehicles for themselves",
    //       403
    //     )
    //   );
    // }

    vehicle = await Vehicle.create({...req.body});
  }

  // Populate the created vehicle
  await vehicle.populate([
    {path: "owner", select: "name email phone"},
    {path: "selfOwnerDetails.adminId", select: "name email phone"},
  ]);

  res.status(201).json({
    status: "success",
    data: {
      vehicle,
    },
  });
});

const updateVehicle = catchAsync(async (req, res, next) => {
  const filter = {_id: req.params.id};

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    filter.owner = req.user.id;
    filter.ownershipType = "fleet_owner";
  }

  // Don't allow changing ownership details through this endpoint
  delete req.body.ownershipType;
  delete req.body.owner;
  delete req.body.selfOwnerDetails;
  delete req.body.commissionRate;

  const vehicle = await Vehicle.findOneAndUpdate(filter, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    {path: "owner", select: "name email phone"},
    {path: "selfOwnerDetails.adminId", select: "name email phone"},
  ]);

  if (!vehicle) {
    return next(new AppError("No vehicle found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      vehicle,
    },
  });
});

const deleteVehicle = catchAsync(async (req, res, next) => {
  const filter = {_id: req.params.id};

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    filter.owner = req.user.id;
    filter.ownershipType = "fleet_owner";
  }

  const vehicle = await Vehicle.findOneAndDelete(filter);

  if (!vehicle) {
    return next(new AppError("No vehicle found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

const uploadDocument = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a file", 400));
  }

  const {documentType} = req.body;
  if (!documentType) {
    return next(new AppError("Please specify document type", 400));
  }

  const filter = {_id: req.params.id};

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    filter.owner = req.user.id;
    filter.ownershipType = "fleet_owner";
  }

  const vehicle = await Vehicle.findOne(filter);
  if (!vehicle) {
    return next(new AppError("No vehicle found with that ID", 404));
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: `vehicles/${vehicle._id}/documents`,
    resource_type: "auto",
  });

  // Update vehicle document
  const updateData = {};
  updateData[`documents.${documentType}.url`] = result.secure_url;

  if (req.body.expiryDate) {
    updateData[`documents.${documentType}.expiryDate`] = req.body.expiryDate;
  }

  if (req.body.policyNumber && documentType === "insurance") {
    updateData[`documents.${documentType}.policyNumber`] =
      req.body.policyNumber;
  }

  const updatedVehicle = await Vehicle.findByIdAndUpdate(
    vehicle._id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).populate([
    {path: "owner", select: "name email phone"},
    {path: "selfOwnerDetails.adminId", select: "name email phone"},
  ]);

  res.status(200).json({
    status: "success",
    data: {
      vehicle: updatedVehicle,
      documentUrl: result.secure_url,
    },
  });
});

const getMaintenanceRecords = catchAsync(async (req, res, next) => {
  const filter = {_id: req.params.id};

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    filter.owner = req.user.id;
    filter.ownershipType = "fleet_owner";
  }

  const vehicle = await Vehicle.findOne(filter).populate("maintenanceRecords");

  if (!vehicle) {
    return next(new AppError("No vehicle found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      maintenanceRecords: vehicle.maintenanceRecords,
    },
  });
});

const getExpiringDocuments = catchAsync(async (req, res, next) => {
  const days = Number.parseInt(req.query.days) || 30;
  const checkDate = new Date();
  checkDate.setDate(checkDate.getDate() + days);

  const filter = {};
  if (req.user.role === "fleet_owner") {
    filter.owner = req.user.id;
    filter.ownershipType = "fleet_owner";
  }

  const vehicles = await Vehicle.find(filter)
    .populate("owner", "name email phone")
    .populate("selfOwnerDetails.adminId", "name email phone");

  const expiringVehicles = vehicles
    .filter((vehicle) => {
      const expiringDocs = vehicle.getExpiringDocuments(days);
      return expiringDocs.length > 0;
    })
    .map((vehicle) => ({
      vehicle: {
        _id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        ownershipType: vehicle.ownershipType,
        owner:
          vehicle.ownershipType === "fleet_owner"
            ? vehicle.owner
            : vehicle.selfOwnerDetails,
      },
      expiringDocuments: vehicle.getExpiringDocuments(days),
    }));

  res.status(200).json({
    status: "success",
    results: expiringVehicles.length,
    data: {
      expiringVehicles,
    },
  });
});

const getEMIDueVehicles = catchAsync(async (req, res, next) => {
  const filter = {
    "loanDetails.hasLoan": true,
    "loanDetails.loanStatus": "active",
  };

  if (req.user.role === "fleet_owner") {
    filter.owner = req.user.id;
    filter.ownershipType = "fleet_owner";
  }

  const vehicles = await Vehicle.find(filter)
    .populate("owner", "name email phone")
    .populate("selfOwnerDetails.adminId", "name email phone");

  const emiDueVehicles = vehicles
    .filter((vehicle) => vehicle.isEMIDue())
    .map((vehicle) => ({
      vehicle: {
        _id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        ownershipType: vehicle.ownershipType,
        owner:
          vehicle.ownershipType === "fleet_owner"
            ? vehicle.owner
            : vehicle.selfOwnerDetails,
      },
      loanDetails: {
        emiAmount: vehicle.loanDetails.emiAmount,
        emiDueDate: vehicle.loanDetails.emiDueDate,
        loanProvider: vehicle.loanDetails.loanProvider,
        remainingInstallments: vehicle.loanDetails.remainingInstallments,
      },
    }));

  res.status(200).json({
    status: "success",
    results: emiDueVehicles.length,
    data: {
      emiDueVehicles,
    },
  });
});

// New endpoint to get vehicles by ownership type
const getVehiclesByOwnership = catchAsync(async (req, res, next) => {
  const {ownershipType} = req.params;

  if (!["self", "fleet_owner"].includes(ownershipType)) {
    return next(new AppError("Invalid ownership type", 400));
  }

  const filter = {ownershipType};

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    if (ownershipType !== "fleet_owner") {
      return next(
        new AppError("Fleet owners can only access fleet owner vehicles", 403)
      );
    }
    filter.owner = req.user.id;
  }

  const vehicles = await Vehicle.find(filter)
    .populate("owner", "name email phone")
    .populate("selfOwnerDetails.adminId", "name email phone");

  res.status(200).json({
    status: "success",
    results: vehicles.length,
    data: {
      vehicles,
    },
  });
});








const getVehicleExpenseTotal = catchAsync(async (req, res, next) => {
  const { vehicleId } = req.params;

  // ✅ Validate ID
  if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
    return next(new AppError("Invalid vehicle ID", 400));
  }

  // ✅ Fetch vehicle with expense history
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    return next(new AppError("Vehicle not found", 404));
  }

  // ✅ Total Expense
  const totalExpense = vehicle.vehicleExpenseHistory.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  // ✅ Group expenses by Date (Formatted as yyyy-mm-dd)
  const expenseByDate = {};

  vehicle.vehicleExpenseHistory.forEach((exp) => {
    const dateKey = exp.paidAt
      ? new Date(exp.paidAt).toISOString().slice(0, 10)
      : "unknown_date";

    if (!expenseByDate[dateKey]) {
      expenseByDate[dateKey] = {
        totalForDate: 0,
        expenses: [],
      };
    }

    expenseByDate[dateKey].totalForDate += exp.amount;

    expenseByDate[dateKey].expenses.push({
      amount: exp.amount,
      reason: exp.reason,
      category: exp.category,
      description: exp.description,
      receiptNumber: exp.receiptNumber,
      paidAt: exp.paidAt,
    });
  });

  res.status(200).json({
    success: true,
    vehicleId,
    totalExpense,
    expenseCount: vehicle.vehicleExpenseHistory.length,
    expenseByDate,
  });
});

module.exports = {
  getAllVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadDocument,
  getMaintenanceRecords,
  getExpiringDocuments,
  getEMIDueVehicles,
  getVehiclesByOwnership,
  getVehicleExpenseTotal,
};
