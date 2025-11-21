const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  deviceInfo: { type: String } // optional
});

// USER SCHEMA
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },

  // 🔵 OTP VERIFICATION FIELDS
  otp: { type: String },          // hashed OTP
  otpExpires: { type: Date },     // expiry time
  isEmailVerified: { type: Boolean, default: false },

  // 🔴 REMOVE OLD EMAIL VERIFICATION TOKEN FIELDS
  // emailVerificationTokenHash: { type: String },
  // emailVerificationTokenExpires: { type: Date },

  // 🔵 REFRESH TOKENS
  refreshTokens: [refreshTokenSchema],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
