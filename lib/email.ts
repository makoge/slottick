import { Resend } from "resend";

type EmailLocale = "en" | "fr";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const FROM_FALLBACK = process.env.RESEND_FROM || "onboarding@resend.dev";
const FROM = process.env.SLOTTA_FROM || `Slottick <${FROM_FALLBACK}>`;
const REPLY_TO = process.env.SLOTTA_REPLY_TO || undefined;
const OWNER_NOTIFY_EMAIL = process.env.OWNER_NOTIFY_EMAIL || "";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  scheduledAt?: string;
};

function pickLocale(locale?: string): EmailLocale {
  return locale === "fr" ? "fr" : "en";
}

const copy = {
  en: {
    powered: "Powered by Slottick",
    verifyTitle: "Verify your email",
    verifyBody: "Click below to verify your Slottick account.",
    verifyBtn: "Verify email",
    expires30: "This link expires in 30 minutes.",
    verifySubject: "Verify your Slottick email",

    resetTitle: "Reset your password",
    resetBody: "You requested a password reset for Slottick.",
    resetBtn: "Reset password",
    resetIgnore: "If you didn’t request this, ignore this email.",
    resetSubject: "Reset your Slottick password",

    confirmedTitle: "Appointment confirmed ✅",
    service: "Service",
    date: "Date",
    time: "Time",
    duration: "Duration",
    price: "Price",
    viewBooking: "View booking",
    confirmedSubject: "Confirmed",

    reviewTitle: "How was your appointment?",
    reviewIntro: "Hope it went great with",
    when: "When",
    reviewBtn: "Leave a review",
    reviewHint: "It takes 10 seconds and helps others find great services.",
    reviewSubject: "Leave a review for",

    welcomeTitle: "Your Slottick account has been created successfully 👋",
    welcomeIntro: "Welcome, and congrats on setting up",
    nextSteps: "Next steps:",
    addServices: "Add your services",
    setAvailability: "Set your availability",
    shareLink: "Share your booking link",
    dashboardBtn: "Open your dashboard",
    welcomeFooter: "If you need help, just reply to this email.",
    welcomeSubject: "Welcome to Slottick",

    signupTitle: "New business signup 🎉",
    business: "Business",
    ownerEmail: "Owner email",
    slug: "Slug",
    created: "Created",
    signupSubject: "New signup",

    contactTitle: "New contact message ✉️",
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    contactSubject: "Contact",
  },
  fr: {
    powered: "Propulsé par Slottick",
    verifyTitle: "Vérifiez votre e-mail",
    verifyBody: "Cliquez ci-dessous pour vérifier votre compte Slottick.",
    verifyBtn: "Vérifier l’e-mail",
    expires30: "Ce lien expire dans 30 minutes.",
    verifySubject: "Vérifiez votre e-mail Slottick",

    resetTitle: "Réinitialiser votre mot de passe",
    resetBody: "Vous avez demandé une réinitialisation du mot de passe pour Slottick.",
    resetBtn: "Réinitialiser le mot de passe",
    resetIgnore: "Si vous n’avez pas demandé cela, ignorez cet e-mail.",
    resetSubject: "Réinitialiser votre mot de passe Slottick",

    confirmedTitle: "Rendez-vous confirmé ✅",
    service: "Service",
    date: "Date",
    time: "Heure",
    duration: "Durée",
    price: "Prix",
    viewBooking: "Voir la réservation",
    confirmedSubject: "Confirmé",

    reviewTitle: "Comment s’est passé votre rendez-vous ?",
    reviewIntro: "Nous espérons que tout s’est bien passé avec",
    when: "Quand",
    reviewBtn: "Laisser un avis",
    reviewHint: "Cela prend 10 secondes et aide d’autres personnes à trouver de bons services.",
    reviewSubject: "Laisser un avis pour",

    welcomeTitle: "Votre compte Slottick a été créé avec succès 👋",
    welcomeIntro: "Bienvenue, et félicitations pour la création de",
    nextSteps: "Prochaines étapes :",
    addServices: "Ajoutez vos services",
    setAvailability: "Définissez vos disponibilités",
    shareLink: "Partagez votre lien de réservation",
    dashboardBtn: "Ouvrir votre tableau de bord",
    welcomeFooter: "Si vous avez besoin d’aide, répondez simplement à cet e-mail.",
    welcomeSubject: "Bienvenue sur Slottick",

    signupTitle: "Nouvelle inscription business 🎉",
    business: "Business",
    ownerEmail: "E-mail du propriétaire",
    slug: "Slug",
    created: "Créé",
    signupSubject: "Nouvelle inscription",

    contactTitle: "Nouveau message de contact ✉️",
    name: "Nom",
    email: "E-mail",
    subject: "Sujet",
    message: "Message",
    contactSubject: "Contact",
  },
} as const;

