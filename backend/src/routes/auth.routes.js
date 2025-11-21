const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

// Import controller functions
const { 
  signup, 
  login, 
  verifyOtp, 
  getMe, 
  refresh, 
  logout 
} = require("../controllers/auth.controller");

// Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.get("/me", authMiddleware, getMe);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
