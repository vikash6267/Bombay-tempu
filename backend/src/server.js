const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const morgan = require("morgan");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const globalErrorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/appError");

// Load environment variables
const dotenv = require("dotenv");

dotenv.config({path: "./.env", debug: true, encoding: "utf-8"});

const app = express();

// Trust proxy
app.set("trust proxy", 1);

// Global Middlewares
// Security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({extended: true, limit: "10mb"}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// CORS
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Transport & Fleet Management API",
      version: "1.0.0",
      description: "API documentation for Transport & Fleet Management System",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/v1/trips", require("./routes/tripRoutes"));
app.use("/api/v1/payments", require("./routes/paymentRoutes"));
app.use("/api/v1/maintenance", require("./routes/maintenanceRoutes"));
app.use("/api/v1/reports", require("./routes/reportRoutes"));
app.use("/api/v1/cities", require("./routes/cityRoutes"));
app.use("/api/v1/expenses", require("./routes/expenseRoutes"));









function calculateDashboardData(trips) {
  let totalTrips = trips.length;
  let totalPods = 0;
  let totalProfitBeforeExpenses = 0;
  let totalExpenses = 0;

  trips.forEach(trip => {
    totalPods += (trip.podBalance || 0);

    // Profit Calculation
    if (trip.vehicleOwner?.ownershipType === "fleet_owner") {
      const clientTotalRate = trip.clients.reduce((sum, c) => sum + (c.rate || 0), 0);
      const clientTruckCost = trip.clients.reduce((sum, c) => sum + (c.truckHireCost || 0), 0);
      const profit = (clientTotalRate - clientTruckCost) + clientTruckCost - (trip.rate || 0) + (trip.commission || 0);
      totalProfitBeforeExpenses += profit;
    } else if (trip.vehicleOwner?.ownershipType === "self") {
      const profit = (trip.totalClientAmount || 0) - (trip.rate || 0) + (trip.commission || 0);
      totalProfitBeforeExpenses += profit;

      // Self Expenses for Self Trips
      if (Array.isArray(trip.selfExpenses)) {
        totalExpenses += trip.selfExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      }
    }
  });

  const totalFinalProfit = totalProfitBeforeExpenses - totalExpenses;

  return {
    totalTrips,
    totalPods,
    totalProfitBeforeExpenses,
    totalExpenses,
    totalFinalProfit
  };
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// Database connection

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log("❌ Unhandled Promise Rejection:", err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("❌ Uncaught Exception:", err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
