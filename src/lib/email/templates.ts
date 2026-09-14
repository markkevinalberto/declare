function layout(orgName: string, preheader: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:24px 28px 8px;">
                <div style="font-size:15px;font-weight:600;color:#08121F;">${orgName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;color:#27272a;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 20px;color:#a1a1aa;font-size:11px;">
                Sent via Declare
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string, color = "#245BFF") {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`;
}

export function orgInviteEmail(opts: {
  orgName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}) {
  return {
    subject: `You're invited to join ${opts.orgName} on Declare`,
    html: layout(
      opts.orgName,
      `${opts.inviterName} invited you to ${opts.orgName}`,
      `
      <p><strong>${opts.inviterName}</strong> invited you to join <strong>${opts.orgName}</strong> as a <strong>${opts.role}</strong>.</p>
      <p style="margin:24px 0;">${button(opts.acceptUrl, "Accept invite")}</p>
      <p style="color:#71717a;font-size:12px;">If you weren't expecting this, you can ignore this email.</p>
      `
    ),
  };
}

export function positionInviteEmail(opts: {
  orgName: string;
  volunteerName: string;
  serviceTitle: string;
  serviceDate: string;
  roleName: string;
  acceptUrl: string;
  declineUrl: string;
}) {
  return {
    subject: `You're scheduled: ${opts.roleName} for ${opts.serviceTitle}`,
    html: layout(
      opts.orgName,
      `Respond to your ${opts.serviceTitle} invitation`,
      `
      <p>Hi ${opts.volunteerName},</p>
      <p>You've been scheduled as <strong>${opts.roleName}</strong> for <strong>${opts.serviceTitle}</strong> on ${opts.serviceDate}.</p>
      <p style="margin:24px 0;">
        ${button(opts.acceptUrl, "Accept", "#16a34a")}
        &nbsp;&nbsp;
        ${button(opts.declineUrl, "Decline", "#dc2626")}
      </p>
      `
    ),
  };
}

export function positionResponseEmail(opts: {
  orgName: string;
  leaderName: string;
  volunteerName: string;
  serviceTitle: string;
  roleName: string;
  status: "accepted" | "declined";
  serviceUrl: string;
}) {
  const verb = opts.status === "accepted" ? "accepted" : "declined";
  return {
    subject: `${opts.volunteerName} ${verb} ${opts.roleName} — ${opts.serviceTitle}`,
    html: layout(
      opts.orgName,
      `${opts.volunteerName} ${verb} their invitation`,
      `
      <p>Hi ${opts.leaderName},</p>
      <p><strong>${opts.volunteerName}</strong> has <strong>${verb}</strong> the <strong>${opts.roleName}</strong> position for <strong>${opts.serviceTitle}</strong>.</p>
      <p style="margin:24px 0;">${button(opts.serviceUrl, "View service")}</p>
      `
    ),
  };
}

export function devotionalEmail(opts: {
  orgName: string;
  title: string;
  scriptureReference: string;
  scriptureText: string | null;
  reflection: string;
  reflectionQuestion: string | null;
  prayer: string | null;
}) {
  // Paragraphs are separated by blank lines (see the devotional library's
  // Reflection field) — split them out so each renders as its own <p>
  // instead of one run-on block, matching how a printed devotional reads.
  const reflectionHtml = opts.reflection
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 12px;">${p.trim()}</p>`)
    .join("");

  return {
    subject: `This week's devotional: ${opts.title}`,
    html: layout(
      opts.orgName,
      `${opts.title} — ${opts.scriptureReference}`,
      `
      <p style="font-size:17px;font-weight:600;margin:0 0 6px;">${opts.title}</p>
      <p style="color:#245BFF;font-weight:600;font-size:13px;margin:0 0 16px;">${opts.scriptureReference}</p>
      ${
        opts.scriptureText
          ? `<p style="font-style:italic;color:#3f3f46;border-left:3px solid #e4e4e7;padding-left:12px;margin:0 0 16px;white-space:pre-wrap;">${opts.scriptureText}</p>`
          : ""
      }
      ${reflectionHtml}
      ${
        opts.reflectionQuestion || opts.prayer
          ? `
      <div style="margin-top:20px;padding:16px;background:#f4f4f5;border-radius:10px;">
        <p style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;margin:0 0 10px;">Reflect &amp; Pray</p>
        ${opts.reflectionQuestion ? `<p style="margin:0 0 ${opts.prayer ? "10px" : "0"};">${opts.reflectionQuestion}</p>` : ""}
        ${opts.prayer ? `<p style="font-style:italic;color:#3f3f46;margin:0;">${opts.prayer}</p>` : ""}
      </div>`
          : ""
      }
      `
    ),
  };
}

export function reminderEmail(opts: {
  orgName: string;
  volunteerName: string;
  serviceTitle: string;
  serviceDate: string;
  roleName: string;
  daysAway: number;
  respondUrl: string;
  status: "invited" | "accepted";
}) {
  const heading =
    opts.status === "invited"
      ? `Please respond: ${opts.roleName} for ${opts.serviceTitle}`
      : `Reminder: you're serving ${opts.serviceTitle}`;
  return {
    subject: heading,
    html: layout(
      opts.orgName,
      heading,
      `
      <p>Hi ${opts.volunteerName},</p>
      <p>${
        opts.status === "invited"
          ? `You haven't responded yet to your invitation as <strong>${opts.roleName}</strong> for <strong>${opts.serviceTitle}</strong> on ${opts.serviceDate}, which is ${opts.daysAway} day${opts.daysAway === 1 ? "" : "s"} away.`
          : `Just a reminder that you're serving as <strong>${opts.roleName}</strong> for <strong>${opts.serviceTitle}</strong> on ${opts.serviceDate}, which is ${opts.daysAway} day${opts.daysAway === 1 ? "" : "s"} away.`
      }</p>
      <p style="margin:24px 0;">${button(opts.respondUrl, opts.status === "invited" ? "Respond now" : "View details")}</p>
      `
    ),
  };
}
