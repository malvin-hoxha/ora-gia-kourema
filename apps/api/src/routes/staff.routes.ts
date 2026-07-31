import { DateTime } from "luxon";
import { Router } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { requireAuth, requireRole,} from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

import { staffAppointmentsQuerySchema, updateAppointmentStatusBodySchema, 
updateAppointmentStatusParamsSchema, updateWorkingHoursSchema, previewTimeOffSchema, timeOffParamsSchema}
from "../schemas/staff.schema.js";
import { TIME_OFF_CANCELLATION_REASON, TIME_OFF_WINDOW_DAYS,} from "../constants/time-off.constants.js";

export const staffRouter = Router();

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

    customer: {
        select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
} satisfies Prisma.AppointmentSelect; //Typescript: check if this is valid prisma select for model Appointment
/* USECASE 
  const appointments =
    await prisma.appointment.findMany({
      select: appointmentSelect,
    });

*/

const timeOffConflictAppointmentSelect = {
  id: true,
  startsAt: true,
  endsAt: true,
  status: true,

  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },

  service: {
    select: {
      id: true,
      name: true,
      durationMinutes: true,
    },
  },
} satisfies Prisma.AppointmentSelect;

const timeOffSelect = {
  id: true,
  startsAt: true,
  endsAt: true,
  reason: true,
} satisfies Prisma.TimeOffSelect;

type AppointmentResult = Prisma.AppointmentGetPayload<{ //gives AppointmentResult the appointmentSelect fields
    select: typeof appointmentSelect;
}>; 

function formatAppointment(appointment: AppointmentResult,) {
    const timeZone = process.env.BARBERSHOP_TIME_ZONE ?? "Europe/Athens";

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

type TimeOffResult =
  Prisma.TimeOffGetPayload<{
    select: typeof timeOffSelect;
  }>;

function formatTimeOff(
  timeOff: TimeOffResult,
) {
  const timeZone =
    process.env.BARBERSHOP_TIME_ZONE ??
    "Europe/Athens";

  return {
    ...timeOff,

    localStartsAt: DateTime.fromJSDate(
      timeOff.startsAt,
      {
        zone: "utc",
      },
    )
      .setZone(timeZone)
      .toISO(),

    localEndsAt: DateTime.fromJSDate(
      timeOff.endsAt,
      {
        zone: "utc",
      },
    )
      .setZone(timeZone)
      .toISO(),

    timeZone,
  };
}


async function getAuthenticatedBarberId(userId: string,) {
    const barber = await prisma.barber.findFirst({
        where: {
            userId,
            active: true,
        },
        select: {
            id: true,
        },
    });

  return barber?.id ?? null;
}

type TimeOffInput = {
  date: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason?: string | null;
};

function createTimeOffRange(
  input: TimeOffInput,
) {
  const timeZone =
    process.env.BARBERSHOP_TIME_ZONE ??
    "Europe/Athens";

  const localDate = DateTime.fromISO(
    input.date,
    {
      zone: timeZone,
    },
  );

  if (!localDate.isValid) {
    return null;
  }

  if (input.allDay) {
    const startsAt =
      localDate.startOf("day");

    const endsAt =
      localDate.plus({
        days: 1,
      }).startOf("day");

    return {
      startsAt,
      endsAt,
      timeZone,
    };
  }

  if (
    !input.startTime ||
    !input.endTime
  ) {
    return null;
  }

  const startsAt = DateTime.fromISO(
    `${input.date}T${input.startTime}`,
    {
      zone: timeZone,
    },
  );

  const endsAt = DateTime.fromISO(
    `${input.date}T${input.endTime}`,
    {
      zone: timeZone,
    },
  );

  if (
    !startsAt.isValid ||
    !endsAt.isValid
  ) {
    return null;
  }

  return {
    startsAt,
    endsAt,
    timeZone,
  };
}

function validateTimeOffRange(
  startsAt: DateTime,
  endsAt: DateTime,
  allDay: boolean,
) {
  const timeZone =
    process.env.BARBERSHOP_TIME_ZONE ??
    "Europe/Athens";

  const now = DateTime.now().setZone(
    timeZone,
  );

  const today = now.startOf("day");

  const maximumTimeOffDay = today
    .plus({
      days: TIME_OFF_WINDOW_DAYS,
    })
    .endOf("day");

  if (endsAt <= startsAt) {
    return {
      valid: false as const,
      message:
        "Time off end must be later than its start",
    };
  }

  if (allDay && startsAt <= today) {
    return {
      valid: false as const,
      message:
        "An all-day time off must start from tomorrow",
    };
  }

  if (!allDay && startsAt <= now) {
    return {
      valid: false as const,
      message:
        "Time off must start in the future",
    };
  }

  if (startsAt > maximumTimeOffDay) {
    return {
      valid: false as const,
      message:
        `Time off can only be declared up to ${TIME_OFF_WINDOW_DAYS} days in advance`,
    };
  }

  return {
    valid: true as const,
  };
}

const defaultWorkingHours = [
  {
    dayOfWeek: 0,
    active: false,
    startTime: null,
    endTime: null,
  },
  {
    dayOfWeek: 1,
    active: false,
    startTime: null,
    endTime: null,
  },
  {
    dayOfWeek: 2,
    active: false,
    startTime: null,
    endTime: null,
  },
  {
    dayOfWeek: 3,
    active: false,
    startTime: null,
    endTime: null,
  },
  {
    dayOfWeek: 4,
    active: false,
    startTime: null,
    endTime: null,
  },
  {
    dayOfWeek: 5,
    active: false,
    startTime: null,
    endTime: null,
  },
  {
    dayOfWeek: 6,
    active: false,
    startTime: null,
    endTime: null,
  },
];

function createCompleteWorkingWeek(
  workingHours: Array<{
    dayOfWeek: number;
    active: boolean;
    startTime: string | null;
    endTime: string | null;
  }>,
) {
  const workingHoursByDay = new Map(
    workingHours.map((day) => [
      day.dayOfWeek,
      day,
    ]),
  );

  return defaultWorkingHours.map(
    (defaultDay) =>
      workingHoursByDay.get(
        defaultDay.dayOfWeek,
      ) ?? defaultDay,
  );
}

class TimeOffConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "TimeOffConflictError";
  }
}

