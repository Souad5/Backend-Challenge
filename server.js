// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db/db");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect DB
connectDB().catch((err) => {
  console.error("Failed to connect DB:", err);
  process.exit(1);
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

// Health check
app.get("/health", async (req, res) => {
  try {
    const db = require("./db/db").getDB();
    await db.command({ ping: 1 });
    res.json({ status: "OK", db: "connected" });
  } catch {
    res.status(500).json({ status: "ERROR", db: "disconnected" });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Product API",
    version: "1.0.0",
    endpoints: {
      categories: "/api/categories",
      products: "/api/products",
      health: "/health"
    },
    author: "Md Souad Al Kabir",
    status: "API is running smoothly"
  });
});
// === ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});