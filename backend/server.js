const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const expenseRoutes = require("./routes/expenseRoutes");
const tripRoutes = require("./routes/tripRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const categoryRoutes = require("./routes/categoryRoutes"); // NEW IMPORT

const app = express();
const PORT = process.env.PORT || 5000;

// 🔧 ENHANCED CORS CONFIGURATION
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3001",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(
    `🔍 ${req.method} ${req.path} from ${req.get("Origin") || "unknown origin"}`
  );
  next();
});

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/expense-tracker",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("❌ MongoDB Connection Error:", error);
  });

// Routes
app.use("/api", expenseRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/categories", categoryRoutes); // NEW ROUTE

// Test endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Expense Tracker API is running!",
    timestamp: new Date().toISOString(),
    port: PORT,
    cors: "enabled",
    routes: [
      "GET /",
      "GET /api/expenses",
      "POST /api/add-expense",
      "GET /api/categories/insights",
      "GET /api/categories/budget",
    ],
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      "GET /",
      "GET /api/health",
      "GET /api/expenses",
      "POST /api/add-expense",
      "GET /api/categories/insights",
      "GET /api/categories/budget",
      "POST /api/categories/budget",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 Access at: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `✅ CORS enabled for: http://localhost:5173, http://localhost:3000`
  );
});
