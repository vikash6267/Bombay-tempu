const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const cloudinary = require("../utils/cloudinary");

const getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

const createUser = catchAsync(async (req, res, next) => {
  extstingUser = await User.findOne({email: req.body.email});
  if (extstingUser) {
    return next(new AppError("User already exists", 400));
  }

  const user = await User.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      user,
    },
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  delete req.body.password;

  const updateData = {
    name: req.body.name,
    phone: req.body.phone,
    address: req.body.address,
  };

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
});


const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

const updateProfile = catchAsync(async (req, res, next) => {
  // Don't allow updating sensitive fields
  delete req.body.password;
  delete req.body.role;
  delete req.body.active;
  delete req.body.emailVerified;

  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

const uploadProfilePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a photo", 400));
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: `users/${req.user.id}/profile`,
    width: 300,
    height: 300,
    crop: "fill",
    gravity: "face",
  });

  // Update user profile image
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {profileImage: result.secure_url},
    {new: true, runValidators: true}
  );

  res.status(200).json({
    status: "success",
    data: {
      user,
      imageUrl: result.secure_url,
    },
  });
});

const activateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {active: true},
    {new: true, runValidators: true}
  );

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
      message: "User activated successfully",
    },
  });
});

const deactivateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {active: false},
    {new: true, runValidators: true}
  );

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
      message: "User deactivated successfully",
    },
  });
});

const getStats = catchAsync(async (req, res, next) => {
  const users = await User.find();

  let stats = {
    total: users.length,
    active: users.filter((user) => user.active).length,
    inactive: users.filter((user) => !user.active).length,
    drivers: users.filter((user) => user.role === "driver").length,
    fleetOwners: users.filter((user) => user.role === "fleet_owner").length,
    clients: users.filter((user) => user.role === "client").length,
    admins: users.filter((user) => user.role === "admin").length,
  };

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  activateUser,
  deactivateUser,
  getStats,
};
