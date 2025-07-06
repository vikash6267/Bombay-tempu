const mongoose = require("mongoose")

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.ObjectId,
      ref: "Vehicle",
      required: [true, "Maintenance record must be associated with a vehicle"],
    },

    maintenanceType: {
      type: String,
      required: [true, "Maintenance type is required"],
      enum: {
        values: ["scheduled", "breakdown", "accident", "inspection", "repair", "service"],
        message: "Invalid maintenance type",
      },
    },

    description: {
      type: String,
      required: [true, "Maintenance description is required"],
      trim: true,
    },

    // Service details
    serviceProvider: {
      name: {
        type: String,
        required: [true, "Service provider name is required"],
      },
      contact: String,
      address: String,
      gstNumber: String,
    },

    // Cost breakdown
    costs: {
      laborCost: {
        type: Number,
        min: 0,
        default: 0,
      },
      partsCost: {
        type: Number,
        min: 0,
        default: 0,
      },
      otherCosts: {
        type: Number,
        min: 0,
        default: 0,
      },
      totalCost: {
        type: Number,
        required: [true, "Total cost is required"],
        min: 0,
      },
    },

    // Parts replaced/serviced
    partsReplaced: [
      {
        partName: {
          type: String,
          required: true,
        },
        partNumber: String,
        quantity: {
          type: Number,
          min: 1,
          default: 1,
        },
        cost: {
          type: Number,
          min: 0,
          required: true,
        },
        warranty: {
          period: Number, // in months
          expiryDate: Date,
        },
      },
    ],

    // Dates
    scheduledDate: Date,
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    completedDate: Date,
    nextServiceDate: Date,

    // Status
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },

    // Odometer readings
    odometerReading: {
      type: Number,
      min: 0,
    },
    nextServiceKm: Number,

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // Documents and receipts
    documents: {
      invoice: String,
      receipt: String,
      workOrder: String,
      photos: [
        {
          url: String,
          description: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Quality and feedback
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,

    // Warranty information
    warrantyInfo: {
      hasWarranty: {
        type: Boolean,
        default: false,
      },
      warrantyPeriod: Number, // in months
      warrantyExpiryDate: Date,
      warrantyProvider: String,
    },

    // System fields
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    // Additional notes
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
maintenanceSchema.index({ vehicle: 1 })
maintenanceSchema.index({ status: 1 })
maintenanceSchema.index({ maintenanceType: 1 })
maintenanceSchema.index({ startDate: -1 })
maintenanceSchema.index({ nextServiceDate: 1 })

// Compound indexes
maintenanceSchema.index({ vehicle: 1, status: 1 })
maintenanceSchema.index({ status: 1, priority: 1 })

// Virtual for maintenance duration
maintenanceSchema.virtual("duration").get(function () {
  if (this.startDate && this.completedDate) {
    return Math.ceil((this.completedDate - this.startDate) / (1000 * 60 * 60 * 24)) // days
  }
  return null
})

// Pre-save middleware to update completion date
maintenanceSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed" && !this.completedDate) {
    this.completedDate = new Date()
  }
  next()
})

// Pre-save middleware to calculate total cost
maintenanceSchema.pre("save", function (next) {
  if (this.costs) {
    this.costs.totalCost = (this.costs.laborCost || 0) + (this.costs.partsCost || 0) + (this.costs.otherCosts || 0)
  }
  next()
})

// Instance method to mark as completed
maintenanceSchema.methods.markCompleted = function (updatedBy) {
  this.status = "completed"
  this.completedDate = new Date()
  this.updatedBy = updatedBy
  return this.save()
}

// Static method to get upcoming maintenance
maintenanceSchema.statics.getUpcomingMaintenance = async function (days = 30) {
  const checkDate = new Date()
  checkDate.setDate(checkDate.getDate() + days)

  return await this.find({
    nextServiceDate: { $lte: checkDate },
    status: { $ne: "completed" },
  })
    .populate("vehicle", "registrationNumber make model owner")
    .sort({ nextServiceDate: 1 })
}

// Static method to get maintenance stats
maintenanceSchema.statics.getMaintenanceStats = async function (filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$maintenanceType",
        count: { $sum: 1 },
        totalCost: { $sum: "$costs.totalCost" },
        avgCost: { $avg: "$costs.totalCost" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ])

  return stats
}

module.exports = mongoose.model("Maintenance", maintenanceSchema)
