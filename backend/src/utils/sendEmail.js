const nodemailer = require("nodemailer");

async function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = await createTransporter();
  const from = process.env.FROM_EMAIL || process.env.EMAIL_USER;
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
  return info;
}

module.exports = { sendEmail };