staffRouter.get("/working-hours", requireAuth, requireRole("BARBER"), async (req, res) => {
    try {
      const barberId = await getAuthenticatedBarberId( req.user!.id, );

      if (!barberId) {
        res.status(403).json({
          message: "No active barber profile is linked to this account",
        });

        return;
      }

      const workingHours =
        await prisma.workingHours.findMany({
          where: {
            barberId,
          },

          orderBy: {
            dayOfWeek: "asc",
          },

          select: {
            dayOfWeek: true,
            active: true,
            startTime: true,
            endTime: true,
          },
        });

      res.status(200).json({
        data: {
          workingHours:
            createCompleteWorkingWeek(
              workingHours,
            ),
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve working hours:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve working hours",
      });
    }
  },
);

staffRouter.put("/working-hours", requireAuth, requireRole("BARBER"), async (req, res) => {
    const parsedBody = updateWorkingHoursSchema.safeParse( req.body, );

    if (!parsedBody.success) {
      res.status(400).json({
        message: "Invalid working hours data",
        errors: parsedBody.error.flatten().fieldErrors,
        issues: parsedBody.error.issues,
      });

      return;
    }

    try {
      const barberId = await getAuthenticatedBarberId( req.user!.id,);

      if (!barberId) {
        res.status(403).json({
          message: "No active barber profile is linked to this account",
        });

        return;
      }

      const normalizedWorkingHours = parsedBody.data.workingHours.map(
          (day) => ({
            dayOfWeek: day.dayOfWeek,
            active: day.active,

            startTime: day.active
              ? day.startTime
              : null,

            endTime: day.active
              ? day.endTime
              : null,
          }),
        );

      await prisma.$transaction(
        normalizedWorkingHours.map(
          (day) =>
            prisma.workingHours.upsert({
              where: {
                barberId_dayOfWeek: {
                  barberId,
                  dayOfWeek:
                    day.dayOfWeek,
                },
              },

              update: {
                active: day.active,
                startTime:
                  day.startTime,
                endTime:
                  day.endTime,
              },

              create: {
                barberId,
                dayOfWeek:
                  day.dayOfWeek,
                active: day.active,
                startTime:
                  day.startTime,
                endTime:
                  day.endTime,
              },
            }),
        ),
      );

      const updatedWorkingHours =
        await prisma.workingHours.findMany({
          where: {
            barberId,
          },

          orderBy: {
            dayOfWeek: "asc",
          },

          select: {
            dayOfWeek: true,
            active: true,
            startTime: true,
            endTime: true,
          },
        });

      res.status(200).json({
        message:
          "Working hours updated successfully",

        data: {
          workingHours:
            createCompleteWorkingWeek(
              updatedWorkingHours,
            ),
        },
      });
    } catch (error) {
      console.error(
        "Failed to update working hours:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to update working hours",
      });
    }
  },
);

