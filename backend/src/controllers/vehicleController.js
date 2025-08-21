

const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const cloudinary = require("../utils/cloudinary");
const { default: mongoose } = require("mongoose");
const dayjs = require("dayjs");



const getVehicleMonthlyFinance = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { month } = req.query;

    if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Valid vehicleId is required.",
      });
    }

    // 1. Parse month
    let monthStart, monthEnd;
    if (month) {
      const [year, mon] = month.split("-");
      if (!year || !mon) {
        return res.status(400).json({
          success: false,
          message: "Month format must be YYYY-MM",
        });
      }
      monthStart = new Date(`${year}-${mon}-01T00:00:00.000Z`);
      monthEnd = new Date(new Date(monthStart).setMonth(monthStart.getMonth() + 1));
    }

    // 2. Vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    // 3. Vehicle Expenses
    const expenses = vehicle.vehicleExpenseHistoryMain || [];
    const filteredVehicleExpenses = month
      ? expenses.filter((e) => {
          const date = new Date(e.paidAt);
          return date >= monthStart && date < monthEnd;
        })
      : expenses;

    const totalVehicleExpense = filteredVehicleExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    // 4. Trips
    const tripQuery = { vehicle: vehicleId };
    if (monthStart && monthEnd) {
      tripQuery.scheduledDate = { $gte: monthStart, $lt: monthEnd };
    }

    const trips = await Trip.find(tripQuery).select(
      "tripNumber scheduledDate totalClientAmount rate selfExpenses selfAdvances"
    );

    let totalIncome = 0;
    let totalSelfExpenses = 0;
    const incomeDetails = [];
    const tripExpenseDetails = [];

    for (const trip of trips) {
      // income
      const amount = trip?.totalClientAmount ?? trip?.rate ?? 0;
      totalIncome += amount;

      incomeDetails.push({
        tripId: trip._id,
        tripNumber: trip.tripNumber,
        amount,
        date: trip.scheduledDate || trip.createdAt,
      });

      // self-expenses per trip (detailed)
      (trip.selfExpenses || []).forEach((exp) => {
        tripExpenseDetails.push({
          tripId: trip._id,
          tripNumber: trip.tripNumber,
          amount: exp.amount || 0,
          reason: exp.reason,
          category: exp.category,
          expenseFor: exp.expenseFor,
          description: exp.description,
          receiptNumber: exp.receiptNumber,
          date: exp.paidAt,
        });
        totalSelfExpenses += exp.amount || 0;
      });
      (trip.selfAdvances || []).forEach((exp) => {
        tripExpenseDetails.push({
          tripId: trip._id,
          tripNumber: trip.tripNumber,
          amount: exp.amount || 0,
          reason: exp.reason,
          category: exp.category,
          expenseFor: exp.expenseFor,
          description: exp.description,
          receiptNumber: exp.receiptNumber,
          date: exp.paidAt,
        });
        totalSelfExpenses += exp.amount || 0;
      });
    }

    // 5. Total Expense = vehicle + self
  const totalExpense = totalVehicleExpense + totalSelfExpenses;

// Merge details into one array
const expenseDetails = [
  ...filteredVehicleExpenses.map((exp) => ({
    _id: exp._id,
    amount: exp.amount || 0,
    reason: exp.reason,
    category: exp.category,
    expenseFor: exp.expenseFor,
    description: exp.description,
    receiptNumber: exp.receiptNumber,
    paidAt: exp.paidAt || exp.date,
    source: "vehicle", // tag for frontend
  })),
  ...tripExpenseDetails.map((exp) => ({
    ...exp,
    source: "trip", // tag for frontend
    paidAt: exp.paidAt || exp.date,

  })),
];
console.log(tripExpenseDetails,"tripExpenseDetails")

