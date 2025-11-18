const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  deviceInfo: { type: String } // optional
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },

  // email verification
  emailVerificationTokenHash: { type: String },
  emailVerificationTokenExpires: { type: Date },

  // refresh tokens array (hashed)
  refreshTokens: [refreshTokenSchema],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
