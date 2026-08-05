import "./env.js";
import argon2 from "argon2";
import { prisma } from "../../src/lib/prisma.js";
import {
  createFutureAppointmentDateTime,
  createPasswordUserInput,
} from "../helpers/factories.js";

type PasswordUserInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

type TestUserRole = "CUSTOMER" | "BARBER" | "ADMIN";

export async function createPasswordUser(
  input: PasswordUserInput,
  role: TestUserRole = "CUSTOMER",
) {
  const passwordHash = await argon2.hash(
    input.password,
    { type: argon2.argon2id },
  );

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role,
    },
  });

  return {
    user,
    password: input.password,
  };
}

export async function cleanupAuthData(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return;
  }

  await prisma.session.deleteMany({
    where: { userId: user.id },
  });
  await prisma.authAccount.deleteMany({
    where: { userId: user.id },
  });
  await prisma.appointment.deleteMany({
    where: { customerId: user.id },
  });
  await prisma.user.delete({
    where: { id: user.id },
  });
}

export async function createAppointmentFixture(
  prefix = "appointment",
) {
  const input = createPasswordUserInput(prefix);
  const passwordHash = await argon2.hash(
    input.password,
    { type: argon2.argon2id },
  );
  const localStartsAt = createFutureAppointmentDateTime();
  const startsAt = localStartsAt.toUTC().toJSDate();
  const durationMinutes = 60;
  const endsAt = localStartsAt
    .plus({ minutes: durationMinutes })
    .toUTC()
    .toJSDate();
  const uniqueSuffix = input.email.split("@", 1)[0];

  if (!uniqueSuffix) {
    throw new Error("Unable to create unique appointment fixture data");
  }

  const fixture = await prisma.$transaction(async (tx) => {
    const customer = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "CUSTOMER",
      },
    });
    const barber = await tx.barber.create({
      data: {
        name: `Integration Barber ${uniqueSuffix}`,
        active: true,
      },
    });
    const service = await tx.service.create({
      data: {
        name: `Integration Service ${uniqueSuffix}`,
        durationMinutes,
        price: "24.50",
        active: true,
      },
    });

    await tx.barberService.create({
      data: {
        barberId: barber.id,
        serviceId: service.id,
      },
    });
    await tx.workingHours.create({
      data: {
        barberId: barber.id,
        dayOfWeek: localStartsAt.weekday % 7,
        startTime: "09:00",
        endTime: "17:00",
        active: true,
      },
    });

    return {
      customer,
      barber,
      service,
    };
  });

  const startsAtIso = localStartsAt.toISO();

  if (!startsAtIso) {
    throw new Error("Unable to serialize the appointment start time");
  }

  return {
    ...fixture,
    password: input.password,
    startsAt,
    endsAt,
    requestBody: {
      barberId: fixture.barber.id,
      serviceId: fixture.service.id,
      startsAt: startsAtIso,
      notes: "Phase 4 integration appointment",
    },
  };
}

type AppointmentFixture = Awaited<
  ReturnType<typeof createAppointmentFixture>
>;

export async function createPendingStripeAppointment(
  fixture: AppointmentFixture,
  stripeCheckoutSessionId: string,
) {
  return prisma.appointment.create({
    data: {
      customerId: fixture.customer.id,
      barberId: fixture.barber.id,
      serviceId: fixture.service.id,
      startsAt: fixture.startsAt,
      endsAt: fixture.endsAt,
      status: "PENDING",
      paymentMethod: "STRIPE",
      paymentStatus: "PENDING",
      priceAtBooking: fixture.service.price,
      stripeCheckoutSessionId,
      paymentExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
}

export async function cleanupAppointmentFixture(
  fixture: AppointmentFixture,
) {
  await prisma.$transaction([
    prisma.appointment.deleteMany({
      where: {
        OR: [
          { customerId: fixture.customer.id },
          { barberId: fixture.barber.id },
          { serviceId: fixture.service.id },
        ],
      },
    }),
    prisma.session.deleteMany({
      where: { userId: fixture.customer.id },
    }),
    prisma.authAccount.deleteMany({
      where: { userId: fixture.customer.id },
    }),
    prisma.timeOff.deleteMany({
      where: { barberId: fixture.barber.id },
    }),
    prisma.workingHours.deleteMany({
      where: { barberId: fixture.barber.id },
    }),
    prisma.barberService.deleteMany({
      where: {
        OR: [
          { barberId: fixture.barber.id },
          { serviceId: fixture.service.id },
        ],
      },
    }),
    prisma.service.deleteMany({
      where: { id: fixture.service.id },
    }),
    prisma.barber.deleteMany({
      where: { id: fixture.barber.id },
    }),
    prisma.user.deleteMany({
      where: { id: fixture.customer.id },
    }),
  ]);
}

export async function disconnectTestDatabase() {
  await prisma.$disconnect();
}

export { prisma };
