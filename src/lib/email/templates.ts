function layout(preheader: string, bodyHtml: string) {
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
                <div style="font-size:15px;font-weight:600;color:#08121F;">Declare</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;color:#27272a;font-size:14px;line-height:1.6;">
                ${bodyHtml}
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
      `${opts.volunteerName} ${verb} their invitation`,
      `
      <p>Hi ${opts.leaderName},</p>
      <p><strong>${opts.volunteerName}</strong> has <strong>${verb}</strong> the <strong>${opts.roleName}</strong> position for <strong>${opts.serviceTitle}</strong>.</p>
      <p style="margin:24px 0;">${button(opts.serviceUrl, "View service")}</p>
      `
    ),
  };
}

export function reminderEmail(opts: {
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
