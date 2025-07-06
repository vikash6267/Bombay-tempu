const jwt = require("jsonwebtoken")
const { promisify } = require("util")
const User = require("../models/User")
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")

const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    return next(new AppError("You are not logged in! Please log in to get access.", 401))
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id).select("+active")
  if (!currentUser) {
    return next(new AppError("The user belonging to this token does no longer exist.", 401))
  }

  // 4) Check if user is active
  if (!currentUser.active) {
    return next(new AppError("Your account has been deactivated. Please contact support.", 401))
  }

  // 5) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("User recently changed password! Please log in again.", 401))
  }

  // Grant access to protected route
  req.user = currentUser
  next()
})

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403))
    }
    next()
  }
}

module.exports = {
  protect,
  restrictTo,
}
