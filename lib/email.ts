import { Resend } from "resend";

/**
 * Config
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// If you DON'T have a verified domain yet, use onboarding sender (works for testing)
const FROM_FALLBACK = process.env.RESEND_FROM || "onboarding@resend.dev";
const FROM = process.env.SLOTTA_FROM || `Slotta <${FROM_FALLBACK}>`;

// Optional: default reply-to (owner inbox etc.)
const REPLY_TO = process.env.SLOTTA_REPLY_TO || undefined;

// Where YOU receive notifications (signup + contact)
const OWNER_NOTIFY_EMAIL = process.env.OWNER_NOTIFY_EMAIL || "";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  scheduledAt?: string; // ISO string or natural language like "in 1 min"
};

async function safeSend({ to, subject, html, replyTo, scheduledAt }: SendArgs) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing; skipping email:", {
      to,
      subject,
      scheduledAt,
    });
    return { skipped: true };
  }

  try {
  const text = html
  .replace(/<br\s*\/?>/gi, "\n")
  .replace(/<\/p>/gi, "\n\n")
  .replace(/<\/div>/gi, "\n")
  .replace(/<\/li>/gi, "\n")
  .replace(/<li>/gi, "• ")
  .replace(/<[^>]+>/g, "")
  .replace(/\n{3,}/g, "\n\n")
  .trim();
  return await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
      replyTo: replyTo ?? REPLY_TO,
      scheduledAt,
    });
  } catch (err) {
    console.error("[email] send failed:", err);
    return { error: true };
  }
}

/**
 * Template helpers
 */
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function btn(href: string, text: string) {
  return `
    <a href="${href}"
       style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px">
      ${escapeHtml(text)}
    </a>
  `;
}

