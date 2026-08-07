import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(
        "[SMTP WARNING] SMTP credentials missing in .env. Skipping email dispatch.",
      );
      return;
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: `"${process.env.FROM_NAME || "Armory Game"}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[EMAIL ERROR]", error.message);
  }
};

// ============================================================
// Shared building blocks
// ============================================================

const BRAND = "Armory Game";
const FONT_FAMILY =
  "'Segoe UI',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif";
const GRADIENT = "linear-gradient(135deg,#6667DD 0%,#8B5CF6 60%,#A855F7 100%)";
const INK = "#101226";
const MUTED = "#4b5066";
const SUBTLE = "#8B93A7";
const BORDER = "#e7e8f5";

const heroSection = ({ badge, title, subtitle }) => `
  <!-- ===== HERO ===== -->
  <tr>
    <td class="hero-pad" style="background:${GRADIENT}; padding:44px 12px 36px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.18); border:1px solid rgba(255,255,255,0.35); border-radius:14px; padding:10px 16px;">
                  <span style="font-size:13px; font-weight:700; text-transform:uppercase; color:#ffffff;">
                    ${badge}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:22px;">
            <span class="hero-title" style="display:inline-block; color:#ffffff; font-size:32px; font-weight:800; line-height:1.25;">
              ${title}
            </span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:14px;">
            <span style="display:inline-block; color:rgba(255,255,255,0.92); font-size:15px; line-height:1.6;">
              ${subtitle}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

const prizeCard = ({ prize, prizeImageUrl }) => `
  <!-- ===== PRIZE CARD ===== -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px; background:linear-gradient(180deg,#ffffff,#f7f7ff); border:1px solid ${BORDER}; border-radius:16px; overflow:hidden;">
    <tr>
      <td align="center" style="padding:24px 24px 6px 24px;">
        ${prizeImageUrl ? `
        <img src="${prizeImageUrl}" alt="${prize}" width="180" style="width:180px; max-width:100%; height:auto; border-radius:14px; box-shadow:0 10px 24px rgba(23,25,66,0.18);" />` : `
        <span style="display:inline-block; width:72px; height:72px; line-height:72px; border-radius:20px; background:${GRADIENT}; color:#ffffff; font-size:24px; font-weight:800; text-align:center;">AG</span>`}
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:16px 24px 8px 24px;">
        <span style="display:inline-block; color:${SUBTLE}; font-size:11px; font-weight:700; text-transform:uppercase;">Featured Prize</span>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:2px 24px 22px 24px;">
        <span style="color:${INK}; font-size:24px; font-weight:800;">${prize}</span>
      </td>
    </tr>
  </table>
`;

const statsRow = ({ left, right }) => `
  <!-- ===== STATS ===== -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
    <tr>
      <td class="stat-cell stat-first" style="width:50%; padding:0 7px 0 0; vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4fd; border:1px solid ${BORDER}; border-radius:14px;">
          <tr>
            <td style="padding:18px 20px;">
              <span style="display:block; color:${SUBTLE}; font-size:11px; font-weight:700; text-transform:uppercase;">${left.label}</span>
              <span style="display:block; margin-top:6px; color:${left.valueColor || INK}; font-size:22px; font-weight:800; word-break:break-word;">${left.value}</span>
            </td>
          </tr>
        </table>
      </td>
      <td class="stat-cell stat-second" style="width:50%; padding:0 0 0 7px; vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4fd; border:1px solid ${BORDER}; border-radius:14px;">
          <tr>
            <td style="padding:18px 20px;">
              <span style="display:block; color:${SUBTLE}; font-size:11px; font-weight:700; text-transform:uppercase;">${right.label}</span>
              <span style="display:block; margin-top:6px; color:${right.valueColor || "#7C3AED"}; font-size:22px; font-weight:800; word-break:break-word;">${right.value}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const ctaSection = ({ label, href, note }) => `
  <!-- ===== CTA ===== -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:${GRADIENT}; border-radius:14px; box-shadow:0 12px 30px rgba(102,103,221,0.4);">
              <a class="btn" href="${href}" target="_blank" style="display:inline-block; color:#ffffff !important; font-size:16px; font-weight:700; padding:16px 44px;">${label}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-top:14px;">
        <span style="display:inline-block; color:${SUBTLE}; font-size:12px; line-height:1.6;">
          ${note}
        </span>
      </td>
    </tr>
  </table>
`;

const footerSection = ({ link }) => `
  <!-- ===== FOOTER ===== -->
  <tr>
    <td class="footer-pad" style="background:#0f1422; padding:30px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${GRADIENT}; border-radius:9px; width:18px; height:18px; text-align:center; vertical-align:middle;">
                  <span style="color:#ffffff; font-size:11px; font-weight:800; line-height:18px;">AG</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:12px;">
            <span style="color:#ffffff; font-size:15px; font-weight:700;">${BRAND}</span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:16px;">
            <a href="${link}" style="color:#8B93A7; font-size:12px; text-decoration:underline; word-break:break-all;">
              ${link}
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:6px;">
            <span style="color:#5c6374; font-size:12px;">
              If the button above doesn&rsquo;t work, copy and paste this link into your browser.
            </span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:18px; border-top:1px solid rgba(255,255,255,0.08); margin-top:18px;">
            <span style="color:#5c6374; font-size:11px;">
              &copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

