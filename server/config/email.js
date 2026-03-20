const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: port === 465,
    auth: { user, pass }
  });
  return transporter;
};

const isEmailConfigured = () => !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

module.exports = { getTransporter, isEmailConfigured };
