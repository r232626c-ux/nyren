require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const promClient = require('prom-client');

// DB
const { sequelize, connectDB } = require("./config/db");
const { migrateSchemaSafely } = require("./config/schemaMigration");

// Load models and setup associations
require("./models");

const app = express();

// Disable ETag generation to prevent stale 304 auth responses during development
app.disable('etag');

// Test route at the very beginning
app.get("/test", (req, res) => {
  console.log("[TEST] Test route called");
  res.json({ message: "Server is working" });
});

// Monitoring
promClient.collectDefaultMetrics({ prefix: 'coli_backend_' });

/* ---------------- MIDDLEWARE ---------------- */
const corsOptions = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "Cache-Control", "Pragma", "Expires"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  return next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security middleware
const { apiLimiter } = require('./middleware/rateLimit');
const { authenticateToken } = require('./middleware/auth');

app.use('/api', apiLimiter);

/* ---------------- HEALTH CHECK ---------------- */
app.get("/health", async (req, res) => {
  console.log("[HEALTH] Health check requested");
  try {
    await sequelize.authenticate();
    console.log("[HEALTH] Database authenticated");
    res.json({
      status: "OK",
      database: "PostgreSQL connected",
      uptime: process.uptime(),
    });
  } catch (err) {
    console.error("[HEALTH] Database error:", err.message);
    res.status(500).json({
      status: "ERROR",
      database: "Disconnected",
    });
  }
});

// Test route
app.get("/test", (req, res) => {
  console.log("[TEST] Test route called");
  res.json({ message: "Server is working" });
});

/* ---------------- ROUTES ---------------- */
console.log("[SERVER] Loading routes...");
app.use("/api/chat", require("./routes/chat"));
app.use("/api/search", require("./routes/search"));
app.use("/api/reason", require("./routes/reason"));
app.use("/api/memory", require("./routes/memoryRoutes"));
app.use("/api/trends", require("./routes/trendRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/users/oauth", require("./routes/oauth"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/data", require("./routes/data"));
app.use("/api/doc-chat", require("./routes/docChat"));
app.use("/api/history", require("./routes/history"));
app.use("/api/learn", require("./routes/learning"));
app.use("/api/community", require("./routes/community"));
app.use("/api/inbox", require("./routes/inbox"));
app.use("/api/feed", require("./routes/feed"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/tts", require("./routes/tts"));
app.use('/api/billing', require('./billing/routes'));
app.use("/api", require("./routes/research.routes"));
app.use("/api/scientific/antibacterial", require("./scientific/antibacterial/routes/antibacterialRoutes"));
app.use("/api", require("./routes/analysis"));
app.use("/api/intelligence", require("./routes/intelligence"));

/* ---------------- ERROR HANDLER ---------------- */
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err);
  res.status(500).json({
    error: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

/* ---------------- MIGRATION ---------------- */
const migrateExistingData = async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'conversations'
      );
    `);

    if (!results[0]?.exists) return;

    await sequelize.query(`
      UPDATE conversations SET coli_response = '' WHERE coli_response IS NULL;
    `);

    await sequelize.query(`
      UPDATE conversations SET message = '' WHERE message IS NULL;
    `);

    console.log("[Migration] Cleanup done");
  } catch (err) {
    console.warn("[Migration] Skipped:", err.message);
  }
};

/* ------- START SERVER -------- */
const startServer = async () => {
  try {
    console.log("[Server] Connecting DB...");
    await connectDB();

    await migrateExistingData();

    console.log("[Server] Syncing DB...");
    await migrateSchemaSafely(sequelize);
    
    try {
      await sequelize.sync({ alter: false });
    } catch(syncErr) {
      console.warn("[SYNC WARNING]", syncErr.message);
      // Continue even if sync fails - migrations already set up schema
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log("====================================");
      console.log("🚀 Server running on port:", PORT);
      console.log("🧠 PostgreSQL connected");
      console.log("📡 Listening on 0.0.0.0");
      console.log("====================================");
    });
  } catch (err) {
    console.error("[FATAL]", err.message);
    process.exit(1);
  }
};

startServer();