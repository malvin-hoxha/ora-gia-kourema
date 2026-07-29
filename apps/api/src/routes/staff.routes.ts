import { DateTime } from "luxon";
import { Router } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { requireAuth, requireRole,} from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

import { staffAppointmentsQuerySchema, updateAppointmentStatusBodySchema, updateAppointmentStatusParamsSchema,}
from "../schemas/staff.schema.js";

export const staffRouter = Router();

const appointmentSelect = {
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

staffRouter.get("/appointments", requireAuth, requireRole("BARBER", "ADMIN"), async (req, res) => {
    const parsedQuery = staffAppointmentsQuerySchema.safeParse(req.query,);

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
        const authenticatedBarberId = await getAuthenticatedBarberId( req.user!.id,);

        if (!authenticatedBarberId) {
            res.status(403).json({
                message:
                "No active barber profile is linked to this account",
            });

            return;
        }

        barberId = authenticatedBarberId;
      }

      let dateRange: | {
            gte: Date;
            lt: Date;
          }
        | undefined;

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

      const appointments =
        await prisma.appointment.findMany({
          where: {
            ...(barberId
              ? {
                  barberId,
                }
              : {}),

            ...(status
              ? {
                  status,
                }
              : {}),

            ...(dateRange
              ? {
                  startsAt: dateRange,
                }
              : {}),
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

const allowedStatusTransitions: Record<
  ManagedAppointmentStatus,
  ManagedAppointmentStatus[]
> = {
  PENDING: [
    "CONFIRMED",
    "CANCELLED",
  ],

  CONFIRMED: [
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ],

  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

staffRouter.patch(
  "/appointments/:appointmentId/status",
  requireAuth,
  requireRole("BARBER", "ADMIN"),
  async (req, res) => {
    const parsedParams =
      updateAppointmentStatusParamsSchema.safeParse(
        req.params,
      );

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

    const parsedBody =
      updateAppointmentStatusBodySchema.safeParse(
        req.body,
      );

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

    const { appointmentId } =
      parsedParams.data;

    const { status: requestedStatus } =
      parsedBody.data;

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

      const currentStatus =
        appointment.status as ManagedAppointmentStatus;

      const nextStatuses =
        allowedStatusTransitions[
          currentStatus
        ];

      if (
        !nextStatuses.includes(
          requestedStatus,
        )
      ) {
        res.status(409).json({
          message:
            `Appointment cannot change from ${currentStatus} to ${requestedStatus}`,
        });

        return;
      }

      const now = new Date();

      if (
        requestedStatus === "COMPLETED" &&
        appointment.endsAt > now
      ) {
        res.status(409).json({
          message:
            "An appointment cannot be completed before it ends",
        });

        return;
      }

      if (
        requestedStatus === "NO_SHOW" &&
        appointment.startsAt > now
      ) {
        res.status(409).json({
          message:
            "A future appointment cannot be marked as no-show",
        });

        return;
      }

      const updatedAppointment =
        await prisma.appointment.update({
          where: {
            id: appointment.id,
          },

          data: {
            status: requestedStatus,
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