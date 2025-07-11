const mongoose = require("mongoose")

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - trip
 *         - amount
 *         - paymentType
 *         - paidBy
 *         - paidTo
 *       properties:
 *         paymentNumber:
 *           type: string
 *           description: Auto-generated payment number
 *         trip:
 *           type: string
 *           description: Trip ID
 *         amount:
 *           type: number
 *           description: Payment amount
 *         paymentType:
 *           type: string
 *           enum: [client_payment, fleet_owner_payment, advance_payment, expense_reimbursement]
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *           default: pending
 */

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Related entities
    trip: {
      type: mongoose.Schema.ObjectId,
      ref: "Trip",
      required: [true, "Payment must be associated with a trip"],
    },

    // Payment details
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Payment amount must be positive"],
    },

    paymentType: {
      type: String,
      required: [true, "Payment type is required"],
      enum: {
        values: ["client_payment", "fleet_owner_payment", "advance_payment", "expense_reimbursement"],
        message: "Invalid payment type",
      },
    },

    // Parties involved
    paidBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Payer is required"],
    },

    paidTo: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Payee is required"],
    },

    // Payment status and tracking
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },

    // Payment method and details
    paymentMethod: {
      type: String,
     
      required: [true, "Payment method is required"],
    },

    // Bank/Transaction details
    transactionDetails: {
      transactionId: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      chequeNumber: String,
      upiId: String,
      onlineGateway: String,
    },

    // Dates
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: Date,
    completedAt: Date,

    // Additional information
    description: String,
    notes: String,

    // Commission tracking (for fleet owner payments)
    commissionAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Tax details
    taxDetails: {
      gstAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      tdsAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      netAmount: {
        type: Number,
        min: 0,
      },
    },

    // Documents
    documents: {
      receipt: String,
      invoice: String,
      bankSlip: String,
    },

    // System fields
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
paymentSchema.index({ paymentNumber: 1 })
paymentSchema.index({ trip: 1 })
paymentSchema.index({ paidBy: 1 })
paymentSchema.index({ paidTo: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ paymentType: 1 })
paymentSchema.index({ paymentDate: -1 })

// Compound indexes
paymentSchema.index({ status: 1, paymentDate: -1 })
paymentSchema.index({ paymentType: 1, status: 1 })

// Pre-save middleware to generate payment number
paymentSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")

    // Find the last payment number for this month
    const lastPayment = await this.constructor
      .findOne({
        paymentNumber: new RegExp(`^PAY${year}${month}`),
      })
      .sort({ paymentNumber: -1 })

    let sequence = 1
    if (lastPayment) {
      const lastSequence = Number.parseInt(lastPayment.paymentNumber.slice(-4))
      sequence = lastSequence + 1
    }

    this.paymentNumber = `PAY${year}${month}${sequence.toString().padStart(4, "0")}`
  }
  next()
})

// Pre-save middleware to update completion date
paymentSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date()
  }
  next()
})

// Pre-save middleware to calculate net amount
paymentSchema.pre("save", function (next) {
  if (this.taxDetails && (this.taxDetails.gstAmount || this.taxDetails.tdsAmount)) {
    this.taxDetails.netAmount = this.amount - (this.taxDetails.tdsAmount || 0)
  }
  next()
})

// Instance method to mark payment as completed
paymentSchema.methods.markCompleted = function (approvedBy) {
  this.status = "completed"
  this.completedAt = new Date()
  this.approvedBy = approvedBy
  this.approvedAt = new Date()
  return this.save()
}

// Instance method to cancel payment
paymentSchema.methods.cancel = function (reason) {
  this.status = "cancelled"
  this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`
  return this.save()
}

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function (filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        avgAmount: { $avg: "$amount" },
      },
    },
  ])

  return stats
}

// Static method to get outstanding payments
paymentSchema.statics.getOutstandingPayments = async function () {
  const outstanding = await this.aggregate([
    {
      $match: {
        status: "pending",
        dueDate: { $lt: new Date() },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "paidBy",
        foreignField: "_id",
        as: "payer",
      },
    },
    {
      $lookup: {
        from: "trips",
        localField: "trip",
        foreignField: "_id",
        as: "tripInfo",
      },
    },
    {
      $unwind: "$payer",
    },
    {
      $unwind: "$tripInfo",
    },
    {
      $project: {
        paymentNumber: 1,
        amount: 1,
        dueDate: 1,
        paymentType: 1,
        payer: { name: 1, email: 1, phone: 1 },
        trip: { tripNumber: 1 },
        daysPastDue: {
          $divide: [{ $subtract: [new Date(), "$dueDate"] }, 1000 * 60 * 60 * 24],
        },
      },
    },
    {
      $sort: { dueDate: 1 },
    },
  ])

  return outstanding
}

module.exports = mongoose.model("Payment", paymentSchema)