staffRouter.post(
  "/time-off/preview",
  requireAuth,
  requireRole("BARBER"),
  async (req, res) => {
    const parsedBody =
      previewTimeOffSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        message:
          "Invalid time off data",

        errors:
          parsedBody.error.flatten()
            .fieldErrors,

        issues:
          parsedBody.error.issues,
      });

      return;
    }

    try {
      const barberId =
        await getAuthenticatedBarberId(
          req.user!.id,
        );

      if (!barberId) {
        res.status(403).json({
          message:
            "No active barber profile is linked to this account",
        });

        return;
      }

      const timeOffRange =
        createTimeOffRange(
          parsedBody.data,
        );

      if (!timeOffRange) {
        res.status(400).json({
          message:
            "Unable to create a valid time off range",
        });

        return;
      }

      const rangeValidation =
        validateTimeOffRange(
          timeOffRange.startsAt,
          timeOffRange.endsAt,
          parsedBody.data.allDay,
        );

      if (!rangeValidation.valid) {
        res.status(400).json({
          message:
            rangeValidation.message,
        });

        return;
      }

      const conflictingTimeOff =
        await prisma.timeOff.findFirst({
          where: {
            barberId,

            startsAt: {
              lt: timeOffRange.endsAt
                .toUTC()
                .toJSDate(),
            },

            endsAt: {
              gt: timeOffRange.startsAt
                .toUTC()
                .toJSDate(),
            },
          },

          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            reason: true,
          },
        });

      const conflictingAppointments =
        await prisma.appointment.findMany({
          where: {
            barberId,

            status: {
              in: [
                "PENDING",
                "CONFIRMED",
              ],
            },

            startsAt: {
              lt: timeOffRange.endsAt
                .toUTC()
                .toJSDate(),
            },

            endsAt: {
              gt: timeOffRange.startsAt
                .toUTC()
                .toJSDate(),
            },
          },

          orderBy: {
            startsAt: "asc",
          },

          select:
            timeOffConflictAppointmentSelect,
        });

      res.status(200).json({
        data: {
          proposedTimeOff: {
            date:
              parsedBody.data.date,

            allDay:
              parsedBody.data.allDay,

            startsAt:
              timeOffRange.startsAt
                .toUTC()
                .toISO(),

            endsAt:
              timeOffRange.endsAt
                .toUTC()
                .toISO(),

            localStartsAt:
              timeOffRange.startsAt.toISO(),

            localEndsAt:
              timeOffRange.endsAt.toISO(),

            timeZone:
              timeOffRange.timeZone,

            reason:
              parsedBody.data.reason ??
              null,
          },

          conflictingTimeOff:
            conflictingTimeOff
              ? {
                  ...conflictingTimeOff,

                  localStartsAt:
                    DateTime.fromJSDate(
                      conflictingTimeOff.startsAt,
                      {
                        zone: "utc",
                      },
                    )
                      .setZone(
                        timeOffRange.timeZone,
                      )
                      .toISO(),

                  localEndsAt:
                    DateTime.fromJSDate(
                      conflictingTimeOff.endsAt,
                      {
                        zone: "utc",
                      },
                    )
                      .setZone(
                        timeOffRange.timeZone,
                      )
                      .toISO(),
                }
              : null,

          conflictingAppointments:
            conflictingAppointments.map(
              (appointment) => ({
                ...appointment,

                localStartsAt:
                  DateTime.fromJSDate(
                    appointment.startsAt,
                    {
                      zone: "utc",
                    },
                  )
                    .setZone(
                      timeOffRange.timeZone,
                    )
                    .toISO(),

                localEndsAt:
                  DateTime.fromJSDate(
                    appointment.endsAt,
                    {
                      zone: "utc",
                    },
                  )
                    .setZone(
                      timeOffRange.timeZone,
                    )
                    .toISO(),
              }),
            ),

          conflictingAppointmentsCount:
            conflictingAppointments.length,

          canCreate:
            !conflictingTimeOff,
        },
      });
    } catch (error) {
      console.error(
        "Failed to preview time off:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to preview time off",
      });
    }
  },
);

