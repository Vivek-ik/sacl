import { sendMail } from "../config/mail.js";

const APP_NAME = process.env.APP_NAME || "Samrat Ashok Cricket League";

const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(
  /\/$/,
  "",
);

const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));

function emailTemplate({ title, name, message, details = [], button }) {
  const rows = details
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#64748b">
        ${escapeHtml(label)}
      </td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold">
        ${escapeHtml(value)}
      </td>
    </tr>
  `,
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#172033">
    <div style="max-width:600px;margin:30px auto;background:white;border-radius:12px;overflow:hidden">
      <div style="background:#10251d;padding:30px;text-align:center;color:white">
        <h1 style="color:#a3e635;margin:0">${APP_NAME}</h1>
        <p>${escapeHtml(title)}</p>
      </div>
      <div style="padding:30px">
        <h2>Hello ${escapeHtml(name || "there")},</h2>
        <p style="line-height:1.7;color:#475569">${message}</p>
        ${
          details.length
            ? `
          <table style="width:100%;border-collapse:collapse;background:#f8fafc">
            ${rows}
          </table>
        `
            : ""
        }
        ${
          button
            ? `
          <div style="text-align:center;margin:30px 0">
            <a href="${escapeHtml(button.url)}"
              style="background:#a3e635;color:#172033;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
              ${escapeHtml(button.label)}
            </a>
          </div>
          <p style="font-size:12px;word-break:break-all;color:#64748b">
            Link: ${escapeHtml(button.url)}
          </p>
        `
            : ""
        }
      </div>
      <div style="padding:18px;text-align:center;background:#f8fafc;color:#94a3b8;font-size:12px">
        Automated email from ${APP_NAME}.
      </div>
    </div>
  </body>
  </html>`;
}

async function deliver({ to, subject, title, name, message, details, button }) {
  const html = emailTemplate({
    title,
    name,
    message,
    details,
    button,
  });

  return sendMail({
    to,
    subject,
    html,
    text: `${title}\nHello ${name || "there"},\n${message}\n${
      button ? button.url : ""
    }`,
  });
}

// ACCOUNT REGISTRATION
export async function sendAccountWelcomeEmail({ to, name, role }) {
  return deliver({
    to,
    subject: `Welcome to ${APP_NAME}`,
    title: "Account created successfully",
    name,
    message: "Your account has been successfully created. Welcome to SACL!",
    details: [
      ["Name", name],
      ["Email", to],
      ["Role", role],
    ],
    button: {
      label: "Login to SACL",
      url: `${CLIENT_URL}/login`,
    },
  });
}

// PLAYER APPROVED
export async function sendPlayerApprovedEmail({
  to,
  name,
  tournamentName,
  category,
}) {
  return deliver({
    to,
    subject: `Player Registration Approved - ${tournamentName}`,
    title: "Congratulations! You are approved",
    name,
    message:
      "Your player registration has been approved by the tournament organizer.",
    details: [
      ["Tournament", tournamentName],
      ["Category", category],
      ["Status", "APPROVED"],
    ],
    button: {
      label: "Open Dashboard",
      url: `${CLIENT_URL}/dashboard`,
    },
  });
}

// PLAYER REJECTED
export async function sendPlayerRejectedEmail({
  to,
  name,
  tournamentName,
  reason,
}) {
  return deliver({
    to,
    subject: `Player Registration Update - ${tournamentName}`,
    title: "Registration not approved",
    name,
    message: "Unfortunately, your registration was not approved.",
    details: [
      ["Tournament", tournamentName],
      ["Status", "REJECTED"],
      ["Reason", reason || "Please contact the tournament organizer."],
    ],
    button: {
      label: "Login to SACL",
      url: `${CLIENT_URL}/login`,
    },
  });
}

// TEAM APPROVED / REJECTED
export async function sendTeamDecisionEmail({
  to,
  ownerName,
  teamName,
  tournamentName,
  approved,
  reason,
}) {
  return deliver({
    to,
    subject: `Team ${approved ? "Approved" : "Rejected"} - ${tournamentName}`,
    title: approved ? "Team Approved" : "Team Not Approved",
    name: ownerName,
    message: approved
      ? "Your team application has been approved."
      : "Your team application was not approved.",
    details: [
      ["Team", teamName],
      ["Tournament", tournamentName],
      ["Status", approved ? "APPROVED" : "REJECTED"],
      ...(!approved ? [["Reason", reason || "Contact the organizer."]] : []),
    ],
    button: {
      label: "Open Dashboard",
      url: `${CLIENT_URL}/dashboard`,
    },
  });
}

// PASSWORD RESET
export async function sendPasswordResetEmail({ to, name, resetToken }) {
  return deliver({
    to,
    subject: `Reset your ${APP_NAME} password`,
    title: "Password Reset",
    name,
    message:
      "We received a request to reset your password. This link should expire in one hour.",
    button: {
      label: "Reset Password",
      url: `${CLIENT_URL}/reset-password/${encodeURIComponent(resetToken)}`,
    },
  });
}

// REGISTRATION LINK
export async function sendRegistrationInvitationEmail({
  to,
  name,
  tournamentName,
  registrationUrl,
  startDate,
  endDate,
  venue,
}) {
  return deliver({
    to,
    subject: `Registrations Open - ${tournamentName}`,
    title: "Tournament Registration Open",
    name,
    message: `Registrations are now open for ${escapeHtml(tournamentName)}. Register using the link below.`,
    details: [
      ["Tournament", tournamentName],
      ["Start", startDate ? formatDate(startDate) : "To be announced"],
      ["End", endDate ? formatDate(endDate) : "To be announced"],
      ["Venue", venue || "To be announced"],
    ],
    button: {
      label: "Register Now",
      url: registrationUrl,
    },
  });
}

// AUCTION ANNOUNCEMENT
export async function sendAuctionAnnouncementEmail({
  to,
  name,
  tournamentName,
  auctionDate,
  auctionUrl,
}) {
  return deliver({
    to,
    subject: `Auction Announcement - ${tournamentName}`,
    title: "Player Auction Announced",
    name,
    message:
      "The player auction schedule has been announced. Please join the auction room on time.",
    details: [
      ["Tournament", tournamentName],
      ["Auction Date", formatDate(auctionDate)],
    ],
    button: {
      label: "Join Auction Room",
      url: auctionUrl,
    },
  });
}

// AUCTION REMINDER
export async function sendAuctionReminderEmail({
  to,
  name,
  tournamentName,
  auctionDate,
  auctionUrl,
}) {
  return deliver({
    to,
    subject: `Auction Reminder - ${tournamentName}`,
    title: "Your Auction Starts Soon",
    name,
    message: "This is a reminder about your upcoming player auction.",
    details: [
      ["Tournament", tournamentName],
      ["Auction Time", formatDate(auctionDate)],
    ],
    button: {
      label: "Enter Auction Room",
      url: auctionUrl,
    },
  });
}
