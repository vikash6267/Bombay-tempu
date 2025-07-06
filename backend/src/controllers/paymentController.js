const Payment = require("../models/Payment");
const Trip = require("../models/Trip");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const cloudinary = require("../utils/cloudinary");
const { CounterService } = require("../models/Counter");

const getAllPayments = catchAsync(async (req, res, next) => {
  const filter = {};

  // Apply role-based filtering
  switch (req.user.role) {
    case "client":
      filter.$or = [{paidBy: req.user.id}, {paidTo: req.user.id}];
      break;
    case "fleet_owner":
      filter.$or = [{paidBy: req.user.id}, {paidTo: req.user.id}];
      break;
    case "driver":
      filter.$or = [{paidBy: req.user.id}, {paidTo: req.user.id}];
      break;
    // admin can see all payments
  }

  const features = new APIFeatures(Payment.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const payments = await features.query
    .populate("trip", "tripNumber origin destination")
    .populate("paidBy", "name email phone")
    .populate("paidTo", "name email phone")
    .populate("createdBy", "name email")
    .populate("approvedBy", "name email");

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});

const getPayment = catchAsync(async (req, res, next) => {
  const filter = {_id: req.params.id};

  // Apply role-based filtering
  if (req.user.role !== "admin") {
    filter.$or = [{paidBy: req.user.id}, {paidTo: req.user.id}];
  }

  const payment = await Payment.findOne(filter)
    .populate("trip", "tripNumber origin destination pricing")
    .populate("paidBy", "name email phone address")
    .populate("paidTo", "name email phone address")
    .populate("createdBy", "name email")
    .populate("approvedBy", "name email");

  if (!payment) {
    return next(new AppError("No payment found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

const createPayment = catchAsync(async (req, res, next) => {
  const {
    trip,
    amount,
    paymentType,
    paidBy,
    paidTo,
     paymentMethod,
    dueDate,
    description,
  } = req.body;
 const {number: paymentNumber} = await CounterService.getNext("pay");
  // Validate trip exists
  const tripDoc = await Trip.findById(trip);
  if (!tripDoc) {
    return next(new AppError("Invalid trip specified", 400));
  }

  // Validate users exist
  const [payerUser, payeeUser] = await Promise.all([
    User.findById(paidBy),
    User.findById(paidTo),
  ]);

  if (!payerUser) {
    return next(new AppError("Invalid payer specified", 400));
  }

  if (!payeeUser) {
    return next(new AppError("Invalid payee specified", 400));
  }

  // Validate payment type and parties
  const validPaymentTypes = {
    client_payment: {payer: "client", payee: "admin"},
    fleet_owner_payment: {payer: "admin", payee: "fleet_owner"},
    advance_payment: {payer: "admin", payee: ["driver", "fleet_owner"]},
    expense_reimbursement: {payer: "admin", payee: ["driver", "fleet_owner"]},
  };

  const typeConfig = validPaymentTypes[paymentType];
  if (!typeConfig) {
    return next(new AppError("Invalid payment type", 400));
  }

  // Additional validation based on payment type
  if (paymentType === "client_payment") {
    if (tripDoc.client.toString() !== paidBy) {
      return next(
        new AppError("Payer must be the trip client for client payments", 400)
      );
    }
  }

  if (paymentType === "fleet_owner_payment") {
    if (tripDoc.fleetOwner.toString() !== paidTo) {
      return next(
        new AppError(
          "Payee must be the trip fleet owner for fleet owner payments",
          400
        )
      );
    }
    // Calculate commission for fleet owner payments
    req.body.commissionAmount = tripDoc.pricing.commission;
  }

  req.body.createdBy = req.user.id;

  const payment = await Payment.create({paymentNumber,...req.body});

  // Populate the created payment
  await payment.populate([
    {path: "trip", select: "tripNumber origin destination"},
    {path: "paidBy", select: "name email phone"},
    {path: "paidTo", select: "name email phone"},
  ]);

  res.status(201).json({
    status: "success",
    data: {
      payment,
    },
  });
});

const updatePayment = catchAsync(async (req, res, next) => {
  // Don't allow changing critical fields
  delete req.body.paymentNumber;
  delete req.body.trip;
  delete req.body.amount;
  delete req.body.type;
  delete req.body.paidBy;
  delete req.body.paidTo;

  const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    {path: "trip", select: "tripNumber origin destination"},
    {path: "paidBy", select: "name email phone"},
    {path: "paidTo", select: "name email phone"},
  ]);

  if (!payment) {
    return next(new AppError("No payment found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

const approvePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new AppError("No payment found with that ID", 404));
  }

  if (payment.status !== "pending") {
    return next(new AppError("Only pending payments can be approved", 400));
  }

  await payment.markCompleted(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      payment,
      message: "Payment approved successfully",
    },
  });
});

const cancelPayment = catchAsync(async (req, res, next) => {
  const {reason} = req.body;

  if (!reason) {
    return next(new AppError("Cancellation reason is required", 400));
  }

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new AppError("No payment found with that ID", 404));
  }

  if (payment.status === "completed") {
    return next(new AppError("Cannot cancel completed payments", 400));
  }

  await payment.cancel(reason);

  res.status(200).json({
    status: "success",
    data: {
      payment,
      message: "Payment cancelled successfully",
    },
  });
});

const uploadDocument = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a file", 400));
  }

  const {documentType} = req.body;
  if (
    !documentType ||
    !["receipt", "invoice", "bank_slip"].includes(documentType)
  ) {
    return next(new AppError("Please specify valid document type", 400));
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return next(new AppError("No payment found with that ID", 404));
  }

  // Check permission
  if (req.user.role !== "admin" && payment.paidBy.toString() !== req.user.id) {
    return next(
      new AppError("You can only upload documents for your own payments", 403)
    );
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: `payments/${payment._id}/documents`,
    resource_type: "auto",
  });

  // Update payment document
  const updateData = {};
  updateData[`documents.${documentType}`] = result.secure_url;

  const updatedPayment = await Payment.findByIdAndUpdate(
    payment._id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      payment: updatedPayment,
      documentUrl: result.secure_url,
    },
  });
});

const deletePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new AppError("No payment found with that ID", 404));
  }

  // Only allow deletion of pending payments
  if (payment.status !== "pending") {
    return next(new AppError("Cannot delete non-pending payments", 400));
  }

  await Payment.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

const getMyPayments = catchAsync(async (req, res, next) => {
  const filter = {
    $or: [{paidBy: req.user.id}, {paidTo: req.user.id}],
  };

  const features = new APIFeatures(Payment.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const payments = await features.query
    .populate("trip", "tripNumber origin destination")
    .populate("paidBy", "name email phone")
    .populate("paidTo", "name email phone");

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});

const getPaymentStats = catchAsync(async (req, res, next) => {
  const stats = await Payment.getPaymentStats();

  // Get monthly payment stats for current year
  const currentYear = new Date().getFullYear();
  const monthlyStats = await Payment.aggregate([
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
        _id: {
          month: {$month: "$createdAt"},
          paymentType: "$paymentType",
        },
        count: {$sum: 1},
        totalAmount: {$sum: "$amount"},
      },
    },
    {
      $sort: {"_id.month": 1},
    },
  ]);

  // Get payment method distribution
  const paymentMethodStats = await Payment.aggregate([
    {
      $group: {
        _id: "$paymentMethod",
        count: {$sum: 1},
        totalAmount: {$sum: "$amount"},
      },
    },
    {
      $sort: {count: -1},
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      statusStats: stats,
      monthlyStats,
      paymentMethodStats,
    },
  });
});

const getOutstandingPayments = catchAsync(async (req, res, next) => {
  const outstanding = await Payment.getOutstandingPayments();

  res.status(200).json({
    status: "success",
    results: outstanding.length,
    data: {
      outstandingPayments: outstanding,
    },
  });
});

module.exports = {
  getAllPayments,
  getPayment,
  createPayment,
  updatePayment,
  approvePayment,
  cancelPayment,
  uploadDocument,
  deletePayment,
  getMyPayments,
  getPaymentStats,
  getOutstandingPayments,
};
