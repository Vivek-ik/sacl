import nodemailer from "nodemailer";

const requiredEnv = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM_EMAIL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing email configuration: ${key}`);
  }
}

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

export async function verifyMailConnection() {
  await transporter.verify();
  console.log("SMTP connection established successfully.");
}

export async function sendMail({ to, subject, html, text }) {
  const recipients = Array.isArray(to) ? to : [to];
  const validRecipients = recipients.filter(Boolean);

  if (!validRecipients.length) {
    throw new Error("Email recipient is required.");
  }

  return transporter.sendMail({
    from: {
      name: process.env.SMTP_FROM_NAME || "SACL 2.0",
      address: process.env.SMTP_FROM_EMAIL,
    },
    to: validRecipients,
    subject,
    html,
    text,
  });
}
