const crypto = require("crypto")
const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
const Email = require("../utils/email")

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  })
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  }
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true

  res.cookie("jwt", token, cookieOptions)

  // Remove password from output
  user.password = undefined

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  })
}

const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role, phone, address } = req.body

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return next(new AppError("User with this email already exists", 400))
  }

  // Create new user
  const newUser = await User.create({
    name,
    email,
    password,
    role,
    phone,
    address,
  })

  // Generate email verification token
  const verifyToken = newUser.createEmailVerificationToken()
  await newUser.save({ validateBeforeSave: false })

  // Send verification email
  try {
    const verifyURL = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${verifyToken}`

    await new Email(newUser, verifyURL).sendWelcome()

    res.status(201).json({
      status: "success",
      message: "User registered successfully! Please check your email to verify your account.",
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
    })
  } catch (err) {
    newUser.emailVerificationToken = undefined
    newUser.emailVerificationExpires = undefined
    await newUser.save({ validateBeforeSave: false })

    return next(new AppError("There was an error sending the email. Please try again later.", 500))
  }
})

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400))
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password +active")
  console.log(user)
  let pass= await user.correctPassword(password, user.password)
  console.log(pass)
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401))
  }

  // 3) Check if user account is active
  if (!user.active) {
    return next(new AppError("Your account has been deactivated. Please contact support.", 401))
  }

  // 4) Update last login
  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  // 5) If everything ok, send token to client
  createSendToken(user, 200, res)
})

const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })
  res.status(200).json({ status: "success" })
}

const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return next(new AppError("There is no user with that email address.", 404))
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${resetToken}`

    await new Email(user, resetURL).sendPasswordReset()

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })

    return next(new AppError("There was an error sending the email. Try again later.", 500))
  }
})

const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400))
  }

  if (req.body.password !== req.body.passwordConfirm) {
    return next(new AppError("Passwords do not match", 400))
  }

  user.password = req.body.password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // 3) Update changedPasswordAt property for the user (done in pre-save middleware)

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res)
})

const verifyEmail = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  })

  // 2) If token has not expired, and there is user, verify email
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400))
  }

  user.emailVerified = true
  user.emailVerificationToken = undefined
  user.emailVerificationExpires = undefined
  await user.save({ validateBeforeSave: false })

  res.status(200).json({
    status: "success",
    message: "Email verified successfully!",
  })
})

const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password")

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is incorrect.", 401))
  }

  // 3) Check if new passwords match
  if (req.body.password !== req.body.passwordConfirm) {
    return next(new AppError("Passwords do not match", 400))
  }

  // 4) If so, update password
  user.password = req.body.password
  await user.save()

  // 5) Log user in, send JWT
  createSendToken(user, 200, res)
})

const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  })
})


const Trip = require("../models/Trip");

const getClientTripBalances = catchAsync(async (req, res, next) => {
  const clientId = req.params.clientId;

  const trips = await Trip.find({ "clients.client": clientId })
    .populate("vehicle", "registrationNumber")
    .populate("clients.client", "name email phone");

  const client = await User.findById(clientId);

  let overallBalance = 0;

  const tripBalances = trips
    .map((trip) => {
      const clientData = trip.clients.find(
        (client) => client.client && client.client._id.toString() === clientId
      );

      if (!clientData) return null;

      const totalRate = clientData.totalRate || 0;
      const paidAmount = clientData.paidAmount || 0;
      const balance = totalRate - paidAmount;

      overallBalance += balance;

      return {
        tripId: trip._id,
        tripNumber: trip.tripNumber,
        tripStatus: trip.status,
        tripDate: clientData.timeline?.bookedAt || null,
        vehicleNumber: trip.vehicle?.registrationNumber || null,
        clientTripDetails: {
          clientId: clientData.client._id,
          name: clientData.client.name,
          email: clientData.client.email,
          phone: clientData.client.phone,
          loadDetails: clientData.loadDetails,
          origin: clientData.origin,
          destination: clientData.destination,
          loadNumber: clientData.loadNumber,
          loadDate: clientData.loadDate,
          rate: clientData.rate,
          totalRate: totalRate,
          paidAmount: paidAmount,
          dueAmount: clientData.dueAmount || 0,
          commission: clientData.commission,
          truckHireCost: clientData.truckHireCost,
          balance: balance,
         advance :paidAmount,
          status: clientData.status,
        },
      };
    })
    .filter(Boolean);

  // ✅ Statement Entries (Advance and Expense merged)
  let statementEntries = [];

  // Advances → Credit
  if (client?.advanceRecords?.length) {
    client.advanceRecords.forEach((adv) => {
      statementEntries.push({
        date: adv.date,
        reason: adv.purpose,
        tripId: adv.tripId,
        debit: 0,
        credit: adv.amount,
        type: "advance",
        paidTo: adv.paidTo,
        notes: adv.notes,
      });
    });
  }

  // Expenses → Debit
  if (client?.expenseRecords?.length) {
    client.expenseRecords.forEach((exp) => {
      statementEntries.push({
        date: exp.paidAt,
        reason: exp.type,
        tripId: exp.tripId,
        debit: exp.amount,
        credit: 0,
        type: "expense",
        description: exp.description,
        paidBy: exp.paidBy,
      });
    });
  }

  // ✅ Trip Number Add karna for each entry
  statementEntries = statementEntries.map((entry) => {
    const trip = trips.find((t) => t._id.toString() === entry.tripId?.toString());
    return {
      ...entry,
      tripNumber: trip?.tripNumber || null,
    };
  });

  // ✅ Date wise descending sort (Latest first)
  statementEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalDebit = statementEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = statementEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const closingBalance = totalCredit - totalDebit;

  res.status(200).json({
    status: "success",
    totalTrips: tripBalances.length,
    totalBalance: overallBalance,
    tripBalances,
    statement: {
      totalDebit,
      totalCredit,
      closingBalance,
      entries: statementEntries,
    },
  });
});






module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updatePassword,
  getMe,
  getClientTripBalances
}