const emailShell = ({ contentRows }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${BRAND}</title>
    <style>
      body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
      img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      a { text-decoration: none; }
      @media only screen and (max-width: 620px) {
        .container { width: 100% !important; }
        .hero-pad { padding: 34px 12px 30px 12px !important; }
        .body-pad { padding: 30px 24px !important; }
        .footer-pad { padding: 28px 24px !important; }
        .hero-title { font-size: 26px !important; }
        .btn { padding: 15px 30px !important; }
        .stat-cell { display: block !important; width: 100% !important; }
        .stat-first { padding: 0 0 12px 0 !important; }
        .stat-second { padding: 0 !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#eef0f9; font-family:${FONT_FAMILY};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f9; padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 18px 50px rgba(23,25,66,0.14);">
            ${contentRows}
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

// ============================================================
// New game email
// ============================================================

export const buildNewGameEmailTemplate = ({
  recipientName,
  gameTitle,
  prize,
  totalSeats,
  gameLink,
  prizeImageUrl,
}) => {
  const greeting = recipientName || "Player";

  return emailShell({
    contentRows: `
      ${heroSection({
        badge: "New Game Alert",
        title: "A new game<br>just opened its seats",
        subtitle: gameTitle,
      })}

      <!-- ===== BODY ===== -->
      <tr>
        <td class="body-pad" style="padding:36px 20px;">
          <p style="margin:0 0 10px 0; color:${INK}; font-size:17px; font-weight:600;">
            Hello, ${greeting}
          </p>
          <p style="margin:0; color:${MUTED}; font-size:15px; line-height:1.7;">
            A brand-new game is live and open for registration. Secure your seat now &mdash; once the
            draw closes, every reserved seat gets a fair shot at the prize.
          </p>

          ${prizeCard({ prize, prizeImageUrl })}

          ${statsRow({
            left: { label: "Total Seats", value: totalSeats },
            right: { label: "Prize Value", value: prize, valueColor: "#7C3AED" },
          })}

          ${ctaSection({
            label: "Join Game Now",
            href: gameLink,
            note: "Seats fill fast &mdash; one seat per player.",
          })}
        </td>
      </tr>

      ${footerSection({ link: gameLink })}
    `,
  });
};

// ============================================================
// Game ended email (winners not yet announced)
// ============================================================

export const buildGameEndedEmailTemplate = ({
  recipientName,
  gameTitle,
  prize,
  totalSeats,
  gameLink,
  prizeImageUrl,
}) => {
  const greeting = recipientName || "Player";

  return emailShell({
    contentRows: `
      ${heroSection({
        badge: "Game Ended",
        title: "The draw has ended",
        subtitle: gameTitle,
      })}

      <!-- ===== BODY ===== -->
      <tr>
        <td class="body-pad" style="padding:36px 20px;">
          <p style="margin:0 0 10px 0; color:${INK}; font-size:17px; font-weight:600;">
            Hello, ${greeting}
          </p>
          <p style="margin:0; color:${MUTED}; font-size:15px; line-height:1.7;">
            &ldquo;${gameTitle}&rdquo; has ended and is no longer accepting seat
            registrations. The winning seats are being announced shortly &mdash; keep
            an eye on the game page for the results.
          </p>

          ${prizeCard({ prize, prizeImageUrl })}

          ${statsRow({
            left: { label: "Total Seats", value: totalSeats },
            right: { label: "Prize Value", value: prize, valueColor: "#7C3AED" },
          })}

          ${ctaSection({
            label: "View Game Page",
            href: gameLink,
            note: "Winners will be announced on this page soon.",
          })}
        </td>
      </tr>

      ${footerSection({ link: gameLink })}
    `,
  });
};

// ============================================================
// Game finished / winners email
// ============================================================

export const buildGameFinishedEmailTemplate = ({
  recipientName,
  isWinner,
  gameTitle,
  prize,
  mySeatNumber,
  winners,
  gameLink,
  prizeImageUrl,
}) => {
  const greeting = recipientName || "Player";

  const body = isWinner
    ? `
      <p style="margin:0 0 10px 0; color:${INK}; font-size:17px; font-weight:600;">
        Hello, ${greeting}
      </p>
      <p style="margin:0; color:${MUTED}; font-size:15px; line-height:1.7;">
        Great news &mdash; your seat <strong style="color:${INK};">#${mySeatNumber}</strong> in
        &ldquo;${gameTitle}&rdquo; has been drawn as a winner! Your prize is waiting for you.
      </p>

      ${prizeCard({ prize, prizeImageUrl })}

      ${statsRow({
        left: { label: "Your Seat", value: `#${mySeatNumber}` },
        right: { label: "Prize Value", value: prize, valueColor: "#7C3AED" },
      })}

      ${ctaSection({
        label: "View Your Win",
        href: gameLink,
        note: "Reach out to the admin to claim your prize.",
      })}
    `
    : `
      <p style="margin:0 0 10px 0; color:${INK}; font-size:17px; font-weight:600;">
        Hello, ${greeting}
      </p>
      <p style="margin:0; color:${MUTED}; font-size:15px; line-height:1.7;">
        The draw for &ldquo;${gameTitle}&rdquo; has concluded. Check out who took home the prize &mdash;
        you can still view the full results on the game page.
      </p>

      ${prizeCard({ prize, prizeImageUrl })}

      ${statsRow({
        left: { label: "Winner", value: winners || "&mdash;" },
        right: { label: "Prize Value", value: prize, valueColor: "#7C3AED" },
      })}

      ${ctaSection({
        label: "View Game Page",
        href: gameLink,
        note: "Better luck next time &mdash; new draws open regularly.",
      })}
    `;

  return emailShell({
    contentRows: `
      ${heroSection({
        badge: isWinner ? "You Won" : "Game Finished",
        title: isWinner
          ? `Congratulations, ${greeting}!`
          : "Results Are In",
        subtitle: gameTitle,
      })}

      <!-- ===== BODY ===== -->
      <tr>
        <td class="body-pad" style="padding:36px 40px;">
          ${body}
        </td>
      </tr>

      ${footerSection({ link: gameLink })}
    `,
  });
};
