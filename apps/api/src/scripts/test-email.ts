import {
  sendBookingCreatedEmail,
} from "../services/email/email.service.js";

async function main() {
  await sendBookingCreatedEmail({
    customerName:
      "Demo Customer",

    customerEmail:
      "stratoshoxha25@gmail.com",

    barberName:
      "Demo Barber",

    serviceName:
      "Ανδρικό κούρεμα",

    startsAt:
      new Date(
        "2026-08-05T09:00:00.000Z",
      ),

    price: 15,
  });
}

main().catch((error) => {
  console.error(
    "Email test failed:",
    error,
  );

  process.exit(1);
});