staffRouter.post(
  "/time-off",
  requireAuth,
  requireRole("BARBER"),
  async (req, res) => {
    const parsedBody =
      previewTimeOffSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        message:
          "Invalid time off data",

        errors:
          parsedBody.error.flatten()
            .fieldErrors,

        issues:
          parsedBody.error.issues,
      });

      return;
    }

    try {
      const barberId =
        await getAuthenticatedBarberId(
          req.user!.id,
        );

      if (!barberId) {
        res.status(403).json({
          message:
            "No active barber profile is linked to this account",
        });

        return;
      }

      const timeOffRange =
        createTimeOffRange(
          parsedBody.data,
        );

      if (!timeOffRange) {
        res.status(400).json({
          message:
            "Unable to create a valid time off range",
        });

        return;
      }

      const rangeValidation =
        validateTimeOffRange(
          timeOffRange.startsAt,
          timeOffRange.endsAt,
          parsedBody.data.allDay,
        );

      if (!rangeValidation.valid) {
        res.status(400).json({
          message:
            rangeValidation.message,
        });

        return;
      }

      const startsAt = timeOffRange.startsAt
        .toUTC()
        .toJSDate();

      const endsAt = timeOffRange.endsAt
        .toUTC()
        .toJSDate();

      const result =
        await prisma.$transaction(
          async (transaction) => {
            /*
             * Ξαναελέγχουμε μέσα στην transaction
             * αν υπάρχει overlapping time off.
             */
            const overlappingTimeOff =
              await transaction.timeOff.findFirst({
                where: {
                  barberId,

                  startsAt: {
                    lt: endsAt,
                  },

                  endsAt: {
                    gt: startsAt,
                  },
                },

                select: {
                  id: true,
                },
              });

            if (overlappingTimeOff) {
              throw new TimeOffConflictError(
                "A time off entry already exists for this period",
              );
            }

            /*
             * Βρίσκουμε τα appointments πριν τα
             * ακυρώσουμε, ώστε να μπορούμε να τα
             * επιστρέψουμε στο response.
             */
            const conflictingAppointments =
              await transaction.appointment.findMany({
                where: {
                  barberId,

                  status: {
                    in: [
                      "PENDING",
                      "CONFIRMED",
                    ],
                  },

                  startsAt: {
                    lt: endsAt,
                  },

                  endsAt: {
                    gt: startsAt,
                  },
                },

                orderBy: {
                  startsAt: "asc",
                },

                select:
                  timeOffConflictAppointmentSelect,
              });

            const conflictingAppointmentIds =
              conflictingAppointments.map(
                (appointment) =>
                  appointment.id,
              );

            if (
              conflictingAppointmentIds.length >
              0
            ) {
              await transaction.appointment.updateMany({
                where: {
                  id: {
                    in: conflictingAppointmentIds,
                  },

                  /*
                   * Επαναλαμβάνουμε το status check
                   * ώστε να μην πειράξουμε appointment
                   * που άλλαξε status στο μεταξύ.
                   */
                  status: {
                    in: [
                      "PENDING",
                      "CONFIRMED",
                    ],
                  },
                },

                data: {
                  status: "CANCELLED",

                  cancelledAt:
                    new Date(),

                  cancelledBy:
                    "BARBER",

                  cancellationReason:
                    TIME_OFF_CANCELLATION_REASON,
                },
              });
            }

            const createdTimeOff =
              await transaction.timeOff.create({
                data: {
                  barberId,
                  startsAt,
                  endsAt,

                  reason:
                    parsedBody.data.reason
                      ?.trim() || null,
                },

                select: timeOffSelect,
              });

            return {
              createdTimeOff,
              conflictingAppointments,
            };
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel
                .Serializable,
          },
        );

      res.status(201).json({
        message:
          result.conflictingAppointments
            .length > 0
            ? "Time off created and conflicting appointments cancelled successfully"
            : "Time off created successfully",

        data: {
          timeOff: formatTimeOff(
            result.createdTimeOff,
          ),

          cancelledAppointments:
            result.conflictingAppointments.map(
              (appointment) => ({
                ...appointment,

                localStartsAt:
                  DateTime.fromJSDate(
                    appointment.startsAt,
                    {
                      zone: "utc",
                    },
                  )
                    .setZone(
                      timeOffRange.timeZone,
                    )
                    .toISO(),

                localEndsAt:
                  DateTime.fromJSDate(
                    appointment.endsAt,
                    {
                      zone: "utc",
                    },
                  )
                    .setZone(
                      timeOffRange.timeZone,
                    )
                    .toISO(),
              }),
            ),

          cancelledAppointmentsCount:
            result.conflictingAppointments
              .length,
        },
      });
    } catch (error) {
      if (
        error instanceof
        TimeOffConflictError
      ) {
        res.status(409).json({
          message: error.message,
        });

        return;
      }

      console.error(
        "Failed to create time off:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to create time off",
      });
    }
  },
);