async function safeSend({ to, subject, html, replyTo, scheduledAt }: SendArgs) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing; skipping email:", { to, subject });
    return { skipped: true };
  }

  try {
    const cleanHtml = html.trim();
    const text = cleanHtml
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
      html: cleanHtml,
      text,
      replyTo: replyTo ?? REPLY_TO,
      scheduledAt,
    });
  } catch (err) {
    console.error("[email] send failed:", err);
    return { error: true };
  }
}

function escapeHtml(s: string) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function btn(href: string, text: string) {
  return `<a href="${href}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">${escapeHtml(text)}</a>`;
}

function normalizeHtmlBody(input: string) {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("<")
    ? trimmed
    : `<p>${escapeHtml(trimmed).replaceAll("\n", "<br/>")}</p>`;
}

function wrap(title: string, bodyHtml: string, footer: string) {
  return `
  <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;background:#0f172a;color:#fff;">
              <div style="font-size:13px;opacity:0.8;">Slottick</div>
              <div style="font-size:24px;font-weight:700;margin-top:6px;">${escapeHtml(title)}</div>
            </td>
          </tr>
          <tr><td style="padding:24px;">${bodyHtml}</td></tr>
          <tr>
            <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
              ${escapeHtml(footer)}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

export async function sendVerifyEmail(args: { to: string; verifyLink: string; locale?: string }) {
  const t = copy[pickLocale(args.locale)];
  const html = wrap(
    t.verifyTitle,
    `<p>${t.verifyBody}</p><p>${btn(args.verifyLink, t.verifyBtn)}</p><p style="color:#64748b;font-size:14px">${t.expires30}</p>`,
    t.powered
  );

  return safeSend({ to: args.to, subject: t.verifySubject, html });
}

export async function sendResetPasswordEmail(args: { to: string; resetLink: string; locale?: string }) {
  const t = copy[pickLocale(args.locale)];
  const html = wrap(
    t.resetTitle,
    `<p>${t.resetBody}</p><p>${btn(args.resetLink, t.resetBtn)}</p><p style="color:#64748b;font-size:14px">${t.expires30}</p><p style="color:#64748b;font-size:14px">${t.resetIgnore}</p>`,
    t.powered
  );

  return safeSend({ to: args.to, subject: t.resetSubject, html });
}

export async function sendBookingConfirmationEmail(args: {
  to: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  durationMin: number;
  priceText: string;
  manageLink: string;
  chatLink?: string;
  locale?: string;
}) {
  const t = copy[pickLocale(args.locale)];
  const html = wrap(
    t.confirmedTitle,
    `
      <p><strong>${escapeHtml(args.businessName)}</strong></p>
      <p>
        <strong>${t.service}:</strong> ${escapeHtml(args.serviceName)}<br/>
        <strong>${t.date}:</strong> ${escapeHtml(args.date)}<br/>
        <strong>${t.time}:</strong> ${escapeHtml(args.time)}<br/>
        <strong>${t.duration}:</strong> ${args.durationMin} min<br/>
        <strong>${t.price}:</strong> ${escapeHtml(args.priceText)}
      </p>
      <p>${btn(args.manageLink, t.viewBooking)}</p>
      ${args.chatLink ? `<p>${btn(args.chatLink, "Open booking chat")}</p>` : ""}
    `,
    t.powered
  );

  return safeSend({
    to: args.to,
    subject: `${t.confirmedSubject}: ${args.serviceName} - ${args.date} ${args.time}`,
    html,
  });
}

export async function sendReviewRequestEmail(args: {
  to: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  reviewLink: string;
  locale?: string;
}) {
  const t = copy[pickLocale(args.locale)];
  const html = wrap(
    t.reviewTitle,
    `
      <p>${t.reviewIntro} <strong>${escapeHtml(args.businessName)}</strong>.</p>
      <p><strong>${t.service}:</strong> ${escapeHtml(args.serviceName)}<br/>
      <strong>${t.when}:</strong> ${escapeHtml(args.date)} ${escapeHtml(args.time)}</p>
      <p>${btn(args.reviewLink, t.reviewBtn)}</p>
      <p style="color:#64748b;font-size:14px">${t.reviewHint}</p>
    `,
    t.powered
  );

  return safeSend({
    to: args.to,
    subject: `${t.reviewSubject} ${args.businessName}`,
    html,
  });
}

export async function sendWelcomeOwnerEmail(args: {
  to: string;
  businessName: string;
  dashboardLink: string;
  locale?: string;
}) {
  const t = copy[pickLocale(args.locale)];
  const html = wrap(
    t.welcomeTitle,
    `
      <p>${t.welcomeIntro} <strong>${escapeHtml(args.businessName)}</strong>.</p>
      <p>${t.nextSteps}</p>
      <ul>
        <li>${t.addServices}</li>
        <li>${t.setAvailability}</li>
        <li>${t.shareLink}</li>
      </ul>
      <p>${btn(args.dashboardLink, t.dashboardBtn)}</p>
    `,
    t.welcomeFooter
  );

  return safeSend({
    to: args.to,
    subject: `${t.welcomeSubject}, ${args.businessName}!`,
    html,
  });
}

export async function notifyOwnerNewSignup(args: {
  ownerEmail: string;
  businessName: string;
  slug: string;
  createdAt?: string;
  locale?: string;
}) {
  if (!OWNER_NOTIFY_EMAIL) return { skipped: true };

  const t = copy[pickLocale(args.locale)];
  const html = wrap(
    t.signupTitle,
    `
      <p><strong>${t.business}:</strong> ${escapeHtml(args.businessName)}</p>
      <p><strong>${t.ownerEmail}:</strong> ${escapeHtml(args.ownerEmail)}</p>
      <p><strong>${t.slug}:</strong> ${escapeHtml(args.slug)}</p>
      ${args.createdAt ? `<p><strong>${t.created}:</strong> ${escapeHtml(args.createdAt)}</p>` : ""}
    `,
    t.powered
  );

  return safeSend({
    to: OWNER_NOTIFY_EMAIL,
    subject: `${t.signupSubject}: ${args.businessName}`,
    html,
  });
}

export async function notifyOwnerContactMessage(args: {
  name: string;
  email: string;
  subject: string;
  message: string;
  meta?: { ip?: string; userAgent?: string; sentAt?: string };
  locale?: string;
}) {
  if (!OWNER_NOTIFY_EMAIL) return { skipped: true };

  const t = copy[pickLocale(args.locale)];
  const html = wrap(
    t.contactTitle,
    `
      <p><strong>${t.name}:</strong> ${escapeHtml(args.name)}</p>
      <p><strong>${t.email}:</strong> ${escapeHtml(args.email)}</p>
      <p><strong>${t.subject}:</strong> ${escapeHtml(args.subject)}</p>
      <p><strong>${t.message}:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;background:#f8fafc;padding:12px;border-radius:10px;border:1px solid #e2e8f0">${escapeHtml(args.message)}</pre>
    `,
    t.powered
  );

  return safeSend({
    to: OWNER_NOTIFY_EMAIL,
    subject: `${t.contactSubject}: ${args.subject}`,
    html,
    replyTo: args.email,
  });
}

export async function sendClientFollowUpEmail(args: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  footer?: string;
  scheduledAt?: string;
  locale?: string;
}) {
  const t = copy[pickLocale(args.locale)];
  const to = String(args.to ?? "").trim();
  const subject = String(args.subject ?? "").trim();
  const html = String(args.html ?? "");
  const scheduledAt = args.scheduledAt ? String(args.scheduledAt).trim() : undefined;

  if (!to || !subject || !html) return { ok: false, error: "Missing fields" };

  const wrapped = wrap(
    subject,
    normalizeHtmlBody(html),
    args.footer ?? t.powered
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