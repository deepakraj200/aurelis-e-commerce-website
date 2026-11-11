'use strict';

const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (env.SMTP_HOST && env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  const client = getTransporter();
  if (!client) {
    // No SMTP configured: log for local development, never expose the token in production.
    if (!env.isProduction) {
      console.log(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n[mail:dev] ${text}\n`);
    }
    return { delivered: false, reason: 'smtp-not-configured' };
  }
  await client.sendMail({ from: env.EMAIL_FROM, to, subject, text, html });
  return { delivered: true };
};

const sendPasswordReset = async ({ to, name, resetUrl }) => {
  const subject = 'Reset your AURELIS password';
  const text = [
    `Hello ${name},`,
    '',
    'We received a request to reset your AURELIS password. This link is valid for 30 minutes and can be used once.',
    resetUrl,
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="background:#050506;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:48px 24px">
      <div style="max-width:520px;margin:0 auto;background:#111113;border:1px solid #232326;border-radius:24px;padding:36px">
        <p style="letter-spacing:6px;font-size:12px;color:#c7b299;margin:0 0 8px">AURELIS</p>
        <h1 style="font-size:26px;margin:0 0 20px">Reset your password</h1>
        <p style="color:#a1a1a6;line-height:1.7">Hello ${name}, we received a request to reset your password. This link is valid for 30 minutes and can be used only once.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;background:#f5f5f7;color:#0a0a0a;padding:13px 24px;border-radius:999px;text-decoration:none;font-weight:600">Reset password</a>
        <p style="color:#6e6e73;font-size:12px;line-height:1.6">If you did not request this, no action is required.</p>
      </div>
    </div>`;

  return sendMail({ to, subject, text, html });
};

const sendOrderConfirmation = async ({ to, name, order }) =>
  sendMail({
    to,
    subject: `Order ${order.orderNumber} confirmed — AURELIS`,
    text: `Hello ${name}, your order ${order.orderNumber} has been received. Total: $${order.totalAmount.toFixed(2)}.`,
  });

module.exports = { sendMail, sendPasswordReset, sendOrderConfirmation };
