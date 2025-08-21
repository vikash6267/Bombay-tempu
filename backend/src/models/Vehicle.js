const mongoose = require("mongoose");
const vehicleExpenseSchema = new mongoose.Schema({
  amount: Number,
  reason: String,
  category: String,
  expenseFor: String,
  description: String,
  receiptNumber: String,
  paidAt: Date,
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
});

const vehicleAdvanceSchema = new mongoose.Schema({
  amount: Number,
  reason: String,
  paymentFor: String,
  recipientName: String,
  description: String,
  referenceNumber: String,
  paidAt: Date,
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
});

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
        "Please provide a valid registration number",
      ],
    },

    description: String,

    vehicleType: {
      type: String,
      required: [true, "Vehicle type is required"],
      enum: {
        values: [
          "truck",
          "tempo",
          "mini_truck",
          "trailer",
          "open_body",
          "container",
          "closed_container",
          "tipper",
          "tanker",
          "other",
        ],
        message:
          "Vehicle type must be one of: truck, tempo, mini_truck, trailer, container",
      },
    },
    capacity: {
      type: Number,
      required: [true, "Vehicle capacity is required"],
      min: [0.5, "Capacity must be at least 0.5 tons"],
      max: [50, "Capacity cannot exceed 50 tons"],
    },
    currentKilometers: {
      type: Number,
      default: 0,
      min: 0,
      description: "Current odometer reading of the vehicle",
    },
    nextServiceAtKm: {
      type: Number,
      default: 0, // default 10,000 km interval
      min: 0,
      description: "Next servicing required at this km reading",
    },
    // Enhanced Ownership Structure
    ownershipType: {
      type: String,
      required: [true, "Ownership type is required"],
      enum: {
        values: ["self", "fleet_owner"],
        message: "Ownership type must be either 'self' or 'fleet_owner'",
      },
    },

    vehicleExpenseHistoryMain: [
      {
        amount: Number,
        reason: String,
        category: String,
        expenseFor: String,
        description: String,
        receiptNumber: String,
        paidAt: Date,
      },
    ],

    vehicleAdvances: [vehicleAdvanceSchema],
    vehicleExpenseHistory: [vehicleExpenseSchema],

    // Owner details - only required for fleet_owner type
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: function () {
        return this.ownershipType === "fleet_owner";
      },
      validate: {
        validator: async function (v) {
          if (this.ownershipType === "self") {
            return true; // No owner required for self-owned vehicles
          }
          if (!v) return false;

          const user = await mongoose.model("User").findById(v);
          return user && user.role === "fleet_owner";
        },
        message:
          "Owner must be a valid fleet owner when ownership type is 'fleet_owner'",
      },
    },

    // Owner details for self-owned vehicles (admin details)
    selfOwnerDetails: {
      adminId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: function () {
          return this.ownershipType === "self";
        },
      },
      name: {
        type: String,
        function() {
          return this.ownershipType === "self";
        },
      },
      email: String,
      phone: String,
    },

    // Commission rate for fleet owners (not applicable for self-owned)
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // validate: {
      //   validator: function (v) {
      //     if (this.ownershipType === "self") {
      //       return v === undefined || v === null // No commission for self-owned
      //     }
      //     return v !== undefined && v !== null && v >= 0 && v <= 100
      //   },
      //   message: "Commission rate is required for fleet owner vehicles and must be between 0-100%",
      // },
    },

    // Status and availability
    status: {
      type: String,
      enum: ["available", "booked", "maintenance", "inactive"],
      default: "available",
    },
    currentLocation: {
      type: String,
      trim: true,
    },

    // Documents
    documents: {
      registrationCertificate: {
        url: String,
        expiryDate: Date,
      },
      insurance: {
        url: String,
        policyNumber: String,
        expiryDate: {
          type: Date,
          // required: [true, "Insurance expiry date is required"],
        },
        provider: String,
      },
      fitnessCertificate: {
        url: String,
        expiryDate: {
          type: Date,
          // required: [true, "Fitness certificate expiry date is required"],
        },
      },
      permit: {
        url: String,
        permitType: {
          type: String,
          enum: ["state", "national", "temporary"],
        },
        expiryDate: Date,
      },
      pollution: {
        url: String,
        expiryDate: Date,
      },
    },

    loanDetails: {
      hasLoan: { type: Boolean, default: false },
      loanAmount: { type: Number, default: null },
      emiAmount: { type: Number, default: null },
      loanTenure: { type: Number, default: null },
      loanProvider: { type: String, default: "" },
      loanStartDate: { type: Date, default: null },
    },
    papers: {
      engineNo: { type: String, default: "" },
      chassisNo: { type: String, default: "" },
      modelName: { type: String, default: "" },
      registrationDate: { type: Date, default: null },
      fitnessDate: { type: Date, default: null },
      taxDate: { type: Date, default: null },
      insuranceDate: { type: Date, default: null },
      puccDate: { type: Date, default: null },
      permitDate: { type: Date, default: null },
      nationalPermitDate: { type: Date, default: null },
    },
    // Financial tracking
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Maintenance
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Performance metrics
    totalTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalKilometers: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageFuelConsumption: {
      type: Number, // km per liter
      min: 0,
    },

    // Additional details
    // fuelType: {
    //   type: String,
    //   enum: ["petrol", "diesel", "cng", "electric"],
    //   default: "diesel",
    // },
    color: String,
    chassisNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    engineNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
