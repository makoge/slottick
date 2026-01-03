import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// If you DON'T have a verified domain yet, Resend usually requires a verified sender.
// Use their onboarding sender (or your verified sender) until slotta.io is verified.
const FROM_FALLBACK = process.env.RESEND_FROM || "onboarding@resend.dev";
const FROM = process.env.SLOTTA_FROM || `Slotta <${FROM_FALLBACK}>`;

// Optional: where replies should go (owner email etc.)
const REPLY_TO = process.env.SLOTTA_REPLY_TO || undefined;

type SendArgs = {
  to: string;
  subject: string;
  html: string;
};

async function safeSend({ to, subject, html }: SendArgs) {
  // In dev, don’t hard-fail your app if Resend key isn’t set
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY missing; skipping email:", { to, subject });
    return { skipped: true };
  }

  try {
    return await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {})
    });
  } catch (err) {
    console.error("[email] send failed:", err);
    // Don’t throw — booking/login should still work
    return { error: true };
  }
}

function btn(href: string, text: string) {
  return `
    <a href="${href}"
       style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px">
      ${text}
    </a>
  `;
}

function wrap(title: string, bodyHtml: string, footer = "Powered by Slotta") {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="margin:0 0 12px 0">${title}</h2>
      ${bodyHtml}
      <p style="color:#64748b;font-size:13px;margin-top:22px">${footer}</p>
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
      <p>Click below to verify your Slotta account.</p>
      <p>${btn(args.verifyLink, "Verify email")}</p>
      <p style="color:#64748b;font-size:14px">This link expires in 30 minutes.</p>
    `
  );

  return safeSend({
    to: args.to,
    subject: "Verify your Slotta email",
    html
  });
}

/* -----------------------------
   2) Password reset
------------------------------ */
export async function sendResetPasswordEmail(args: { to: string; resetLink: string }) {
  const html = wrap(
    "Reset your password",
    `
      <p>You requested a password reset for Slotta.</p>
      <p>${btn(args.resetLink, "Reset password")}</p>
      <p style="color:#64748b;font-size:14px">This link expires in 30 minutes.</p>
      <p style="color:#64748b;font-size:14px">If you didn’t request this, ignore this email.</p>
    `
  );

  return safeSend({
    to: args.to,
    subject: "Reset your Slotta password",
    html
  });
}

/* -----------------------------
   3) Booking confirmation (client)
------------------------------ */
export async function sendBookingConfirmationEmail(args: {
  to: string;
  businessName: string;
  serviceName: string;
  date: string; // keep as YYYY-MM-DD for now
  time: string; // HH:MM
  durationMin: number;
  priceText: string;
  manageLink: string;
}) {
  const html = wrap(
    "Appointment confirmed ✅",
    `
      <p><strong>${args.businessName}</strong></p>

      <p>
        <strong>Service:</strong> ${args.serviceName}<br/>
        <strong>Date:</strong> ${args.date}<br/>
        <strong>Time:</strong> ${args.time}<br/>
        <strong>Duration:</strong> ${args.durationMin} min<br/>
        <strong>Price:</strong> ${args.priceText}
      </p>

      <p>${btn(args.manageLink, "View booking")}</p>
    `
  );

  return safeSend({
    to: args.to,
    subject: `Confirmed: ${args.serviceName} on ${args.date} at ${args.time}`,
    html
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
      <p>Hope it went great with <strong>${args.businessName}</strong>.</p>
      <p>
        <strong>Service:</strong> ${args.serviceName}<br/>
        <strong>When:</strong> ${args.date} at ${args.time}
      </p>
      <p>${btn(args.reviewLink, "Leave a review")}</p>
      <p style="color:#64748b;font-size:14px">It takes 10 seconds and helps others find great services.</p>
    `
  );

  return safeSend({
    to: args.to,
    subject: `Leave a review for ${args.businessName}`,
    html
  });
}

