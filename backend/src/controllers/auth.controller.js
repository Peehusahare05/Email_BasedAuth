const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { sendEmail } = require("../utils/sendEmail");
const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry
} = require("../utils/generateToken");

const randomBytesAsync = promisify(crypto.randomBytes);
const SALT_ROUNDS = 12;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // create verification token (random 32 bytes -> hex)
    const tokenBuf = await randomBytesAsync(32);
    const verificationToken = tokenBuf.toString("hex");
console.log("RAW EMAIL VERIFICATION TOKEN:", verificationToken);

    const verificationTokenHash = hashToken(verificationToken);
const tokenExpires = new Date(Date.now() + 1000 * 60 * 60);

    const user = new User({
      name,
      email,
      passwordHash,
      emailVerificationTokenHash: verificationTokenHash,
      emailVerificationTokenExpires: tokenExpires
    });

    await user.save();

    // send verification email
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyUrl = `${clientUrl}/verified-success?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const html = `
      <p>Hi ${name},</p>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}">Verify email</a></p>
      <p>This link will expire in 30 minutes.</p>
    `;

    await sendEmail({
      to: email,
      subject: "Verify your email",
      html
    });

    return res.status(201).json({ message: "Signup successful. Please check your email for verification link." });
  } catch (err) {
    console.error("signup error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) return res.status(400).send("Invalid verification link");

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).send("Invalid or expired token");

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpires = undefined;

    await user.save();

    // redirect to client login page
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${clientUrl}/login?verified=1`);
  } catch (err) {
    console.error("verifyEmail error", err);
    return res.status(500).send("Server error");
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // ensure email verified
    if (!user.isEmailVerified) return res.status(403).json({ message: "Please verify your email before logging in" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    // generate tokens
    const payload = { userId: user._id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // store hashed refresh token
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      tokenHash: refreshTokenHash,
      expiresAt,
      deviceInfo: deviceInfo || req.headers["user-agent"] || "unknown"
    });

    // optionally prune old tokens (simple)
    user.refreshTokens = user.refreshTokens.filter(rt => rt.expiresAt > new Date());

    await user.save();

    // send tokens — access token in body, refresh token in httpOnly cookie (optional)
    // Here we return both in JSON (client can store refresh token in httpOnly cookie instead)
    return res.json({
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    // verify signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "Invalid refresh token" });

    const refreshTokenHash = hashToken(refreshToken);

    // find stored token
    const stored = user.refreshTokens.find(rt => rt.tokenHash === refreshTokenHash && rt.expiresAt > new Date());
    if (!stored) {
      // possible token reuse or stolen token
      // revoke all refresh tokens as precaution
      user.refreshTokens = [];
      await user.save();
      return res.status(401).json({ message: "Refresh token not recognized. Re-login required." });
    }

    // rotate: remove old token, create new one
    user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== refreshTokenHash);

    const newAccess = generateAccessToken({ userId: user._id });
    const newRefresh = generateRefreshToken({ userId: user._id });
    const newRefreshHash = hashToken(newRefresh);
    const newExpiresAt = getRefreshTokenExpiry();

    user.refreshTokens.push({
      tokenHash: newRefreshHash,
      expiresAt: newExpiresAt,
      deviceInfo: stored.deviceInfo
    });

    await user.save();

    return res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    console.error("refresh error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    const tokenHash = hashToken(refreshToken);
    const user = await User.findOne({ "refreshTokens.tokenHash": tokenHash });
    if (!user) return res.status(200).json({ message: "Logged out" });

    user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== tokenHash);
    await user.save();
    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    console.error("logout error", err);
    return res.status(500).json({ message: "Server error" });
  }
};