// 6. Response
res.status(200).json({
  success: true,
  vehicleId,
  month: month || "all",
  totalIncome,
  totalExpense,
  netProfit: totalIncome - totalExpense,
  incomeDetails,
  expenseDetails, // ✅ single flat array now
});
  } catch (error) {
    console.error("getVehicleMonthlyFinance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};






const getAllVehicles = catchAsync(async (req, res, next) => {
  const filter = {};

  // Role-based filtering
  if (req.user.role === "fleet_owner") {
    filter.owner = req.user.id;
    filter.ownershipType = "fleet_owner";
  }

  if (req.user.role === "driver") {
    filter._id = req.user.assignedVehicle;
  }

  // Ownership type filter
  if (req.query.ownershipType) {
    filter.ownershipType = req.query.ownershipType;
  }

  // 🔍 Search filter (registrationNumber, description, type, location etc.)
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i"); // case-insensitive
    filter.$or = [
      { registrationNumber: searchRegex },
      { description: searchRegex },
      { vehicleType: searchRegex },
      { currentLocation: searchRegex },
      { color: searchRegex },
      { "selfOwnerDetails.name": searchRegex }
    ];
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  // Sorting
  let sort = "-createdAt";
  if (req.query.sort) {
    sort = req.query.sort.split(",").join(" ");
  }

  // Fields selection
  let select = "-__v";
  if (req.query.fields) {
    select = req.query.fields.split(",").join(" ");
  }

  // Query
  const vehicles = await Vehicle.find(filter)
    .populate("owner", "name email phone")
    .populate("currentDriver", "name email phone licenseNumber")
    .populate("activeTrips", "tripId status startLocation endLocation")
    .populate("selfOwnerDetails.adminId", "name email phone")
    .sort(sort)
    .select(select)
    .skip(skip)
    .limit(limit);

  // Total count (for frontend pagination UI)
  const totalCount = await Vehicle.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: vehicles.length,
    total: totalCount,
    page,
    limit,
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
  const { ownershipType, owner, commissionRate } = req.body;

  // --- Map flat loan fields into nested loanDetails ---
  if (req.body.hasLoan !== undefined) {
    req.body.loanDetails = {
      hasLoan: req.body.hasLoan,
      loanAmount: req.body.loanAmount,
      emiAmount: req.body.emiAmount,
      loanTenure: req.body.loanTenure,
      loanProvider: req.body.loanProvider,
      loanStartDate: req.body.loanStartDate
    };
  }

  // --- Map flat paper fields into nested papers ---
  req.body.papers = {
    engineNo: req.body.engineNumber,
    chassisNo: req.body.chassisNumber,
    modelName: req.body.modelName,
    registrationDate: req.body.registrationDate,
    fitnessDate: req.body.fitnessDate,
    taxDate: req.body.taxDate,
    insuranceDate: req.body.insuranceDate,
    puccDate: req.body.puccDate,
    permitDate: req.body.permitDate,
    nationalPermitDate: req.body.nationalPermitDate
  };

  // Remove flat fields to avoid duplicate storage
  [
    "hasLoan", "loanAmount", "emiAmount", "loanTenure", "loanProvider", "loanStartDate",
    "engineNumber", "chassisNumber", "modelName", "registrationDate", "fitnessDate",
    "taxDate", "insuranceDate", "puccDate", "permitDate", "nationalPermitDate"
  ].forEach(f => delete req.body[f]);

  // --- Ownership validation logic (unchanged) ---
  if (!ownershipType || !["self", "fleet_owner"].includes(ownershipType)) {
    return next(new AppError("Valid ownership type is required (self or fleet_owner)", 400));
  }

  let vehicle;
  if (ownershipType === "self") {
    delete req.body.owner;
    delete req.body.commissionRate;

    if (req.user.role !== "admin") {
      return next(new AppError("Only admin can create self-owned vehicles", 403));
    }

    const details = {
      selfOwnerDetails: {
        adminId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      }
    };

    vehicle = await Vehicle.create({ ...req.body, ...details });
  } else if (ownershipType === "fleet_owner") {
    if (!owner) {
      return next(new AppError("Fleet owner is required for fleet_owner vehicles", 400));
    }
    if (commissionRate === undefined || commissionRate < 0 || commissionRate > 100) {
      return next(new AppError("Commission rate must be between 0-100%", 400));
    }

    const ownerUser = await User.findById(owner);
    if (!ownerUser || ownerUser.role !== "fleet_owner") {
      return next(new AppError("Invalid fleet owner specified", 400));
    }

    vehicle = await Vehicle.create({ ...req.body });
  }

  await vehicle.populate([
    { path: "owner", select: "name email phone" },
    { path: "selfOwnerDetails.adminId", select: "name email phone" }
  ]);

  res.status(201).json({
    status: "success",
    data: { vehicle }
  });
});


const updateVehicle = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role === "fleet_owner") {
      filter.owner = req.user.id;
      filter.ownershipType = "fleet_owner";
    }

    // Ownership change handling
    if (req.user.role !== "admin") {
      // Prevent fleet_owner from changing ownership related fields
      ["ownershipType", "owner", "selfOwnerDetails", "commissionRate"].forEach(f => delete req.body[f]);
    } else {
      // If admin is updating ownership type
      if (req.body.ownershipType) {
        if (!["self", "fleet_owner"].includes(req.body.ownershipType)) {
          return next(new AppError("Ownership type must be self or fleet_owner", 400));
        }

        if (req.body.ownershipType === "fleet_owner") {
          if (!req.body.owner) {
            return next(new AppError("Fleet owner is required for fleet_owner type", 400));
          }
          const ownerUser = await User.findById(req.body.owner);
          if (!ownerUser || ownerUser.role !== "fleet_owner") {
            return next(new AppError("Invalid fleet owner specified", 400));
          }
        }

        if (req.body.ownershipType === "self") {
          req.body.selfOwnerDetails = {
            adminId: req.user.id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
          };
          delete req.body.owner;
          delete req.body.commissionRate;
        }
      }
    }

    // --- Map loan fields ---
    if (req.body.hasLoan !== undefined) {
      req.body.loanDetails = {
        hasLoan: req.body.hasLoan,
        loanAmount: req.body.loanAmount,
        emiAmount: req.body.emiAmount,
        loanTenure: req.body.loanTenure,
        loanProvider: req.body.loanProvider,
        loanStartDate: req.body.loanStartDate,
      };
    }

    // --- Map papers fields ---
    req.body.papers = {
      engineNo: req.body.engineNumber,
      chassisNo: req.body.chassisNumber,
      modelName: req.body.modelName,
      registrationDate: req.body.registrationDate,
      fitnessDate: req.body.fitnessDate,
      taxDate: req.body.taxDate,
      insuranceDate: req.body.insuranceDate,
      puccDate: req.body.puccDate,
      permitDate: req.body.permitDate,
      nationalPermitDate: req.body.nationalPermitDate,
    };

    // Remove flat fields
    [
      "hasLoan", "loanAmount", "emiAmount", "loanTenure", "loanProvider", "loanStartDate",
      "engineNumber", "chassisNumber", "modelName", "registrationDate", "fitnessDate",
      "taxDate", "insuranceDate", "puccDate", "permitDate", "nationalPermitDate"
    ].forEach(f => delete req.body[f]);

    const vehicle = await Vehicle.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "owner", select: "name email phone" },
      { path: "selfOwnerDetails.adminId", select: "name email phone" },
    ]);

    if (!vehicle) {
      return next(new AppError("No vehicle found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: { vehicle },
    });
  } catch (err) {
    console.error("Error updating vehicle:", err);
    next(new AppError(err.message || "Something went wrong while updating vehicle", 500));
  }
};




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




