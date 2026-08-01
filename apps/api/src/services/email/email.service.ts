import { sendEmail } from "./email.provider.js";
import { bookingCancelledTemplate, bookingConfirmedTemplate, bookingCreatedTemplate, } from "./email.templates.js";
import type { AppointmentEmailData, } from "./email.types.js";

export async function sendBookingCreatedEmail( data: AppointmentEmailData,) {
  const email = bookingCreatedTemplate(data);

  return sendEmail({ to: data.customerEmail, ...email, });
}

export async function sendBookingConfirmedEmail( data: AppointmentEmailData, ) {
  const email =
    bookingConfirmedTemplate(data);

  return sendEmail({ to: data.customerEmail, ...email, });
}

export async function sendBookingCancelledEmail( data: AppointmentEmailData, ) {
  const email = bookingCancelledTemplate(data);

  return sendEmail({ to: data.customerEmail, ...email, });
}

export async function safelySendEmail( emailTask: () => Promise<unknown>, ) {
  try {
    await emailTask();
  } catch (error) {
    console.error(
      "Email delivery failed:",
      error,
    );
  }
}