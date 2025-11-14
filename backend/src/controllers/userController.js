const User = require("../models/User");
const Trip = require("../models/Trip");
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

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const usersWithPending = await Promise.all(
    users.map(async (user) => {
      if (user.role === "fleet_owner") {
        // Fleet owner: unchanged logic
        const trips = await Trip.find({ "vehicleOwner.ownerId": user._id });

        let totalPendingAmount = 0;
        let totalPodPending = 0;

        trips.forEach((trip) => {
          const podPending = toNum(trip.podBalance) - toNum(trip.podBalanceTotalPaid);
          const pendingAmount = toNum(trip.rate) - toNum(trip.totalFleetAdvance);
          totalPendingAmount += pendingAmount - toNum(trip.commission)  ;
          totalPodPending += podPending;
        });

        return {
          ...user.toObject(),
          totalPendingAmount: Number(totalPendingAmount.toFixed(2)),
          totalPodPending: Number(totalPodPending.toFixed(2)),
        };
      }

      if (user.role === "client") {
        // Client: compute 70% metrics dynamically
        const trips = await Trip.find({ "clients.client": user._id });

        let totalTrips = 0;
        let totalPaidAll = 0;
        let totalPendingAll = 0;

        // below-70 accumulators
        let below70_totalTrips = 0;
        let below70_totalPaid = 0;   // paid for those trips
        let below70_totalAmount = 0; // sum of totalRate for those trips
        let below70_seventySum = 0;  // sum of 70% of each trip

        for (const trip of trips) {
          const clientData = trip.clients.find((c) => {
            if (!c) return false;
            const cid = c.client && (c.client._id ? c.client._id.toString() : c.client.toString());
            return cid === user._id.toString();
          });

          if (!clientData) continue;

          totalTrips += 1;

          const totalRate = toNum(clientData.totalRate);
          const paidAmount = toNum(clientData.paidAmount);
          const pending = Math.max(totalRate - paidAmount, 0);

          totalPaidAll += paidAmount;
          totalPendingAll += pending;

          const percentagePaid = totalRate ? (paidAmount / totalRate) * 100 : 0;

          if (percentagePaid < 70) {
            below70_totalTrips += 1;
            below70_totalPaid += paidAmount;
            below70_totalAmount += totalRate;
            below70_seventySum += totalRate * 0.7;
          }
        }

        // remaining needed to reach 70% across below-70 trips
        const pendingToReach70 = Math.max(below70_seventySum - below70_totalPaid, 0);

        return {
          ...user.toObject(),
          totalTrips,
          totalPaidAll: Number(totalPaidAll.toFixed(2)),
          totalPendingAll: Number(totalPendingAll.toFixed(2)),

          // EXACT fields you asked for:
          pending70Percent: Number(pendingToReach70.toFixed(2)), // "70% hone me itna baaki"
          total70Percent: Number(below70_totalAmount.toFixed(2)), // "total itna (sum of totalRate for those trips)",

          // extra: breakdown if useful
          below70: {
            totalTrips: below70_totalTrips,
            totalPaid: Number(below70_totalPaid.toFixed(2)),
            totalAmount: Number(below70_totalAmount.toFixed(2)),
            seventyPercentSum: Number(below70_seventySum.toFixed(2)),
          },
        };
      }

      // other roles unchanged
      return user;
    })
  );

  res.status(200).json({
    status: "success",
    results: usersWithPending.length,
    data: {
      users: usersWithPending,
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