const getVehicleExpiries = async (req, res) => { 
  try {
    const vehicles = await Vehicle.find({ ownershipType: "self" });

    const result = { 
      days30: [],   // documents expiry within 30 days
      days90: [],   // documents expiry within 90 days
      days180: [],  // documents expiry within 180 days
      "500km": [],  // service due within 500 km
      "1000km": [], // service due within 1000 km
      "2000km": []  // service due within 2000 km
    };

    const today = dayjs();

    vehicles.forEach((vehicle) => {
      const expiryDocs = [];

      // ---------- DOCUMENTS CHECK ----------
      const docs = vehicle.documents;
      if (docs.registrationCertificate?.expiryDate) {
        expiryDocs.push({ name: "Registration Certificate", expiryDate: docs.registrationCertificate.expiryDate });
      }
      if (docs.insurance?.expiryDate) {
        expiryDocs.push({ name: "Insurance", expiryDate: docs.insurance.expiryDate });
      }
      if (docs.fitnessCertificate?.expiryDate) {
        expiryDocs.push({ name: "Fitness Certificate", expiryDate: docs.fitnessCertificate.expiryDate });
      }
      if (docs.permit?.expiryDate) {
        expiryDocs.push({ name: "Permit", expiryDate: docs.permit.expiryDate });
      }
      if (docs.pollution?.expiryDate) {
        expiryDocs.push({ name: "Pollution Certificate", expiryDate: docs.pollution.expiryDate });
      }

      // ---------- PAPERS CHECK ----------
      const papers = vehicle.papers;
      const paperKeys = {
        fitnessDate: "Fitness",
        taxDate: "Tax",
        insuranceDate: "Insurance (Paper)",
        puccDate: "PUC",
        permitDate: "Permit (Paper)",
        nationalPermitDate: "National Permit",
      };

      for (const key in paperKeys) {
        if (papers[key]) {
          expiryDocs.push({ name: paperKeys[key], expiryDate: papers[key] });
        }
      }

      // ---------- DOCUMENT EXPIRY CATEGORIZATION ----------
      expiryDocs.forEach((doc) => {
        const diff = dayjs(doc.expiryDate).diff(today, "day");

        if (diff <= 30 && diff >= 0) {
          result.days30.push({
            vehicle: vehicle.registrationNumber,
            docName: doc.name,
            expiryDate: doc.expiryDate,
          });
        } else if (diff <= 90 && diff > 30) {
          result.days90.push({
            vehicle: vehicle.registrationNumber,
            docName: doc.name,
            expiryDate: doc.expiryDate,
          });
        } else if (diff <= 180 && diff > 90) {
          result.days180.push({
            vehicle: vehicle.registrationNumber,
            docName: doc.name,
            expiryDate: doc.expiryDate,
          });
        }
      });

      // ---------- SERVICE CHECK ----------
      if (vehicle.currentKilometers && vehicle.nextServiceAtKm) {
        const remainingKm = vehicle.nextServiceAtKm - vehicle.currentKilometers;

        if (remainingKm <= 500 && remainingKm >= 0) {
          result["500km"].push({
            vehicle: vehicle.registrationNumber,
            currentKm: vehicle.currentKilometers,
            nextServiceAtKm: vehicle.nextServiceAtKm,
            remainingKm,
          });
        } else if (remainingKm <= 1000 && remainingKm > 500) {
          result["1000km"].push({
            vehicle: vehicle.registrationNumber,
            currentKm: vehicle.currentKilometers,
            nextServiceAtKm: vehicle.nextServiceAtKm,
            remainingKm,
          });
        } else if (remainingKm <= 2000 && remainingKm > 1000) {
          result["2000km"].push({
            vehicle: vehicle.registrationNumber,
            currentKm: vehicle.currentKilometers,
            nextServiceAtKm: vehicle.nextServiceAtKm,
            remainingKm,
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "Vehicle expiry & service data fetched successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error while fetching vehicle expiry data",
      error: err.message,
    });
  }
};


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
  getVehicleMonthlyFinance,
  getVehicleExpiries
};
