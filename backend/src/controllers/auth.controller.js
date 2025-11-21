const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { sendEmail } = require("../utils/sendEmail");
const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry
} = require("../utils/generateToken");

const SALT_ROUNDS = 12;

// Hash OTP + refresh token
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/* --------------------------------------------------
   ⭐ SIGNUP → CREATE USER + SEND 6 DIGIT OTP
-------------------------------------------------- */
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashToken(otp);

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = new User({
      name,
      email,
      passwordHash,
      otp: otpHash,
      otpExpires,
      isEmailVerified: false
    });

    await user.save();

    const html = `
      <p>Hi ${name},</p>
      <p>Your OTP is:</p>
      <h2>${otp}</h2>
      <p>Valid for 10 minutes</p>
    `;

    await sendEmail({ to: email, subject: "Your OTP Code", html });

    return res.status(201).json({ message: "Signup success. OTP sent!" });

  } catch (err) {
    console.log("Signup error:", err);
    res.status(500).json({ message: "Internal error" });
  }
};

/* --------------------------------------------------
   ⭐ VERIFY OTP
-------------------------------------------------- */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const otpHash = hashToken(otp);

    if (otpHash !== user.otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpires < new Date())
      return res.status(400).json({ message: "OTP expired" });

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ message: "OTP verified successfully" });

  } catch (err) {
    console.log("verifyOtp error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* --------------------------------------------------
   ⭐ LOGIN
-------------------------------------------------- */
exports.login = async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isEmailVerified)
      return res.status(403).json({ message: "Please verify OTP first" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(400).json({ message: "Invalid credentials" });

    const payload = { id: user._id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = getRefreshTokenExpiry();

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      tokenHash: refreshTokenHash,
      expiresAt,
      deviceInfo: deviceInfo || req.headers["user-agent"] || "unknown",
    });

    await user.save();

    res.json({ accessToken, refreshToken });

  } catch (err) {
    console.log("login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* --------------------------------------------------
   ⭐ GET LOGGED-IN USER (FOR DASHBOARD)
-------------------------------------------------- */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email number");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });

  } catch (err) {
    console.log("getMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -------------------------------------------------- */
exports.refresh = async (req, res) => { /* your refresh code */ };
exports.logout = async (req, res) => { /* your logout code */ };