function wrap(title: string, bodyHtml: string, footer = "Powered by Slottick") {
  return `
  <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
            
            <tr>
              <td style="padding:20px 24px;background:#0f172a;color:#fff;">
                <div style="font-size:13px;opacity:0.8;">Slottick</div>
                <div style="font-size:24px;font-weight:700;margin-top:6px;">
                  ${escapeHtml(title)}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px;">
                ${bodyHtml}
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
                ${escapeHtml(footer)}
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
}

/* -----------------------------
   1) Email verification (owner)
------------------------------ */
export async function sendVerifyEmail(args: { to: string; verifyLink: string }) {
  const html = wrap(
    "Verify your email",
    `
      <p>Click below to verify your Slottick account.</p>
      <p>${btn(args.verifyLink, "Verify email")}</p>
      <p style="color:#64748b;font-size:14px">This link expires in 30 minutes.</p>
    `
  );

  return safeSend({
    to: args.to,
    subject: "Verify your Slottick email",
    html,
  });
}

/* -----------------------------
   2) Password reset
------------------------------ */
export async function sendResetPasswordEmail(args: { to: string; resetLink: string }) {
  const html = wrap(
    "Reset your password",
    `
      <p>You requested a password reset for Slottick.</p>
      <p>${btn(args.resetLink, "Reset password")}</p>
      <p style="color:#64748b;font-size:14px">This link expires in 30 minutes.</p>
      <p style="color:#64748b;font-size:14px">If you didn’t request this, ignore this email.</p>
    `
  );

  return safeSend({
    to: args.to,
    subject: "Reset your Slottick password",
    html,
  });
}

/* -----------------------------
   3) Booking confirmation (client)
------------------------------ */
export async function sendBookingConfirmationEmail(args: {
  to: string;
  businessName: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
  priceText: string;
  manageLink: string;
}) {
  const html = wrap(
    "Appointment confirmed ✅",
    `
      <p><strong>${escapeHtml(args.businessName)}</strong></p>

      <p>
        <strong>Service:</strong> ${escapeHtml(args.serviceName)}<br/>
        <strong>Date:</strong> ${escapeHtml(args.date)}<br/>
        <strong>Time:</strong> ${escapeHtml(args.time)}<br/>
        <strong>Duration:</strong> ${args.durationMin} min<br/>
        <strong>Price:</strong> ${escapeHtml(args.priceText)}
      </p>

      <p>${btn(args.manageLink, "View booking")}</p>
    `
  );

  return safeSend({
    to: args.to,
    subject: `Confirmed: ${args.serviceName} on ${args.date} at ${args.time}`,
    html,
  });
}

/* -----------------------------
   4) Review request (after service completed)
------------------------------ */
export async function sendReviewRequestEmail(args: {
  to: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  reviewLink: string;
}) {
  const html = wrap(
    "How was your appointment?",
    `
      <p>Hope it went great with <strong>${escapeHtml(args.businessName)}</strong>.</p>
      <p>
        <strong>Service:</strong> ${escapeHtml(args.serviceName)}<br/>
        <strong>When:</strong> ${escapeHtml(args.date)} at ${escapeHtml(args.time)}
      </p>
      <p>${btn(args.reviewLink, "Leave a review")}</p>
      <p style="color:#64748b;font-size:14px">It takes 10 seconds and helps others find great services.</p>
    `
  );

  return safeSend({
    to: args.to,
    subject: `Leave a review for ${args.businessName}`,
    html,
  });
}

/* -----------------------------
   5) Welcome email (business owner)
------------------------------ */
export async function sendWelcomeOwnerEmail(args: {
  to: string;
  businessName: string;
  dashboardLink: string;
}) {
  const html = wrap(
    "Your Slottick account has been created successfully 👋",
    `
      <p>Welcome, and congrats on setting up <strong>${escapeHtml(args.businessName)}</strong>.</p>
      <p>Next steps:</p>
      <ul>
        <li>Add your services</li>
        <li>Set your availability</li>
        <li>Share your booking link</li>
      </ul>
      <p>${btn(args.dashboardLink, "Open your dashboard")}</p>
    `,
    "If you need help, just reply to this email."
  );

  return safeSend({
    to: args.to,
    subject: `Welcome to Slottick, ${args.businessName}!`,
    html,
  });
}

/* -----------------------------
   6) Notify you about new signup
------------------------------ */
export async function notifyOwnerNewSignup(args: {
  ownerEmail: string;
  businessName: string;
  slug: string;
  createdAt?: string;
}) {
  if (!OWNER_NOTIFY_EMAIL) {
    console.warn("[email] OWNER_NOTIFY_EMAIL missing; skipping signup notify");
    return { skipped: true };
  }

  const html = wrap(
    "New business signup 🎉",
    `
      <p><strong>Business:</strong> ${escapeHtml(args.businessName)}</p>
      <p><strong>Owner email:</strong> ${escapeHtml(args.ownerEmail)}</p>
      <p><strong>Slug:</strong> ${escapeHtml(args.slug)}</p>
      ${args.createdAt ? `<p><strong>Created:</strong> ${escapeHtml(args.createdAt)}</p>` : ""}
    `
  );

  return safeSend({
    to: OWNER_NOTIFY_EMAIL,
    subject: `New signup: ${args.businessName}`,
    html,
  });
}

/* -----------------------------
   7) Notify you about contact form message
------------------------------ */
export async function notifyOwnerContactMessage(args: {
  name: string;
  email: string;
  subject: string;
  message: string;
  meta?: { ip?: string; userAgent?: string; sentAt?: string };
}) {
  if (!OWNER_NOTIFY_EMAIL) {
    console.warn("[email] OWNER_NOTIFY_EMAIL missing; skipping contact notify");
    return { skipped: true };
  }

  const html = wrap(
    "New contact message ✉️",
    `
      <p><strong>Name:</strong> ${escapeHtml(args.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(args.email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(args.subject)}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;background:#f8fafc;padding:12px;border-radius:10px;border:1px solid #e2e8f0">${escapeHtml(args.message)}</pre>

      ${
        args.meta
          ? `<p style="color:#64748b;font-size:13px">
              ${args.meta.sentAt ? `Sent: ${escapeHtml(args.meta.sentAt)}<br/>` : ""}
              ${args.meta.ip ? `IP: ${escapeHtml(args.meta.ip)}<br/>` : ""}
              ${args.meta.userAgent ? `UA: ${escapeHtml(args.meta.userAgent)}` : ""}
            </p>`
          : ""
      }
    `
  );

  return safeSend({
    to: OWNER_NOTIFY_EMAIL,
    subject: `Contact: ${args.subject}`,
    html,
    replyTo: args.email, // IMPORTANT: reply goes to the sender
  });
}

export async function sendClientFollowUpEmail(args: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  footer?: string;
  scheduledAt?: string;
}) {
  const to = String(args.to ?? "").trim();
  const subject = String(args.subject ?? "").trim();
  const html = String(args.html ?? "");
  const scheduledAt = args.scheduledAt ? String(args.scheduledAt).trim() : undefined;

  if (!to || !subject || !html) return { ok: false, error: "Missing fields" };
  if (subject.length > 200) return { ok: false, error: "Subject too long" };
  if (html.length > 80_000) return { ok: false, error: "Body too long" };

  if (scheduledAt) {
    const d = new Date(scheduledAt);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, error: "Invalid scheduledAt" };
    }

    const max = Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (d.getTime() > max) {
      return { ok: false, error: "scheduledAt exceeds 30 days" };
    }
  }

  const trimmedHtml = html.trim();

  const wrapped = wrap(
    subject,
    trimmedHtml.startsWith("<")
      ? trimmedHtml
      : `<p>${escapeHtml(trimmedHtml).replaceAll("\n", "<br/>")}</p>`,
    args.footer ?? "Powered by Slottick"
  );

  const res = await safeSend({
    to,
    subject,
    html: wrapped,
    replyTo: args.replyTo,
    scheduledAt,
  });

  if ((res as any)?.error) return { ok: false, error: "Send failed" };
  if ((res as any)?.skipped) return { ok: false, error: "Email provider not configured" };

  return { ok: true, res };
}
