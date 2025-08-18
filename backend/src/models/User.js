const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");


const driverExpenseSchema = new mongoose.Schema({
  amount: Number,
  reason: String,
  category: String,
  expenseFor: String,
  description: String,
  receiptNumber: String,
  paidAt: Date,
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
});

const driverAdvanceSchema = new mongoose.Schema({
  amount: Number,
  reason: String,
  paymentFor: String,
  recipientName: String,
  description: String,
  referenceNumber: String,
  paidAt: Date,
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "fleet_owner", "client", "driver"],
      required: [true, "Please specify user role"],
    },
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: {
        type: String,
      },
    },
    advanceAmount: {
      type: Number,
      default: 0,
    },

    profileImage: {
      type: String,
      default: null,
    },

    advanceDriver: [driverAdvanceSchema],
    driverExpenseHistory: [driverExpenseSchema],

    // Role-specific fields
    // Fleet Owner specific
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: function () {
        return this.role === "fleet_owner" ? 10 : undefined;
      },
    },
    totalPayArgestment: {
      type: Number,
      default: 0,
    },
    gstNumber: {
      type: String,
      validate: {
        validator: function (v) {
          if (this.role === "fleet_owner" || this.role === "client") {
            return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
              v
            );
          }
          return true;
        },
        message: "Please provide a valid GST number",
      },
    },
    balance: {
      type: Number,
    },
    // Client specific
    creditLimit: {
      type: Number,
      min: 0,
      default: function () {
        return this.role === "client" ? 0 : undefined;
      },
    },
    creditTerms: {
      type: Number, // days
      min: 0,
      default: function () {
        return this.role === "client" ? 30 : undefined;
      },
    },

    // Driver specific
    licenseNumber: {
      type: String,
      validate: {
        validator: function (v) {
          if (this.role === "driver") {
            return v && v.length > 0;
          }
          return true;
        },
        message: "License number is required for drivers",
      },
    },
    licenseExpiry: {
      type: Date,
      validate: {
        validator: function (v) {
          if (this.role === "driver") {
            return v && v > new Date();
          }
          return true;
        },
        message: "Valid license expiry date is required for drivers",
      },
    },
    assignedVehicle: {
      type: mongoose.Schema.ObjectId,
      ref: "Vehicle",
    },

    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
    // Security fields
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Timestamps
    lastLogin: Date,

    advanceRecords: [
      {
        amount: Number,
        paidTo: String,
        purpose: String,
        notes: String,
        tripId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Trip",
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expenseRecords: [
      {
        type: { type: String },
        amount: Number,
        description: String,
        tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
        paidAt: Date,
        paidBy: String,
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },

    fleetAdvances: [
      {
        trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" }, // in User schema only
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        reason: {
          type: String,
        },
        paymentType: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    fleetExpenses: [
      {
        trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
        amount: Number,
        reason: String,
        category: String,
        description: String,
        receiptNumber: String,
        date: { type: Date, default: Date.now },
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
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ active: 1 });

// Virtual populate for vehicles (for fleet owners)
userSchema.virtual("vehicles", {
  ref: "Vehicle",
  foreignField: "owner",
  localField: "_id",
});

// Virtual populate for trips (for clients)
userSchema.virtual("trips", {
  ref: "Trip",
  foreignField: "client",
  localField: "_id",
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async (candidatePassword, userPassword) =>
  await bcrypt.compare(candidatePassword, userPassword);

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Number.parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

module.exports = mongoose.model("User", userSchema);
