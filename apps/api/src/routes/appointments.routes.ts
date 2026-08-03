import { DateTime } from "luxon";
import { Router } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { AppointmentConflictError, AppointmentValidationError,} from "../errors/appointment.errors.js";
import { prisma } from "../lib/prisma.js";
import { cancelAppointmentParamsSchema, createAppointmentSchema,} from "../schemas/appointment.schema.js";
import { createZonedDateTime, isAlignedToSlotInterval, SLOT_INTERVAL_MINUTES,} from "../utils/availability.js";
import { BOOKING_WINDOW_DAYS } from "../constants/auth.constants.js";
import { safelySendEmail, sendBookingCreatedEmail, sendBookingCancelledEmail,} from "../services/email/email.service.js";

import { requireAuth } from "../middleware/auth.middleware.js";

export const appointmentsRouter = Router();

const MAX_TRANSACTION_RETRIES = 3;

const appointmentSelect = {
  id: true,
  startsAt: true,
  endsAt: true,
  status: true,
  notes: true,
  createdAt: true,

  cancelledAt: true,
  cancelledBy: true,
  cancellationReason: true,

  barber: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },

  service: {
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      price: true,
    },
  },
} satisfies Prisma.AppointmentSelect;


type AppointmentResult = Prisma.AppointmentGetPayload<{
  select: typeof appointmentSelect;
}>;

function formatAppointment( appointment: AppointmentResult, ) {
  const timeZone =
    process.env.BARBERSHOP_TIME_ZONE ?? "Europe/Athens";

  const localStartsAt = DateTime.fromJSDate(
    appointment.startsAt,
    {
      zone: "utc",
    },
  )
    .setZone(timeZone)
    .toISO();

  const localEndsAt = DateTime.fromJSDate(
    appointment.endsAt,
    {
      zone: "utc",
    },
  )
    .setZone(timeZone)
    .toISO();

  return {
    ...appointment,

    service: {
      ...appointment.service,
      price: Number(appointment.service.price),
    },

    localStartsAt,
    localEndsAt,
    timeZone,
  };
}

appointmentsRouter.get("/me", requireAuth, async (req, res) => {
    try {
      const appointments =
        await prisma.appointment.findMany({
          where: {
            customerId: req.user!.id,
          },

          orderBy: {
            startsAt: "desc",
          },

          select: appointmentSelect,
        });

      const now = new Date();

      const formattedAppointments =
        appointments.map(formatAppointment);

      const upcoming = formattedAppointments
        .filter(
          (appointment) =>
            appointment.startsAt >= now &&
            appointment.status !== "CANCELLED" &&
            appointment.status !== "COMPLETED" &&
            appointment.status !== "NO_SHOW",
        )
        .sort(
          (first, second) =>
            first.startsAt.getTime() -
            second.startsAt.getTime(),
        );

      const history = formattedAppointments
        .filter(
          (appointment) =>
            appointment.startsAt < now ||
            appointment.status === "CANCELLED" ||
            appointment.status === "COMPLETED" ||
            appointment.status === "NO_SHOW",
        )
        .sort(
          (first, second) =>
            second.startsAt.getTime() -
            first.startsAt.getTime(),
        );

      res.status(200).json({
        data: {
          upcoming,
          history,
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve customer appointments:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve appointments",
      });
    }
  },
);

appointmentsRouter.patch("/:appointmentId/cancel", requireAuth, async (req, res) => {
    const parsedParams = cancelAppointmentParamsSchema.safeParse( req.params, );

    if (!parsedParams.success) {
      res.status(400).json({
        message: "Invalid appointment id",
        errors:
          parsedParams.error.flatten().fieldErrors,
      });

      return;
    }

    const { appointmentId } = parsedParams.data;

    try {
      const existingAppointment =
        await prisma.appointment.findFirst({
          where: {
            id: appointmentId,
            customerId: req.user!.id,
          },

          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
            notes: true,
            createdAt: true,

            cancelledAt: true,
            cancelledBy: true,
            cancellationReason: true,

            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            barber: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },

            service: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
                price: true,
              },
            },
          },
        });

      if (!existingAppointment) {
        res.status(404).json({
          message: "Appointment not found",
        });

        return;
      }

      if (
        existingAppointment.status === "CANCELLED"
      ) {
        res.status(409).json({
          message:
            "Appointment is already cancelled",
        });

        return;
      }

      if (
        existingAppointment.status === "COMPLETED" ||
        existingAppointment.status === "NO_SHOW"
      ) {
        res.status(409).json({
          message:
            "This appointment can no longer be cancelled",
        });

        return;
      }

      const now = new Date();

      if (existingAppointment.startsAt <= now) {
        res.status(409).json({
          message:
            "Past appointments cannot be cancelled",
        });

        return;
      }

      const cancellationDeadline =
        new Date(
          existingAppointment.startsAt.getTime() -
            2 * 60 * 60 * 1000,
        );

      if (now > cancellationDeadline) {
        res.status(409).json({
          message:
            "Appointments must be cancelled at least 2 hours in advance",
        });

        return;
      }

      const cancelledAppointment = await prisma.appointment.update({
          where: {
            id: existingAppointment.id,
          },

          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelledBy: "CUSTOMER",
            cancellationReason: "Cancelled by customer",
          },

          select: appointmentSelect,
      });

      
      await safelySendEmail(() =>
        sendBookingCancelledEmail({
          customerName:
            existingAppointment.customer.name,

          customerEmail:
            existingAppointment.customer.email,

          barberName:
            cancelledAppointment.barber.name,

          serviceName:
            cancelledAppointment.service.name,

          startsAt:
            cancelledAppointment.startsAt,

          price:
            Number(
              cancelledAppointment.service.price,
            ),

          cancellationReason:
            cancelledAppointment.cancellationReason,
        }),
      );

      res.status(200).json({
        message:
          "Appointment cancelled successfully",

        data: formatAppointment(
          cancelledAppointment,
        ),
      });
    } catch (error) {
      console.error(
        "Failed to cancel appointment:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to cancel appointment",
      });
    }
  },
);

