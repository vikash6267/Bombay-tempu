const Trip = require("../models/Trip")
const Vehicle = require("../models/Vehicle")
const Payment = require("../models/Payment")
const Maintenance = require("../models/Maintenance")
const User = require("../models/User")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")

const getDashboardStats = catchAsync(async (req, res, next) => {
  const filter = {}
  const vehicleFilter = {}

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    const vehicles = await Vehicle.find({ owner: req.user.id }).select("_id")
    const vehicleIds = vehicles.map((v) => v._id)
    filter.vehicle = { $in: vehicleIds }
    vehicleFilter.owner = req.user.id
  } else if (req.user.role === "client") {
    filter.client = req.user.id
  } else if (req.user.role === "driver") {
    filter.driver = req.user.id
  }

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfYear = new Date(today.getFullYear(), 0, 1)

  // Get basic counts
  const [
    totalTrips,
    activeTrips,
    completedTrips,
    totalVehicles,
    availableVehicles,
    totalRevenue,
    monthlyRevenue,
    pendingPayments,
  ] = await Promise.all([
    Trip.countDocuments(filter),
    Trip.countDocuments({ ...filter, status: { $in: ["booked", "in_progress"] } }),
    Trip.countDocuments({ ...filter, status: "completed" }),
    Vehicle.countDocuments(vehicleFilter),
    Vehicle.countDocuments({ ...vehicleFilter, status: "available" }),
    Trip.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: "$pricing.clientRate" } } }]),
    Trip.aggregate([
      { $match: { ...filter, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$pricing.clientRate" } } },
    ]),
    Payment.countDocuments({ status: "pending" }),
  ])

  // Get recent activities
  const recentTrips = await Trip.find(filter)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("client", "name")
    .populate("vehicle", "registrationNumber")
    .select("tripNumber status origin destination createdAt")

  // Get upcoming maintenance
  const upcomingMaintenance = await Maintenance.find({
    nextServiceDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    status: { $ne: "completed" },
  })
    .populate("vehicle", "registrationNumber make model")
    .limit(5)

  // Get monthly trip trends
  const monthlyTrends = await Trip.aggregate([
    {
      $match: {
        ...filter,
        createdAt: { $gte: startOfYear },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        count: { $sum: 1 },
        revenue: { $sum: "$pricing.clientRate" },
        commission: { $sum: "$pricing.commission" },
      },
    },
    { $sort: { _id: 1 } },
  ])

  res.status(200).json({
    status: "success",
    data: {
      overview: {
        totalTrips,
        activeTrips,
        completedTrips,
        totalVehicles,
        availableVehicles,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        pendingPayments,
      },
      recentActivities: {
        recentTrips,
        upcomingMaintenance,
      },
      trends: {
        monthlyTrends,
      },
    },
  })
})

const getFinancialReports = catchAsync(async (req, res, next) => {
  const { startDate, endDate, type } = req.query

  const dateFilter = {}
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }

  // Revenue Analysis
  const revenueStats = await Trip.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$pricing.clientRate" },
        totalCommission: { $sum: "$pricing.commission" },
        totalFleetOwnerPayments: { $sum: "$pricing.fleetOwnerRate" },
        tripCount: { $sum: 1 },
        avgRevenue: { $avg: "$pricing.clientRate" },
        avgCommission: { $avg: "$pricing.commission" },
      },
    },
  ])

  // Monthly breakdown
  const monthlyBreakdown = await Trip.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$pricing.clientRate" },
        commission: { $sum: "$pricing.commission" },
        tripCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ])

  // Client-wise revenue
  const clientRevenue = await Trip.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$client",
        revenue: { $sum: "$pricing.clientRate" },
        tripCount: { $sum: 1 },
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
    { $unwind: "$clientInfo" },
    {
      $project: {
        name: "$clientInfo.name",
        email: "$clientInfo.email",
        revenue: 1,
        tripCount: 1,
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ])

  // Outstanding payments
  const outstandingPayments = await Payment.aggregate([
    { $match: { status: "pending" } },
    {
      $group: {
        _id: "$paymentType",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ])

  res.status(200).json({
    status: "success",
    data: {
      summary: revenueStats[0] || {},
      monthlyBreakdown,
      clientRevenue,
      outstandingPayments,
    },
  })
})

