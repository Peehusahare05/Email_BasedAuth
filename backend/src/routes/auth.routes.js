const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth.controller");

// Signup -> sends verification email
router.post("/signup", authCtrl.signup);

// Verify email (user clicks link which hits this)
router.get("/verify-email", authCtrl.verifyEmail);

// Login -> returns access + refresh
router.post("/login", authCtrl.login);

// Refresh tokens
router.post("/refresh", authCtrl.refresh);

// Logout
router.post("/logout", authCtrl.logout);

module.exports = router;