appointmentsRouter.post("/", requireAuth, async (req, res) => {
  if (req.user!.role !== "CUSTOMER") {
    res.status(403).json({
      message: "Forbidden",
    });

    return;
  }

  const parsedBody = createAppointmentSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid appointment data",
      errors: parsedBody.error.flatten().fieldErrors,
    });

    return;
  }

  const {
    barberId,
    serviceId,
    startsAt,
    notes,
  } = parsedBody.data;

  try {
    const appointment = await createAppointmentWithRetry({
      customerId: req.user!.id,
      barberId,
      serviceId,
      startsAt,
      notes,
    });

    await safelySendEmail(() => sendBookingCreatedEmail({
      customerName:
        appointment.customer.name,

      customerEmail:
        appointment.customer.email,

      barberName:
        appointment.barber.name,

      serviceName:
        appointment.service.name,

      startsAt:
        appointment.startsAt,

      price:
        appointment.service.price,
      }),
    );

    res.status(201).json({
      message: "Appointment created successfully",
      data: appointment,
    });

  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      res.status(409).json({
        message: error.message,
      });

      return;
    }

    if (error instanceof AppointmentValidationError) {
      res.status(error.statusCode).json({
        message: error.message,
      });

      return;
    }

    console.error("Failed to create appointment:", error);

    res.status(500).json({
      message: "Unable to create appointment",
    });
  }
});

type CreateAppointmentTransactionInput = {
  customerId: string;
  barberId: string;
  serviceId: string;
  startsAt: string;
  notes?: string;
};

async function createAppointmentWithRetry( input: CreateAppointmentTransactionInput, ) {
  for (
    let attempt = 1;
    attempt <= MAX_TRANSACTION_RETRIES;
    attempt += 1
  ) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          return createAppointmentTransaction(tx, input);
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 10_000,
        },
      );
    } catch (error) {
      const isTransactionConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";

      if (
        isTransactionConflict &&
        attempt < MAX_TRANSACTION_RETRIES
      ) {
        continue;
      }

      if (isTransactionConflict) {
        throw new AppointmentConflictError(
          "The selected slot was booked by another customer",
        );
      }

      throw error;
    }
  }

  throw new AppointmentConflictError();
}