vehicleSchema.index({ registrationNumber: 1 });
vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ ownershipType: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ vehicleType: 1 });
vehicleSchema.index({ "loanDetails.hasLoan": 1 });
vehicleSchema.index({ "loanDetails.loanStatus": 1 });

// Virtual for getting the actual owner (either fleet owner or admin)
vehicleSchema.virtual("actualOwner").get(function () {
  if (this.ownershipType === "self") {
    return {
      _id: this.selfOwnerDetails?.adminId,
      name: this.selfOwnerDetails?.ownerName,
      type: "admin",
      contactNumber: this.selfOwnerDetails?.contactNumber,
      address: this.selfOwnerDetails?.address,
    };
  } else {
    return this.owner;
  }
});

// Virtual for current driver
vehicleSchema.virtual("currentDriver", {
  ref: "User",
  localField: "_id",
  foreignField: "assignedVehicle",
  justOne: true,
});

// Virtual for active trips
vehicleSchema.virtual("activeTrips", {
  ref: "Trip",
  localField: "_id",
  foreignField: "vehicle",
  match: { status: { $in: ["booked", "in_progress"] } },
});

// Virtual for maintenance records
vehicleSchema.virtual("maintenanceRecords", {
  ref: "Maintenance",
  localField: "_id",
  foreignField: "vehicle",
});

// Pre-save middleware to set admin details for self-owned vehicles
vehicleSchema.pre("save", async function (next) {
  if (this.ownershipType === "self" && this.isNew) {
    // Get admin user details
    const adminUser = await mongoose.model("User").findOne({ role: "admin" });
    if (adminUser) {
      this.selfOwnerDetails = {
        adminId: adminUser._id,
        ownerName: adminUser.name,
        contactNumber: adminUser.phone,
        address: adminUser.address,
      };
    }
  }

  // Calculate next EMI due date for vehicles with loans
  if (this.loanDetails.hasLoan && this.loanDetails.emiDueDate) {
    const today = new Date();
    const nextEMI = new Date(
      today.getFullYear(),
      today.getMonth(),
      this.loanDetails.emiDueDate
    );

    // If EMI date has passed this month, set for next month
    if (nextEMI <= today) {
      nextEMI.setMonth(nextEMI.getMonth() + 1);
    }

    this.nextEMIDate = nextEMI;
  }
  next();
});

// Instance method to check if documents are expiring soon
vehicleSchema.methods.getExpiringDocuments = function (days = 30) {
  const expiringDocs = [];
  const checkDate = new Date();
  checkDate.setDate(checkDate.getDate() + days);

  const docs = this.documents;

  if (docs.insurance.expiryDate && docs.insurance.expiryDate <= checkDate) {
    expiringDocs.push({
      type: "insurance",
      expiryDate: docs.insurance.expiryDate,
    });
  }

  if (
    docs.fitnessCertificate.expiryDate &&
    docs.fitnessCertificate.expiryDate <= checkDate
  ) {
    expiringDocs.push({
      type: "fitness",
      expiryDate: docs.fitnessCertificate.expiryDate,
    });
  }

  if (docs.permit.expiryDate && docs.permit.expiryDate <= checkDate) {
    expiringDocs.push({ type: "permit", expiryDate: docs.permit.expiryDate });
  }

  if (docs.pollution.expiryDate && docs.pollution.expiryDate <= checkDate) {
    expiringDocs.push({
      type: "pollution",
      expiryDate: docs.pollution.expiryDate,
    });
  }

  return expiringDocs;
};

// Instance method to check EMI due
vehicleSchema.methods.isEMIDue = function () {
  if (!this.loanDetails.hasLoan || this.loanDetails.loanStatus !== "active") {
    return false;
  }

  const today = new Date();
  const emiDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    this.loanDetails.emiDueDate
  );

  return today >= emiDate;
};

// Instance method to get owner details
vehicleSchema.methods.getOwnerDetails = function () {
  if (this.ownershipType === "self") {
    return {
      type: "self",
      details: this.selfOwnerDetails,
      commissionRate: 0, // No commission for self-owned vehicles
    };
  } else {
    return {
      type: "fleet_owner",
      details: this.owner,
      commissionRate: this.commissionRate,
    };
  }
};

module.exports = mongoose.model("Vehicle", vehicleSchema);
