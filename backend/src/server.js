require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// connect DB
connectDB(process.env.MONGO_URI);

// routes
app.use("/api/auth", authRoutes);

// simple protected test route
const authMiddleware = require("./middleware/auth.middleware");
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is protected", user: req.user });
});

// fallback 
app.get("/", (req, res) => res.send("Auth API running"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