async function createAppointmentTransaction( tx: Prisma.TransactionClient, input: CreateAppointmentTransactionInput, ) {
  const timeZone = process.env.BARBERSHOP_TIME_ZONE ?? "Europe/Athens";

  const requestedStart = DateTime.fromISO(input.startsAt, {
    setZone: true,
  }).setZone(timeZone);

  if (!requestedStart.isValid) {
    throw new AppointmentValidationError(
      "Invalid appointment start time",
    );
  }

  if (
    !isAlignedToSlotInterval(
      requestedStart,
      SLOT_INTERVAL_MINUTES,
    )
  ) {
    throw new AppointmentValidationError(
      `Appointment time must align to a ${SLOT_INTERVAL_MINUTES}-minute interval`,
    );
  }

  const now = DateTime.now().setZone(timeZone);

  if (requestedStart <= now) {
    throw new AppointmentValidationError(
      "Appointment must be scheduled in the future",
    );
  }

  const maximumBookingDate = now
    .startOf("day")
    .plus({
      days: BOOKING_WINDOW_DAYS,
    })
    .endOf("day");

  if (requestedStart > maximumBookingDate) {
    throw new AppointmentValidationError(
      `Appointments can only be booked up to ${BOOKING_WINDOW_DAYS} days in advance`,
    );
  }

  const customer = await tx.user.findFirst({
    where: {
      id: input.customerId,
      role: "CUSTOMER",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!customer) {
    throw new AppointmentValidationError(
      "Customer not found",
      404,
    );
  }

  const barber = await tx.barber.findFirst({
    where: {
      id: input.barberId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      services: {
        where: {
          serviceId: input.serviceId,
          service: {
            active: true,
          },
        },
        select: {
          service: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!barber) {
    throw new AppointmentValidationError(
      "Barber not found",
      404,
    );
  }

  const service = barber.services[0]?.service;

  if (!service) {
    throw new AppointmentValidationError(
      "The selected barber does not offer this service",
      400,
    );
  }

  const requestedEnd = requestedStart.plus({
    minutes: service.durationMinutes,
  });

  const dayOfWeek = requestedStart.weekday % 7;

  const workingHours = await tx.workingHours.findFirst({
    where: {
      barberId: barber.id,
      dayOfWeek,
      active: true,
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  if (!workingHours) {
    throw new AppointmentValidationError(
      "The barber does not work on the selected date",
    );
  }

  if (!workingHours.startTime || !workingHours.endTime) {
    throw new Error("Invalid working hours");
  }

  const localDate = requestedStart.toISODate();

  if (!localDate) {
    throw new AppointmentValidationError(
      "Unable to resolve appointment date",
    );
  }

  const workingDayStart = createZonedDateTime(
    localDate,
    workingHours.startTime,
    timeZone,
  );

  const workingDayEnd = createZonedDateTime(
    localDate,
    workingHours.endTime,
    timeZone,
  );

  if (
    requestedStart < workingDayStart ||
    requestedEnd > workingDayEnd
  ) {
    throw new AppointmentValidationError(
      "The selected slot is outside the barber's working hours",
    );
  }

  const startsAtUtc = requestedStart.toUTC().toJSDate();
  const endsAtUtc = requestedEnd.toUTC().toJSDate();

  const conflictingTimeOff = await tx.timeOff.findFirst({
    where: {
      barberId: barber.id,
      startsAt: {
        lt: endsAtUtc,
      },
      endsAt: {
        gt: startsAtUtc,
      },
    },
    select: {
      id: true,
    },
  });

  if (conflictingTimeOff) {
    throw new AppointmentConflictError(
      "The barber is unavailable during the selected time",
    );
  }

  const conflictingAppointment =
    await tx.appointment.findFirst({
      where: {
        barberId: barber.id,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        startsAt: {
          lt: endsAtUtc,
        },
        endsAt: {
          gt: startsAtUtc,
        },
      },
      select: {
        id: true,
      },
    });

  if (conflictingAppointment) {
    throw new AppointmentConflictError();
  }

  const appointment = await tx.appointment.create({
    data: {
      customerId: customer.id,
      barberId: barber.id,
      serviceId: service.id,
      startsAt: startsAtUtc,
      endsAt: endsAtUtc,
      status: "PENDING",
      notes: input.notes || null,
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      notes: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      barber: {
        select: {
          id: true,
          name: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          price: true,
        },
      },
    },
  });

  return {
    ...appointment,
    service: {
      ...appointment.service,
      price: Number(appointment.service.price),
    },
    localStartsAt: DateTime.fromJSDate(
      appointment.startsAt,
      {
        zone: "utc",
      },
    )
      .setZone(timeZone)
      .toISO(),
    localEndsAt: DateTime.fromJSDate(
      appointment.endsAt,
      {
        zone: "utc",
      },
    )
      .setZone(timeZone)
      .toISO(),
    timeZone,
  };
}