const getOperationalReports = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query

  const dateFilter = {}
  const vehicleFilter = {}

  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    const vehicles = await Vehicle.find({ owner: req.user.id }).select("_id")
    const vehicleIds = vehicles.map((v) => v._id)
    dateFilter.vehicle = { $in: vehicleIds }
    vehicleFilter.owner = req.user.id
  }

  // Trip status distribution
  const tripStatusStats = await Trip.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        percentage: { $sum: 1 },
      },
    },
  ])

  // Vehicle utilization
  const vehicleUtilization = await Trip.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$vehicle",
        tripCount: { $sum: 1 },
        totalRevenue: { $sum: "$pricing.clientRate" },
        totalDistance: { $sum: "$actualDistance" },
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
    { $unwind: "$vehicleInfo" },
    {
      $project: {
        registrationNumber: "$vehicleInfo.registrationNumber",
        make: "$vehicleInfo.make",
        model: "$vehicleInfo.model",
        tripCount: 1,
        totalRevenue: 1,
        totalDistance: 1,
        utilizationRate: {
          $multiply: [{ $divide: ["$tripCount", 30] }, 100], // Assuming 30 days in month
        },
      },
    },
    { $sort: { tripCount: -1 } },
  ])

  // Driver performance
  const driverPerformance = await Trip.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$driver",
        tripCount: { $sum: 1 },
        totalRevenue: { $sum: "$pricing.clientRate" },
        avgRating: { $avg: "$rating.driverRating" },
        completedTrips: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "driverInfo",
      },
    },
    { $unwind: "$driverInfo" },
    {
      $project: {
        name: "$driverInfo.name",
        email: "$driverInfo.email",
        phone: "$driverInfo.phone",
        tripCount: 1,
        totalRevenue: 1,
        avgRating: 1,
        completionRate: {
          $multiply: [{ $divide: ["$completedTrips", "$tripCount"] }, 100],
        },
      },
    },
    { $sort: { tripCount: -1 } },
    { $limit: 10 },
  ])

  // Route analysis
  const popularRoutes = await Trip.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          origin: "$origin.city",
          destination: "$destination.city",
        },
        tripCount: { $sum: 1 },
        avgRevenue: { $avg: "$pricing.clientRate" },
        totalRevenue: { $sum: "$pricing.clientRate" },
      },
    },
    { $sort: { tripCount: -1 } },
    { $limit: 10 },
  ])

  res.status(200).json({
    status: "success",
    data: {
      tripStatusStats,
      vehicleUtilization,
      driverPerformance,
      popularRoutes,
    },
  })
})

const getVehiclePerformance = catchAsync(async (req, res, next) => {
  const { vehicleId, startDate, endDate } = req.query

  const filter = {}
  const vehicleFilter = {}

  if (vehicleId) {
    filter.vehicle = vehicleId
    vehicleFilter._id = vehicleId
  }

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }

  // Apply role-based filtering
  if (req.user.role === "fleet_owner") {
    const vehicles = await Vehicle.find({ owner: req.user.id }).select("_id")
    const vehicleIds = vehicles.map((v) => v._id)
    if (vehicleId) {
      if (!vehicleIds.map((id) => id.toString()).includes(vehicleId)) {
        return next(new AppError("You can only view performance of your own vehicles", 403))
      }
    } else {
      filter.vehicle = { $in: vehicleIds }
      vehicleFilter.owner = req.user.id
    }
  }

  // Vehicle performance metrics
  const performanceStats = await Trip.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$vehicle",
        tripCount: { $sum: 1 },
        totalRevenue: { $sum: "$pricing.clientRate" },
        totalDistance: { $sum: "$actualDistance" },
        totalFuelConsumed: { $sum: "$fuelConsumed" },
        avgRevenue: { $avg: "$pricing.clientRate" },
        completedTrips: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
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
    { $unwind: "$vehicleInfo" },
    {
      $project: {
        registrationNumber: "$vehicleInfo.registrationNumber",
        make: "$vehicleInfo.make",
        model: "$vehicleInfo.model",
        capacity: "$vehicleInfo.capacity",
        tripCount: 1,
        totalRevenue: 1,
        totalDistance: 1,
        totalFuelConsumed: 1,
        avgRevenue: 1,
        completionRate: {
          $multiply: [{ $divide: ["$completedTrips", "$tripCount"] }, 100],
        },
        revenuePerKm: {
          $cond: [{ $gt: ["$totalDistance", 0] }, { $divide: ["$totalRevenue", "$totalDistance"] }, 0],
        },
        fuelEfficiency: {
          $cond: [{ $gt: ["$totalFuelConsumed", 0] }, { $divide: ["$totalDistance", "$totalFuelConsumed"] }, 0],
        },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ])

  // Maintenance costs
  const maintenanceCosts = await Maintenance.aggregate([
    {
      $match: {
        vehicle: vehicleId ? vehicleId : { $in: await Vehicle.find(vehicleFilter).distinct("_id") },
        createdAt: filter.createdAt || { $exists: true },
      },
    },
    {
      $group: {
        _id: "$vehicle",
        totalMaintenanceCost: { $sum: "$costs.totalCost" },
        maintenanceCount: { $sum: 1 },
        avgMaintenanceCost: { $avg: "$costs.totalCost" },
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
    { $unwind: "$vehicleInfo" },
    {
      $project: {
        registrationNumber: "$vehicleInfo.registrationNumber",
        totalMaintenanceCost: 1,
        maintenanceCount: 1,
        avgMaintenanceCost: 1,
      },
    },
  ])

  // Combine performance and maintenance data
  const combinedData = performanceStats.map((perf) => {
    const maintenance = maintenanceCosts.find((maint) => maint.registrationNumber === perf.registrationNumber)
    return {
      ...perf,
      totalMaintenanceCost: maintenance?.totalMaintenanceCost || 0,
      maintenanceCount: maintenance?.maintenanceCount || 0,
      netProfit: perf.totalRevenue - (maintenance?.totalMaintenanceCost || 0),
    }
  })

  res.status(200).json({
    status: "success",
    data: {
      vehiclePerformance: combinedData,
    },
  })
})

module.exports = {
  getDashboardStats,
  getFinancialReports,
  getOperationalReports,
  getVehiclePerformance,
}
