const Maintenance = require("../models/Maintenance")
const Vehicle = require("../models/Vehicle")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
const APIFeatures = require("../utils/apiFeatures")
const cloudinary = require("../utils/cloudinary")

const getAllMaintenance = catchAsync(async (req, res, next) => {
  const filter = {}

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    // Get vehicles owned by this fleet owner
    const vehicles = await Vehicle.find({ owner: req.user.id }).select("_id")
    const vehicleIds = vehicles.map((v) => v._id)
    filter.vehicle = { $in: vehicleIds }
  }

  const features = new APIFeatures(Maintenance.find(filter), req.query).filter().sort().limitFields().paginate()

  const maintenanceRecords = await features.query
    .populate("vehicle", "registrationNumber make model owner")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")

  res.status(200).json({
    status: "success",
    results: maintenanceRecords.length,
    data: {
      maintenanceRecords,
    },
  })
})

const getMaintenance = catchAsync(async (req, res, next) => {
  const filter = { _id: req.params.id }

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    const vehicles = await Vehicle.find({ owner: req.user.id }).select("_id")
    const vehicleIds = vehicles.map((v) => v._id)
    filter.vehicle = { $in: vehicleIds }
  }

  const maintenance = await Maintenance.findOne(filter)
    .populate("vehicle", "registrationNumber make model owner capacity")
    .populate("createdBy", "name email phone")
    .populate("updatedBy", "name email phone")

  if (!maintenance) {
    return next(new AppError("No maintenance record found with that ID", 404))
  }

  res.status(200).json({
    status: "success",
    data: {
      maintenance,
    },
  })
})

const createMaintenance = catchAsync(async (req, res, next) => {
  const { vehicle } = req.body

  // Validate vehicle exists
  const vehicleDoc = await Vehicle.findById(vehicle)
  if (!vehicleDoc) {
    return next(new AppError("Invalid vehicle specified", 400))
  }

  // If user is fleet owner, ensure they own the vehicle
  if (req.user.role === "fleet_owner" && vehicleDoc.owner.toString() !== req.user.id) {
    return next(new AppError("You can only create maintenance records for your own vehicles", 403))
  }

  req.body.createdBy = req.user.id

  const maintenance = await Maintenance.create(req.body)

  // Update vehicle maintenance cost
  await Vehicle.findByIdAndUpdate(vehicle, {
    $inc: { maintenanceCost: req.body.costs?.totalCost || 0 },
    lastMaintenanceDate: req.body.startDate,
    nextMaintenanceDate: req.body.nextServiceDate,
  })

  // Populate the created maintenance record
  await maintenance.populate([
    { path: "vehicle", select: "registrationNumber make model" },
    { path: "createdBy", select: "name email" },
  ])

  res.status(201).json({
    status: "success",
    data: {
      maintenance,
    },
  })
})

const updateMaintenance = catchAsync(async (req, res, next) => {
  const filter = { _id: req.params.id }

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    const vehicles = await Vehicle.find({ owner: req.user.id }).select("_id")
    const vehicleIds = vehicles.map((v) => v._id)
    filter.vehicle = { $in: vehicleIds }
  }

  // Don't allow changing vehicle through update
  delete req.body.vehicle
  req.body.updatedBy = req.user.id

  const maintenance = await Maintenance.findOneAndUpdate(filter, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "vehicle", select: "registrationNumber make model" },
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ])

  if (!maintenance) {
    return next(new AppError("No maintenance record found with that ID", 404))
  }

  res.status(200).json({
    status: "success",
    data: {
      maintenance,
    },
  })
})

const completeMaintenance = catchAsync(async (req, res, next) => {
  const filter = { _id: req.params.id }

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    const vehicles = await Vehicle.find({ owner: req.user.id }).select("_id")
    const vehicleIds = vehicles.map((v) => v._id)
    filter.vehicle = { $in: vehicleIds }
  }

  const maintenance = await Maintenance.findOne(filter)
  if (!maintenance) {
    return next(new AppError("No maintenance record found with that ID", 404))
  }

  if (maintenance.status === "completed") {
    return next(new AppError("Maintenance is already completed", 400))
  }

  await maintenance.markCompleted(req.user.id)

  // Update vehicle status back to available if it was in maintenance
  await Vehicle.findByIdAndUpdate(maintenance.vehicle, {
    status: "available",
    lastMaintenanceDate: new Date(),
    nextMaintenanceDate: maintenance.nextServiceDate,
  })

  res.status(200).json({
    status: "success",
    data: {
      maintenance,
      message: "Maintenance marked as completed successfully",
    },
  })
})

