const Trip = require("../models/Trip");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { CounterService } = require("../models/Counter");

// ==================== COLLECTION MEMOS ====================

// Create Collection Memo
exports.createCollectionMemo = catchAsync(async (req, res, next) => {
  const { tripId } = req.params;
  const { clientId, amount, collectionDate, paymentMode, remarks } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError("Trip not found", 404));
  }

  // Generate memo number
  const { number: memoNumber } = await CounterService.getNext("collectionMemo", {
    prefix: "CM",
    padLength: 6,
  });

  const newMemo = {
    memoNumber,
    clientId,
    amount,
    collectionDate: collectionDate || new Date(),
    paymentMode: paymentMode || "cash",
    remarks,
    createdBy: req.user.id,
    createdAt: new Date(),
  };

  trip.collectionMemos.push(newMemo);
  await trip.save();

  await trip.populate([
    { path: "collectionMemos.clientId", select: "name email phone" },
    { path: "collectionMemos.createdBy", select: "name email" },
  ]);

  res.status(201).json({
    status: "success",
    data: {
      memo: trip.collectionMemos[trip.collectionMemos.length - 1],
    },
  });
});

// Get All Collection Memos
exports.getAllCollectionMemos = catchAsync(async (req, res, next) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId)
    .populate("collectionMemos.clientId", "name email phone")
    .populate("collectionMemos.createdBy", "name email");

  if (!trip) {
    return next(new AppError("Trip not found", 404));
  }

  res.status(200).json({
    status: "success",
    results: trip.collectionMemos.length,
    data: {
      memos: trip.collectionMemos,
    },
  });
});

// Update Collection Memo
exports.updateCollectionMemo = catchAsync(async (req, res, next) => {
  const { tripId, memoId } = req.params;
  const { amount, collectionDate, paymentMode, remarks } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError("Trip not found", 404));
  }

  const memo = trip.collectionMemos.id(memoId);
  if (!memo) {
    return next(new AppError("Memo not found", 404));
  }

  // Update fields
  if (amount !== undefined) memo.amount = amount;
  if (collectionDate) memo.collectionDate = collectionDate;
  if (paymentMode) memo.paymentMode = paymentMode;
  if (remarks !== undefined) memo.remarks = remarks;
  memo.updatedAt = new Date();

  await trip.save();

  await trip.populate([
    { path: "collectionMemos.clientId", select: "name email phone" },
    { path: "collectionMemos.createdBy", select: "name email" },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      memo: trip.collectionMemos.id(memoId),
    },
  });
});

// Delete Collection Memo
exports.deleteCollectionMemo = catchAsync(async (req, res, next) => {
  const { tripId, memoId } = req.params;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError("Trip not found", 404));
  }

  const memo = trip.collectionMemos.id(memoId);
  if (!memo) {
    return next(new AppError("Memo not found", 404));
  }

  memo.remove();
  await trip.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ==================== BALANCE MEMOS ====================

// Create Balance Memo
exports.createBalanceMemo = catchAsync(async (req, res, next) => {
  const { tripId } = req.params;
  const { clientId, balanceAmount, dueDate, remarks } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError("Trip not found", 404));
  }

  // Generate memo number
  const { number: memoNumber } = await CounterService.getNext("balanceMemo", {
    prefix: "BM",
    padLength: 6,
  });

  const newMemo = {
    memoNumber,
    clientId,
    balanceAmount,
    dueDate,
    remarks,
    createdBy: req.user.id,
    createdAt: new Date(),
  };

  trip.balanceMemos.push(newMemo);
  await trip.save();

  await trip.populate([
    { path: "balanceMemos.clientId", select: "name email phone" },
    { path: "balanceMemos.createdBy", select: "name email" },
  ]);

  res.status(201).json({
    status: "success",
    data: {
      memo: trip.balanceMemos[trip.balanceMemos.length - 1],
    },
  });
});

// Get All Balance Memos
exports.getAllBalanceMemos = catchAsync(async (req, res, next) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId)
    .populate("balanceMemos.clientId", "name email phone")
    .populate("balanceMemos.createdBy", "name email");

  if (!trip) {
    return next(new AppError("Trip not found", 404));
  }

  res.status(200).json({
    status: "success",
    results: trip.balanceMemos.length,
    data: {
      memos: trip.balanceMemos,
    },
  });
});

// Update Balance Memo
exports.updateBalanceMemo = catchAsync(async (req, res, next) => {
  const { tripId, memoId } = req.params;
  const { balanceAmount, dueDate, remarks } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError("Trip not found", 404));
  }

  const memo = trip.balanceMemos.id(memoId);
  if (!memo) {
    return next(new AppError("Memo not found", 404));
  }

  // Update fields
  if (balanceAmount !== undefined) memo.balanceAmount = balanceAmount;
  if (dueDate) memo.dueDate = dueDate;
  if (remarks !== undefined) memo.remarks = remarks;
  memo.updatedAt = new Date();

  await trip.save();

  await trip.populate([
    { path: "balanceMemos.clientId", select: "name email phone" },
    { path: "balanceMemos.createdBy", select: "name email" },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      memo: trip.balanceMemos.id(memoId),
    },
  });
});

// Delete Balance Memo
exports.deleteBalanceMemo = catchAsync(async (req, res, next) => {
  const { tripId, memoId } = req.params;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError("Trip not found", 404));
  }

  const memo = trip.balanceMemos.id(memoId);
  if (!memo) {
    return next(new AppError("Memo not found", 404));
  }

  memo.remove();
  await trip.save();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