staffRouter.get(
  "/time-off",
  requireAuth,
  requireRole("BARBER"),
  async (req, res) => {
    try {
      const barberId =
        await getAuthenticatedBarberId(
          req.user!.id,
        );

      if (!barberId) {
        res.status(403).json({
          message:
            "No active barber profile is linked to this account",
        });

        return;
      }

      const now = new Date();

      const timeOffEntries =
        await prisma.timeOff.findMany({
          where: {
            barberId,

            endsAt: {
              gt: now,
            },
          },

          orderBy: {
            startsAt: "asc",
          },

          select: timeOffSelect,
        });

      res.status(200).json({
        data: {
          timeOff:
            timeOffEntries.map(
              formatTimeOff,
            ),
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve time off:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve time off",
      });
    }
  },
);

staffRouter.delete(
  "/time-off/:timeOffId",
  requireAuth,
  requireRole("BARBER"),
  async (req, res) => {
    const parsedParams =
      timeOffParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        message:
          "Invalid time off id",

        errors:
          parsedParams.error.flatten()
            .fieldErrors,
      });

      return;
    }

    try {
      const barberId =
        await getAuthenticatedBarberId(
          req.user!.id,
        );

      if (!barberId) {
        res.status(403).json({
          message:
            "No active barber profile is linked to this account",
        });

        return;
      }

      const timeOff =
        await prisma.timeOff.findFirst({
          where: {
            id: parsedParams.data.timeOffId,
            barberId,
          },

          select: {
            id: true,
            startsAt: true,
            endsAt: true,
          },
        });

      if (!timeOff) {
        res.status(404).json({
          message: "Time off not found",
        });

        return;
      }

      if (timeOff.endsAt <= new Date()) {
        res.status(409).json({
          message:
            "Past time off entries cannot be deleted",
        });

        return;
      }

      await prisma.timeOff.delete({
        where: {
          id: timeOff.id,
        },
      });

      res.status(200).json({
        message:
          "Time off deleted successfully",

        data: {
          id: timeOff.id,
        },
      });
    } catch (error) {
      console.error(
        "Failed to delete time off:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to delete time off",
      });
    }
  },
);

