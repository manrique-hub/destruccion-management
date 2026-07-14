import nodemailer from "nodemailer";

let transporterPromise = null;

function isEnabled() {
  return String(process.env.EMAIL_ENABLED || "false").toLowerCase() === "true";
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP no configurado: faltan SMTP_HOST/SMTP_USER/SMTP_PASS");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(createTransporter());
  }
  return transporterPromise;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!isEnabled()) return { sent: false, reason: "EMAIL_ENABLED=false" };

  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return { sent: false, reason: "Sin destinatarios" };

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = await getTransporter();

  await transporter.sendMail({
    from,
    to: recipients.join(", "),
    subject,
    text,
    html,
  });

  return { sent: true, recipients };
}

export async function sendTemplatedEmail({ to, title, message, ctaLabel, ctaUrl }) {
  const subject = title;
  const text = `${title}\n\n${message}${ctaUrl ? `\n\n${ctaLabel || "Ver"}: ${ctaUrl}` : ""}`;
  const html = `
  <div style="font-family:Segoe UI,Arial,sans-serif;background:#f4f7fb;padding:24px;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:14px;overflow:hidden;">
      <div style="padding:18px 22px;background:#0f172a;color:#ffffff;">
        <h2 style="margin:0;font-size:20px;">${title}</h2>
      </div>
      <div style="padding:22px;color:#1f2937;font-size:14px;line-height:1.6;">
        <p style="margin-top:0;">${message}</p>
        ${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:10px;padding:10px 14px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;">${ctaLabel || "Ver detalle"}</a>` : ""}
      </div>
    </div>
  </div>`;

  return sendEmail({ to, subject, text, html });
}
