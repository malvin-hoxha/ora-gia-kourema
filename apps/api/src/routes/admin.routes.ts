import { Router } from "express";
import { DateTime } from "luxon";
import { requireAuth, requireRole, } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { adminAppointmentsQuerySchema, adminAppointmentParamsSchema, 
updateAdminAppointmentStatusSchema } from "../schemas/admin.schema.js";

export const adminRouter = Router();

const adminAppointmentSelect = {
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
      active: true,
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

type AdminAppointment =
  Prisma.AppointmentGetPayload<{
    select: typeof adminAppointmentSelect;
  }>;

function formatAdminAppointment(
  appointment: AdminAppointment,
  timeZone: string,
) {
  return {
    ...appointment,

    price: Number(
      appointment.service.price,
    ),

    service: {
      ...appointment.service,

      price: Number(
        appointment.service.price,
      ),
    },

    localStartsAt:
      DateTime.fromJSDate(
        appointment.startsAt,
        {
          zone: "utc",
        },
      )
        .setZone(timeZone)
        .toISO(),

    localEndsAt:
      DateTime.fromJSDate(
        appointment.endsAt,
        {
          zone: "utc",
        },
      )
        .setZone(timeZone)
        .toISO(),

    localCancelledAt:
      appointment.cancelledAt
        ? DateTime.fromJSDate(
            appointment.cancelledAt,
            {
              zone: "utc",
            },
          )
            .setZone(timeZone)
            .toISO()
        : null,

    timeZone,
  };
}

adminRouter.use(
  requireAuth,
  requireRole("ADMIN"),
);

adminRouter.get(
  "/overview",
  async (_req, res) => {
    try {
      const timeZone =
        process.env.BARBERSHOP_TIME_ZONE ??
        "Europe/Athens";

      const today =
        DateTime.now()
          .setZone(timeZone)
          .startOf("day");

      const tomorrow =
        today.plus({
          days: 1,
        });

      const todayStart =
        today.toUTC().toJSDate();

      const todayEnd =
        tomorrow.toUTC().toJSDate();

      const [
        customersCount,
        barbersCount,
        activeBarbersCount,
        servicesCount,
        todayAppointmentsCount,
        pendingAppointmentsCount,
        confirmedAppointmentsCount,
        completedAppointments,
      ] = await Promise.all([
        prisma.user.count({
          where: {
            role: "CUSTOMER",
          },
        }),

        prisma.barber.count(),

        prisma.barber.count({
          where: {
            active: true,
          },
        }),

        prisma.service.count(),

        prisma.appointment.count({
          where: {
            startsAt: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
        }),

        prisma.appointment.count({
          where: {
            status: "PENDING",
          },
        }),

        prisma.appointment.count({
          where: {
            status: "CONFIRMED",
          },
        }),

        prisma.appointment.findMany({
          where: {
            status: "COMPLETED",

            startsAt: {
              gte: todayStart,
              lt: todayEnd,
            },
          },

          select: {
            service: {
              select: {
                price: true,
              },
            },
          },
        }),
      ]);

      const todayRevenue =
        completedAppointments.reduce(
          (total, appointment) =>
            total +
            Number(
              appointment.service.price,
            ),
          0,
        );

      res.status(200).json({
        data: {
          customersCount,
          barbersCount,
          activeBarbersCount,
          inactiveBarbersCount:
            barbersCount -
            activeBarbersCount,

          servicesCount,

          appointments: {
            today:
              todayAppointmentsCount,

            pending:
              pendingAppointmentsCount,

            confirmed:
              confirmedAppointmentsCount,
          },

          todayRevenue,

          date: today.toISODate(),
          timeZone,
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve admin overview:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve admin overview",
      });
    }
  },
);

adminRouter.get(
  "/appointments",
  async (req, res) => {
    const parsedQuery =
      adminAppointmentsQuerySchema.safeParse(
        req.query,
      );

    if (!parsedQuery.success) {
      res.status(400).json({
        message:
          "Invalid appointment filters",

        errors:
          parsedQuery.error.flatten()
            .fieldErrors,
      });

      return;
    }

    try {
      const timeZone =
        process.env.BARBERSHOP_TIME_ZONE ??
        "Europe/Athens";

      const where:
        Prisma.AppointmentWhereInput = {};

      if (parsedQuery.data.status) {
        where.status =
          parsedQuery.data.status;
      }

      if (parsedQuery.data.barberId) {
        where.barberId =
          parsedQuery.data.barberId;
      }

      if (parsedQuery.data.date) {
        const selectedDate =
          DateTime.fromISO(
            parsedQuery.data.date,
            {
              zone: timeZone,
            },
          );

        if (!selectedDate.isValid) {
          res.status(400).json({
            message:
              "Invalid appointment date",
          });

          return;
        }

        const nextDate =
          selectedDate.plus({
            days: 1,
          });

        where.startsAt = {
          gte: selectedDate
            .startOf("day")
            .toUTC()
            .toJSDate(),

          lt: nextDate
            .startOf("day")
            .toUTC()
            .toJSDate(),
        };
      }

      const appointments =
        await prisma.appointment.findMany({
          where,

          orderBy: {
            startsAt: "asc",
          },

          select:
            adminAppointmentSelect,
        });

      res.status(200).json({
        data: {
          appointments:
            appointments.map(
              (appointment) =>
                formatAdminAppointment(
                  appointment,
                  timeZone,
                ),
            ),

          count: appointments.length,

          filters: {
            date:
              parsedQuery.data.date ??
              null,

            status:
              parsedQuery.data.status ??
              null,

            barberId:
              parsedQuery.data.barberId ??
              null,
          },
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve admin appointments:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve admin appointments",
      });
    }
  },
);

type AdminStatusUpdate =
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const allowedAdminTransitions: Record<
  string,
  AdminStatusUpdate[]
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


adminRouter.patch(
  "/appointments/:appointmentId/status",
  async (req, res) => {
    const parsedParams =
      adminAppointmentParamsSchema.safeParse(
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
      updateAdminAppointmentStatusSchema.safeParse(
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

    try {
      const appointment =
        await prisma.appointment.findUnique({
          where: {
            id:
              parsedParams.data
                .appointmentId,
          },

          select: {
            id: true,
            status: true,
          },
        });

      if (!appointment) {
        res.status(404).json({
          message:
            "Appointment not found",
        });

        return;
      }

      const requestedStatus =
        parsedBody.data.status;

      const allowedStatuses =
        allowedAdminTransitions[
          appointment.status
        ] ?? [];

      if (
        !allowedStatuses.includes(
          requestedStatus,
        )
      ) {
        res.status(409).json({
          message:
            `Appointment cannot change from ${appointment.status} to ${requestedStatus}`,
        });

        return;
      }

      const isCancellation =
        requestedStatus ===
        "CANCELLED";

      const timeZone =
        process.env.BARBERSHOP_TIME_ZONE ??
        "Europe/Athens";

      const updatedAppointment =
        await prisma.appointment.update({
          where: {
            id: appointment.id,
          },

          data: {
            status: requestedStatus,

            cancelledAt:
              isCancellation
                ? new Date()
                : null,

            cancelledBy:
              isCancellation
                ? "ADMIN"
                : null,

            cancellationReason:
              isCancellation
                ? "Cancelled by administrator"
                : null,
          },

          select:
            adminAppointmentSelect,
        });

      res.status(200).json({
        message:
          "Appointment status updated successfully",

        data: {
          appointment:
            formatAdminAppointment(
              updatedAppointment,
              timeZone,
            ),
        },
      });
    } catch (error) {
      console.error(
        "Failed to update admin appointment status:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to update appointment status",
      });
    }
  },
);
