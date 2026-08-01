import { DateTime } from "luxon";

import type { AppointmentEmailData, EmailContent, } from "./email.types.js";

const timeZone = process.env.BARBERSHOP_TIME_ZONE ?? "Europe/Athens";

const currencyFormatter = new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR", });

function formatAppointmentDate( startsAt: Date,) {
    const data = DateTime.fromJSDate(startsAt, { zone: "utc", }).setZone(timeZone);

    return {
        date: data.toFormat("dd/LL/yyyy"),
        time: data.toFormat("HH:mm")
    }
}

function escapeHtml( value: string,) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function emailLayout({ title, content, }: { title: string; content: string;}) {
      return `
        <!doctype html>
        <html lang="el">
            <head>
                <meta charset="utf-8" />
                <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
                />
            </head>

            <body
                style="
                margin: 0;
                padding: 32px 16px;
                background: #f8fafc;
                color: #0f172a;
                font-family: Arial, sans-serif;
                "
            >
                <div
                    style="
                        max-width: 600px;
                        margin: 0 auto;
                        overflow: hidden;
                        border: 1px solid #e2e8f0;
                        border-radius: 20px;
                        background: #ffffff;
                    "
                    >
                    <div
                        style="
                        padding: 24px;
                        background: #0f172a;
                        color: #ffffff;
                        "
                    >
                    <div
                    style="
                        margin-bottom: 8px;
                        color: #f97316;
                        font-size: 14px;
                        font-weight: 700;
                    ">
                        OraGiaKourema.
                    </div>

                    <h1
                    style="
                        margin: 0;
                        font-size: 26px;
                        line-height: 1.3;
                    "
                    >
                        ${title}
                    </h1>
                </div>

                <div
                    style="
                    padding: 24px;
                    font-size: 15px;
                    line-height: 1.7;
                    "
                >
                    ${content}
                </div>

                <div
                    style="
                    padding: 18px 24px;
                    border-top: 1px solid #e2e8f0;
                    color: #64748b;
                    font-size: 12px;
                    "
                >
                    Αυτό είναι αυτοματοποιημένο μήνυμα από το OraGiaKourema.
                </div>
                </div>
            </body>
        </html>
    `;
}

function appointmentDetailsHtml( data: AppointmentEmailData, ) {
    const { date, time } = formatAppointmentDate( data.startsAt, );

    return `
        <div
        style="
            margin: 20px 0;
            padding: 18px;
            border-radius: 14px;
            background: #f8fafc;
        "
        >
        <p style="margin: 0 0 8px">
            <strong>Υπηρεσία:</strong>
            ${escapeHtml(data.serviceName)}
        </p>

        <p style="margin: 0 0 8px">
            <strong>Barber:</strong>
            ${escapeHtml(data.barberName)}
        </p>

        <p style="margin: 0 0 8px">
            <strong>Ημερομηνία:</strong>
            ${date}
        </p>

        <p style="margin: 0 0 8px">
            <strong>Ώρα:</strong>
            ${time}
        </p>

        <p style="margin: 0">
            <strong>Τιμή:</strong>
            ${currencyFormatter.format(
            data.price,
            )}
        </p>
        </div>
    `;
}

function appointmentDetailsText( data: AppointmentEmailData, ) {
  const { date, time } = formatAppointmentDate( data.startsAt, );

  return [
    `Υπηρεσία: ${data.serviceName}`,
    `Barber: ${data.barberName}`,
    `Ημερομηνία: ${date}`,
    `Ώρα: ${time}`,
    `Τιμή: ${currencyFormatter.format(
      data.price,
    )}`,
  ].join("\n");
}

export function bookingCreatedTemplate( data: AppointmentEmailData, ): EmailContent { 
     const customerName = escapeHtml(data.customerName);

     return {
        subject: "Το ραντεβού σου καταχωρίστηκε",

        text: [ `Γεια σου ${data.customerName},`, "", "Το ραντεβού σου καταχωρίστηκε και βρίσκεται σε αναμονή επιβεβαίωσης.",
        "", appointmentDetailsText(data),].join("\n"),

        html: emailLayout({
        title:
            "Το ραντεβού σου καταχωρίστηκε",

        content: `
            <p>
            Γεια σου ${customerName},
            </p>

            <p>
            Το ραντεβού σου καταχωρίστηκε και βρίσκεται
            σε αναμονή επιβεβαίωσης.
            </p>

            ${appointmentDetailsHtml(data)}
        `,
        }),
    };
}

export function bookingConfirmedTemplate( data: AppointmentEmailData, ): EmailContent {
  const customerName = escapeHtml(data.customerName);

  return {
    subject:
      "Το ραντεβού σου επιβεβαιώθηκε",

    text: [
      `Γεια σου ${data.customerName},`,
      "",
      "Το ραντεβού σου επιβεβαιώθηκε.",
      "",
      appointmentDetailsText(data),
    ].join("\n"),

    html: emailLayout({
      title:
        "Το ραντεβού σου επιβεβαιώθηκε",

      content: `
        <p>
          Γεια σου ${customerName},
        </p>

        <p>
          Το ραντεβού σου επιβεβαιώθηκε.
        </p>

        ${appointmentDetailsHtml(data)}
      `,
    }),
  };
}

export function bookingCancelledTemplate( data: AppointmentEmailData, ): EmailContent {
  const customerName = escapeHtml(data.customerName);

  const cancellationReason = data.cancellationReason?.trim() || "Δεν δόθηκε αιτιολογία.";

  return {
    subject:
      "Το ραντεβού σου ακυρώθηκε",

    text: [
      `Γεια σου ${data.customerName},`,
      "",
      "Το ραντεβού σου ακυρώθηκε.",
      "",
      appointmentDetailsText(data),
      "",
      `Αιτιολογία: ${cancellationReason}`,
    ].join("\n"),

    html: emailLayout({
      title:
        "Το ραντεβού σου ακυρώθηκε",

      content: `
        <p>
          Γεια σου ${customerName},
        </p>

        <p>
          Το ραντεβού σου ακυρώθηκε.
        </p>

        ${appointmentDetailsHtml(data)}

        <div
          style="
            padding: 16px;
            border: 1px solid #fecaca;
            border-radius: 12px;
            background: #fef2f2;
            color: #b91c1c;
          "
        >
          <strong>Αιτιολογία:</strong>
          ${escapeHtml(
            cancellationReason,
          )}
        </div>
      `,
    }),
  };
}