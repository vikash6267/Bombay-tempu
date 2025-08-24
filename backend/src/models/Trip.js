const mongoose = require("mongoose");

const selfExpenseSchema = new mongoose.Schema({
  amount: Number,
  reason: String,
  category: String,
  expenseFor: String,
  description: String,
  receiptNumber: String,
  paidAt: Date,
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
});

const selfAdvanceSchema = new mongoose.Schema({
  amount: Number,
  reason: String,
  paymentFor: String,
  recipientName: String,
  description: String,
  referenceNumber: String,
  paidAt: Date,
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
});

const tripSchema = new mongoose.Schema(
  {
    tripNumber: {
      type: String,
      unique: true,
      required: true,
    },
  vehicle: {
      type: mongoose.Schema.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle is required"],
    },
    // Multiple Clients Support
    clients: [
      {
        client: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: [true, "Client is required"],
        },

        podManage: {
          status: {
            type: String,
            enum: [
              "started",
              "complete",
              "pod_received",
              "pod_submitted",
              "settled",
            ],
            default: "started",
          },
          date: { type: Date, default: Date.now },
          documents: [
            {
              url: { type: String },
              fileType: { type: String },
              uploadedAt: { type: Date },
              stepKey: { type: String }, // optional: useful for tracking stage
            },
          ],
        },
        documents: {
          type: [
            {
              url: String,
              fileType: String,
              uploadedAt: Date,
              stepKey: String,
            },
          ],
          default: [],
        },
        loadDetails: {
          description: { type: String, required: true },
          weight: { type: Number },
          quantity: { type: Number, default: 1, min: 1 },
          loadType: {
            type: String,
            enum: ["general", "fragile", "hazardous", "perishable", "liquid"],
            default: "general",
          },
          packagingType: { type: String, default: "boxes" },
          specialInstructions: String,
        },
        rate: { type: Number, required: true, min: 0 },
        paidAmount: { type: Number, default: 0, min: 0 },
        dueAmount: { type: Number, default: 0, min: 0 },
        totalExpense: { type: Number, default: 0, min: 0 },
        totalRate: { type: Number, default: 0, min: 0 },
        commission: { type: Number, default: 0, min: 0 },
        truckHireCost: { type: Number, default: 0, min: 0 },
        invoiceGenerated: { type: Boolean, default: false },
        invoiceNumber: String,
        invoiceDate: Date,
        invoiceDocument: String, // URL
        paymentStatus: {
          type: String,
          enum: ["pending", "partial", "completed"],
          default: "pending",
        },
        argestment: {
          type: Number,
          default: 0,
          min: 0,
        },
        loadNumber: {
          type: String,
          unique: true,
          sparse: true,
        },
        loadDate: { type: Date, default: Date.now },
        // Origin and destination
        origin: {
          city: { type: String, required: true },
          state: String,
          pincode: String,
          coordinates: {
            latitude: Number,
            longitude: Number,
          },
        },
        destination: {
          city: { type: String, required: true },
          state: { type: String, required: true },
          pincode: {
            type: String,
            required: true,
            match: [/^[0-9]{6}$/, "Please provide a valid 6-digit pincode"],
          },
          coordinates: {
            latitude: Number,
            longitude: Number,
          },
        },
        advances: [
          {
            amount: { type: Number, required: true, min: 0 },
            paidBy: {
              type: String,
              enum: ["client", "admin"],
              default: "client",
            },
            pymentMathod: {
              // corrected spelling
              type: String,
              default: "cash",
            },
            paidTo: {
              type: String,
              enum: ["driver", "admin"],
              required: true,
            },
            paidAt: { type: Date, default: Date.now },
            purpose: {
              type: String,
              enum: ["fuel", "toll", "loading", "general", "advances"],
              default: "general",
            },
            notes: String,
          },
        ],
        expenses: [
          {
            type: { type: String, required: true },
            amount: { type: Number, required: true, min: 0 },
            description: String,
            receipt: String, // URL
            paidBy: {
              type: String,
              enum: ["driver", "admin"],
              required: true,
            },
            paidAt: { type: Date, default: Date.now },
          },
        ],

        // *** Yahan se per-client documents & podManage ***
        // documents: {
        //   loadingReceipt: {
        //     url: String,
        //     uploadedAt: Date,
        //     uploadedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
        //   },
        //   deliveryReceipt: {
        //     url: String,
        //     uploadedAt: Date,
        //     uploadedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
        //   },
        //   proofOfDelivery: {
        //     url: String,
        //     uploadedAt: Date,
        //     uploadedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
        //     verifiedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
        //     verifiedAt: Date,
        //     status: {
        //       type: String,
        //       enum: ["pending", "verified", "rejected"],
        //       default: "pending",
        //     },
        //     rejectionReason: String,
        //   },
        //   invoices: [
        //     {
        //       clientId: { type: mongoose.Schema.ObjectId, ref: "User" },
        //       url: String,
        //       invoiceNumber: String,
        //       type: {
        //         type: String,
        //         enum: ["client_invoice", "vehicle_owner_invoice"],
        //       },
        //       uploadedAt: Date,
        //     },
        //   ],
        //   photos: [
        //     {
        //       url: String,
        //       description: String,
        //       uploadedAt: Date,
        //       uploadedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
        //     },
        //   ],
        // },
        podManage: {
          status: {
            type: String,
            enum: [
              "started",
              "complete",
              "pod_received",
              "pod_submitted",
              "settled",
            ],
            default: "started",
          },
          date: { type: Date, default: Date.now },
          document: {
            url: { type: String }, // optional
            fileType: { type: String }, // optional (pdf, jpg, etc.)
            uploadedAt: { type: Date },
          },
        },
        // Status tracking
        status: {
          type: String,
          enum: [
            "booked",
            "in_progress",
            "completed",
            "cancelled",
            "billed",
            "paid",
          ],
          default: "booked",
        },
        // Timeline
        timeline: {
          bookedAt: { type: Date, default: Date.now },
          startedAt: Date,
          completedAt: Date,
          billedAt: Date,
          paidAt: Date,
          cancelledAt: Date,
        },
      },
    ],

    selfExpenses: [selfExpenseSchema],
    selfAdvances: [selfAdvanceSchema],

    // Vehicle and driver assignment
  
    driver: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      // required: [true, "Driver is required"],
    },

    // Vehicle owner (derived from vehicle ownership)
    vehicleOwner: {
      ownershipType: {
        type: String,
        enum: ["self", "fleet_owner"],
        required: true,
      },
      ownerId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      ownerDetails: mongoose.Schema.Types.Mixed, // Flexible structure for owner details
      commissionRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },

    // Scheduling
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    estimatedDuration: {
      type: Number, // in hours
      min: 1,
    },
    estimatedDistance: {
      type: Number, // in kilometers
      min: 1,
    },

    // Status tracking
    status: {
      type: String,

      default: "booked",
    },

    podManage: {
      status: {
        type: String,
        enum: [
          "started",
          "complete",
          "pod_received",
          "pod_submitted",
          "settled",
        ],
        default: "started",
      },
      date: {
        type: Date,
        default: Date.now,
      },
      document: {
        url: { type: String }, // optional
        fileType: { type: String }, // optional (e.g., "pdf", "jpg")
        uploadedAt: { type: Date }, // optional
      },
    },
    // Timeline
    timeline: {
      bookedAt: {
        type: Date,
        default: Date.now,
      },
      startedAt: Date,
      completedAt: Date,
      billedAt: Date,
      paidAt: Date,
      cancelledAt: Date,
    },

    // Financial calculations (derived from clients)
    totalClientAmount: {
      type: Number,
      default: 0,
    },
    vehicleOwnerAmount: {
      type: Number,
      default: 0,
    },
    totalCommission: {
      type: Number,
      default: 0,
    },
    rate: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    podBalance: {
      type: Number,
      default: 0,
    },
    podBalanceTotalPaid: {
      type: Number,
      default: 0,
    },

    podDetails: {
      date: {
        type: Date,
        default: () => new Date(), // fix `new date()` to proper syntax
      },
      paymentType: {
        type: String,
      },
      podGive: {
        type: Number,
      },
      notes: {
        type: String,
        default: "",
      },
    },
    // Advance payments
    advances: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        paidBy: {
          type: String,
          enum: ["client", "admin"],
          required: true,
        },
        paidTo: {
          type: String,
          enum: ["driver", "vehicle_owner"],
          required: true,
        },
        paidAt: {
          type: Date,
          default: Date.now,
        },
        purpose: {
          type: String,
          enum: ["fuel", "toll", "loading", "general"],
          default: "general",
        },
        notes: String,
      },
    ],

    // Expenses
    expenses: [
      {
        type: {
          type: String,
          enum: [
            "fuel",
            "toll",
            "loading",
            "unloading",
            "parking",
            "food",
            "maintenance",
            "other",
          ],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        description: String,
        receipt: String, // URL to receipt image
        paidBy: {
          type: String,
          enum: ["driver", "vehicle_owner", "admin"],
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Enhanced Documents with POD
    documents: {
      loadingReceipt: {
        url: String,
        uploadedAt: Date,
        uploadedBy: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
      },
      deliveryReceipt: {
        url: String,
        uploadedAt: Date,
        uploadedBy: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
      },
      // Proof of Delivery (POD) - Critical for trip completion
      proofOfDelivery: {
        url: String,
        uploadedAt: Date,
        uploadedBy: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        verifiedBy: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        verifiedAt: Date,
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        rejectionReason: String,
      },
      invoices: [
        {
          clientId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
          },
          url: String,
          invoiceNumber: String,
          type: {
            type: String,
            enum: ["client_invoice", "vehicle_owner_invoice"],
          },
          uploadedAt: Date,
        },
      ],
      photos: [
        {
          url: String,
          description: String,
          uploadedAt: Date,
          uploadedBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
          },
        },
      ],
    },

    // Performance metrics
    actualDistance: Number,
    actualDuration: Number, // in hours
    fuelConsumed: Number, // in liters

    // Additional information
    specialInstructions: String,

    // System fields
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    // Inside tripSchema

    totalFleetAdvance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalFleetExpense: {
      type: Number,
      default: 0,
      min: 0,
    },

    fleetAdvances: [
      {
        amount: {
          type: Number,
          required: true,
          min: 1,
        },
        reason: {
          type: String,
          required: true,
        },
        paymentType: {
          type: String,

          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    fleetExpenses: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        reason: {
          type: String,
        },
        category: {
          type: String,

          default: "fuel",
        },
        description: String,
        receiptNumber: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
tripSchema.index({ tripNumber: 1 });
tripSchema.index({ "clients.client": 1 });
tripSchema.index({ vehicle: 1 });
tripSchema.index({ driver: 1 });
tripSchema.index({ "vehicleOwner.ownerId": 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ scheduledDate: 1 });
tripSchema.index({ createdAt: -1 });

// Compound indexes
tripSchema.index({ status: 1, scheduledDate: 1 });
tripSchema.index({ "vehicleOwner.ownerId": 1, status: 1 });

// Virtual for total advance amount
tripSchema.virtual("totalAdvance").get(function () {
  return this.expenses
    ? this.advances.reduce((total, advance) => total + advance.amount, 0)
    : 0;
});

// Virtual for total expenses
tripSchema.virtual("totalExpenses").get(function () {
  return this.expenses
    ? this.expenses.reduce((total, expense) => total + expense.amount, 0)
    : 0;
});

// Virtual for balance amount (total client amount - advance)
tripSchema.virtual("balanceAmount").get(function () {
  return this.totalClientAmount - this.totalAdvance;
});

// Virtual for net profit
tripSchema.virtual("netProfit").get(function () {
  return this.totalCommission - this.totalExpenses;
});

// Virtual for total load weight
tripSchema.virtual("totalWeight").get(function () {
  return this.clients
    ? this.clients.reduce(
        (total, client) => total + client.loadDetails.weight,
        0
      )
    : 0;
});

// Pre-save middleware to generate trip number
tripSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    // Find the last trip number for this month
    const lastTrip = await this.constructor
      .findOne({
        tripNumber: new RegExp(`^TRP${year}${month}`),
      })
      .sort({ tripNumber: -1 });

    let sequence = 1;
    if (lastTrip) {
      const lastSequence = Number.parseInt(lastTrip.tripNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    this.tripNumber = `TRP${year}${month}${sequence.toString().padStart(4, "0")}`;
  }
  next();
});
tripSchema.pre("save", function (next) {
  this.clients.map((item) => {
    item.dueAmount = item.rate - item.paidAmount;
  });
  next();
});
// Pre-save middleware to calculate financial totals
tripSchema.pre("save", function (next) {
  // Calculate total client amount
  this.totalClientAmount = this.clients.reduce(
    (total, client) => total + client.rate,
    0
  );

  // Calculate vehicle owner amount and commission based on ownership type
  if (this.vehicleOwner.ownershipType === "self") {
    // For self-owned vehicles, admin gets the full amount minus expenses
    this.vehicleOwnerAmount = this.totalClientAmount;
    this.totalCommission = 0;
  } else {
    // For fleet owner vehicles, calculate commission
    const commissionAmount =
      (this.totalClientAmount * this.vehicleOwner.commissionRate) / 100;
    this.vehicleOwnerAmount = this.totalClientAmount - commissionAmount;
    this.totalCommission = commissionAmount;
  }

  next();
});

// Pre-save middleware to update timeline
tripSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const now = new Date();

    switch (this.status) {
      case "in_progress":
        if (!this.timeline.startedAt) {
          this.timeline.startedAt = now;
        }
        break;
      case "completed":
        if (!this.timeline.completedAt) {
          this.timeline.completedAt = now;
        }
        break;
      case "billed":
        if (!this.timeline.billedAt) {
          this.timeline.billedAt = now;
        }
        break;
      case "paid":
        if (!this.timeline.paidAt) {
          this.timeline.paidAt = now;
        }
        break;
      case "cancelled":
        if (!this.timeline.cancelledAt) {
          this.timeline.cancelledAt = now;
        }
        break;
    }
  }
  next();
});

// Instance method to add advance payment
tripSchema.methods.addAdvance = function (advanceData, index) {
  if (!this.clients[index]) throw new Error("Client not found");

  const client = this.clients[index];
  client.paidAmount += advanceData.amount;
  client.dueAmount = client.totalRate - client.paidAmount;
  client.advances.push(advanceData);

  return this.save();
};

tripSchema.methods.addExpense = function (expenseData, index) {
  if (!this.clients[index]) throw new Error("Client not found");

  const client = this.clients[index];

  // Ensure expenses array exists
  if (!client.expenses) {
    client.expenses = [];
  }

  client.expenses.push(expenseData);
  client.dueAmount += expenseData.amount;

  return this.save(); // Save the updated trip (including client.dueAmount)
};

// Instance method to update status
tripSchema.methods.updateStatus = function (newStatus, updatedBy) {
  this.status = newStatus;
  this.lastUpdatedBy = updatedBy;
  return this.save();
};

// Instance method to upload POD
tripSchema.methods.uploadPOD = function (podData, uploadedBy) {
  this.documents.proofOfDelivery = {
    url: podData.url,
    uploadedAt: new Date(),
    uploadedBy: uploadedBy,
    status: "pending",
  };
  return this.save();
};

// Instance method to verify POD and complete trip
tripSchema.methods.verifyPODAndComplete = function (verifiedBy) {
  if (!this.documents.proofOfDelivery || !this.documents.proofOfDelivery.url) {
    throw new Error("POD document is required to complete the trip");
  }

  this.documents.proofOfDelivery.status = "verified";
  this.documents.proofOfDelivery.verifiedBy = verifiedBy;
  this.documents.proofOfDelivery.verifiedAt = new Date();
  this.status = "completed";
  this.lastUpdatedBy = verifiedBy;

  return this.save();
};

// Instance method to generate invoices for all clients
tripSchema.methods.generateClientInvoices = async function () {
  const invoices = [];

  for (let i = 0; i < this.clients.length; i++) {
    const client = this.clients[i];

    if (!client.invoiceGenerated) {
      const invoiceNumber = `INV-${this.tripNumber}-${i + 1}`;

      // Update client invoice details
      client.invoiceGenerated = true;
      client.invoiceNumber = invoiceNumber;
      client.invoiceDate = new Date();

      invoices.push({
        clientId: client.client,
        invoiceNumber: invoiceNumber,
        amount: client.rate,
        loadDetails: client.loadDetails,
      });
    }
  }

  await this.save();
  return invoices;
};

// Static method to get trip statistics
tripSchema.statics.getTripStats = async function (filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$totalClientAmount" },
        totalCommission: { $sum: "$totalCommission" },
      },
    },
  ]);

  return stats;
};

module.exports = mongoose.model("Trip", tripSchema);
