const jwt = require("jsonwebtoken");
const ms = require("ms");

function generateAccessToken(payload) {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES || "15m";
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn });
}

function generateRefreshToken(payload) {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES || "30d";
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn });
}

// helper to get expiry date for refresh tokens (Date object)
function getRefreshTokenExpiry() {
  const val = process.env.REFRESH_TOKEN_EXPIRES || "30d";
  // using ms to convert
  try {
    const msVal = ms(val);
    return new Date(Date.now() + msVal);
  } catch {
    // fallback 30 days:
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry
};