staffRouter.get("/appointments", requireAuth, requireRole("BARBER", "ADMIN"), async (req, res) => {
    const parsedQuery = staffAppointmentsQuerySchema.safeParse(req.query,); //date: "2026-08-10", status: "PENDING"

    if (!parsedQuery.success) {
        res.status(400).json({
            message:
                "Invalid appointments query",
            errors:
                parsedQuery.error.flatten().fieldErrors,
        });

        return;
    }

    try {
      const { date, status } = parsedQuery.data;

      const timeZone = process.env.BARBERSHOP_TIME_ZONE ?? "Europe/Athens";

      let barberId: string | undefined;

      if (req.user!.role === "BARBER") {
        const authenticatedBarberId = await getAuthenticatedBarberId( req.user!.id,); // ! => we know req.user exists as requireAuth runs before

        if (!authenticatedBarberId) { //if this fails, then req.user is an ADMIN and can see all appointments
            res.status(403).json({
                message:
                "No active barber profile is linked to this account",
            });

            return;
        }

        barberId = authenticatedBarberId;
      }

      let dateRange: | { gte: Date; lt: Date;} | undefined;

      if (date) {
        const localDay = DateTime.fromISO(
          date,
          {
            zone: timeZone,
          },
        ).startOf("day");

        if (!localDay.isValid) {
          res.status(400).json({
            message: "Invalid date",
          });

          return;
        }

        dateRange = {
          gte: localDay
            .toUTC()
            .toJSDate(),

          lt: localDay
            .plus({ days: 1 })
            .toUTC()
            .toJSDate(),
        };
      }

      const appointments = await prisma.appointment.findMany({
          where: { 
            ...(barberId ? { barberId, } : {}), //if {} then return all appointments, the () needs ...
            ...(status ? { status,} : {}), 
            ...(dateRange ? { startsAt: dateRange,} : {}),
          },

          orderBy: {
            startsAt: "asc",
          },

          select: appointmentSelect,
        });

      res.status(200).json({
        data: {
          appointments:
            appointments.map(
              formatAppointment,
            ),

          filters: {
            date: date ?? null,
            status: status ?? null,
          },
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve staff appointments:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve appointments",
      });
    }
  },
);

type ManagedAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";


//object type <Key, Value>
const allowedStatusTransitions: Record< ManagedAppointmentStatus, ManagedAppointmentStatus[]> = {
  PENDING: [
    "CONFIRMED",
    "CANCELLED",
  ], //PENDING.[1] = CANCELLED, meaning you can go from PENDING to CANCELLED or PENDING to CONFIRMED

  CONFIRMED: [
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ],

  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

staffRouter.patch("/appointments/:appointmentId/status", requireAuth, requireRole("BARBER", "ADMIN"),
  async (req, res) => {
    const parsedParams = updateAppointmentStatusParamsSchema.safeParse( req.params,);

    if (!parsedParams.success) {
      res.status(400).json({
        message:
          "Invalid appointment id",
        errors:
          parsedParams.error.flatten()
            .fieldErrors,
      });

      return;
    }

    const parsedBody = updateAppointmentStatusBodySchema.safeParse( req.body,);

    if (!parsedBody.success) {
      res.status(400).json({
        message:
          "Invalid appointment status",
        errors:
          parsedBody.error.flatten()
            .fieldErrors,
      });

      return;
    }

    const { appointmentId } = parsedParams.data;

    const { status: requestedStatus } = parsedBody.data;

    try {
      let barberId: string | undefined;

      if (req.user!.role === "BARBER") {
        const authenticatedBarberId =
          await getAuthenticatedBarberId(
            req.user!.id,
          );

        if (!authenticatedBarberId) {
          res.status(403).json({
            message:
              "No active barber profile is linked to this account",
          });

          return;
        }

        barberId = authenticatedBarberId;
      }

      const appointment =
        await prisma.appointment.findFirst({
          where: {
            id: appointmentId,

            ...(barberId
              ? {
                  barberId,
                }
              : {}),
          },

          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
          },
        });

      if (!appointment) {
        res.status(404).json({
          message: "Appointment not found",
        });

        return;
      }

      const currentStatus = appointment.status as ManagedAppointmentStatus;

      const nextStatuses = allowedStatusTransitions[ currentStatus ];

      if ( !nextStatuses.includes( requestedStatus, )) { //includes checks if requestedStatus is in nextStatuses
        res.status(409).json({
          message: `Appointment cannot change from ${currentStatus} to ${requestedStatus}`,
        });

        return;
      }

      const now = new Date();

      if ( requestedStatus === "COMPLETED" && appointment.endsAt > now ) {
        res.status(409).json({ message: "An appointment cannot be completed before it ends", });

        return;
      }

      if ( requestedStatus === "NO_SHOW" && appointment.startsAt > now ) {
        res.status(409).json({ message: "A future appointment cannot be marked as no-show", });

        return;
      }

      const isCancellation = requestedStatus === "CANCELLED";


      const updatedAppointment =
        await prisma.appointment.update({
          where: {
            id: appointment.id,
          },

          data: {
            status: requestedStatus,

            cancelledAt: isCancellation
            ? new Date()
            : null,

            cancelledBy: isCancellation
              ? req.user!.role === "ADMIN"
                ? "ADMIN"
                : "BARBER"
              : null,

            cancellationReason: isCancellation
              ? req.user!.role === "ADMIN"
                ? "Cancelled by administrator"
                : "Cancelled by barber"
              : null,
                },

          select: appointmentSelect,
        });

      res.status(200).json({
        message:
          "Appointment status updated successfully",

        data: formatAppointment(
          updatedAppointment,
        ),
      });
    } catch (error) {
      console.error(
        "Failed to update appointment status:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to update appointment status",
      });
    }
  },
);