const uploadDocument = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a file", 400))
  }

  const { documentType, description } = req.body
  if (!documentType || !["invoice", "receipt", "work_order", "photo"].includes(documentType)) {
    return next(new AppError("Please specify valid document type", 400))
  }

  const filter = { _id: req.params.id }

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    const vehicles = await Vehicle.find({ owner: req.user.id }).select("_id")
    const vehicleIds = vehicles.map((v) => v._id)
    filter.vehicle = { $in: vehicleIds }
  }

  const maintenance = await Maintenance.findOne(filter)
  if (!maintenance) {
    return next(new AppError("No maintenance record found with that ID", 404))
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: `maintenance/${maintenance._id}/documents`,
    resource_type: "auto",
  })

  // Update maintenance document
  const updateData = {}
  const now = new Date()

  if (documentType === "photo") {
    updateData.$push = {
      "documents.photos": {
        url: result.secure_url,
        description: description || "",
        uploadedAt: now,
      },
    }
  } else {
    updateData[`documents.${documentType}`] = result.secure_url
  }

  const updatedMaintenance = await Maintenance.findByIdAndUpdate(maintenance._id, updateData, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    status: "success",
    data: {
      maintenance: updatedMaintenance,
      documentUrl: result.secure_url,
    },
  })
})

const deleteMaintenance = catchAsync(async (req, res, next) => {
  const maintenance = await Maintenance.findById(req.params.id)

  if (!maintenance) {
    return next(new AppError("No maintenance record found with that ID", 404))
  }

  // Only allow deletion of scheduled or cancelled maintenance
  if (!["scheduled", "cancelled"].includes(maintenance.status)) {
    return next(new AppError("Cannot delete maintenance records that are in progress or completed", 400))
  }

  await Maintenance.findByIdAndDelete(req.params.id)

  res.status(204).json({
    status: "success",
    data: null,
  })
})

const getUpcomingMaintenance = catchAsync(async (req, res, next) => {
  const days = Number.parseInt(req.query.days) || 30
  let upcomingMaintenance = await Maintenance.getUpcomingMaintenance(days)

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    upcomingMaintenance = upcomingMaintenance.filter(
      (maintenance) => maintenance.vehicle.owner.toString() === req.user.id,
    )
  }

  res.status(200).json({
    status: "success",
    results: upcomingMaintenance.length,
    data: {
      upcomingMaintenance,
    },
  })
})

const getMaintenanceStats = catchAsync(async (req, res, next) => {
  const filter = {}

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    const vehicles = await Vehicle.find({ owner: req.user.id }).select("_id")
    const vehicleIds = vehicles.map((v) => v._id)
    filter.vehicle = { $in: vehicleIds }
  }

  const stats = await Maintenance.getMaintenanceStats(filter)

  // Get monthly maintenance stats for current year
  const currentYear = new Date().getFullYear()
  const monthlyStats = await Maintenance.aggregate([
    {
      $match: {
        ...filter,
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
        totalCost: { $sum: "$costs.totalCost" },
        avgCost: { $avg: "$costs.totalCost" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ])

  // Get vehicle-wise maintenance costs
  const vehicleStats = await Maintenance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$vehicle",
        maintenanceCount: { $sum: 1 },
        totalCost: { $sum: "$costs.totalCost" },
        avgCost: { $avg: "$costs.totalCost" },
      },
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "_id",
        foreignField: "_id",
        as: "vehicleInfo",
      },
    },
    {
      $unwind: "$vehicleInfo",
    },
    {
      $project: {
        registrationNumber: "$vehicleInfo.registrationNumber",
        make: "$vehicleInfo.make",
        model: "$vehicleInfo.model",
        maintenanceCount: 1,
        totalCost: 1,
        avgCost: 1,
      },
    },
    {
      $sort: { totalCost: -1 },
    },
    {
      $limit: 10,
    },
  ])

  res.status(200).json({
    status: "success",
    data: {
      typeStats: stats,
      monthlyStats,
      vehicleStats,
    },
  })
})

module.exports = {
  getAllMaintenance,
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  completeMaintenance,
  uploadDocument,
  deleteMaintenance,
  getUpcomingMaintenance,
  getMaintenanceStats,
}
