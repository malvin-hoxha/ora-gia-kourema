import { Router } from "express";
import { DateTime } from "luxon";
import { requireAuth, requireRole, } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { adminAppointmentsQuerySchema, adminAppointmentParamsSchema, 
adminServiceParamsSchema, createAdminServiceSchema, updateAdminServiceSchema,
updateAdminAppointmentStatusSchema, adminBarberParamsSchema  } from "../schemas/admin.schema.js";

export const adminRouter = Router();
const SERVICE_DURATION_MINUTES = 30;
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


const adminServiceSelect = {
  id: true,
  name: true,
  description: true,
  durationMinutes: true,
  price: true,
  active: true,
  createdAt: true,
  updatedAt: true,

  _count: {
    select: {
      barbers: true,
      appointments: true,
    },
  },
} satisfies Prisma.ServiceSelect;

type AdminService =
  Prisma.ServiceGetPayload<{
    select: typeof adminServiceSelect;
  }>;

function formatAdminService(
  service: AdminService,
) {
  return {
    ...service,
    price: Number(service.price),
  };
}

adminRouter.get(
  "/services",
  async (_req, res) => {
    try {
      const services =
        await prisma.service.findMany({
          orderBy: [
            {
              active: "desc",
            },
            {
              name: "asc",
            },
          ],

          select:
            adminServiceSelect,
        });

      res.status(200).json({
        data: {
          services:
            services.map(
              formatAdminService,
            ),

          count: services.length,
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve admin services:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve admin services",
      });
    }
  },
);

adminRouter.post(
  "/services",
  async (req, res) => {
    const parsedBody =
      createAdminServiceSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        message:
          "Invalid service data",

        errors:
          parsedBody.error.flatten()
            .fieldErrors,

        issues:
          parsedBody.error.issues,
      });

      return;
    }

    try {
      const existingService =
        await prisma.service.findFirst({
          where: {
            name: {
              equals:
                parsedBody.data.name,

              mode: "insensitive",
            },
          },

          select: {
            id: true,
          },
        });

      if (existingService) {
        res.status(409).json({
          message:
            "A service with this name already exists",
        });

        return;
      }

      const createdService =
        await prisma.service.create({
          data: {
            name:
              parsedBody.data.name,

            description:
              parsedBody.data.description
                ?.trim() || null,

            price:
              parsedBody.data.price,

            active:
              parsedBody.data.active,

            durationMinutes:
              SERVICE_DURATION_MINUTES,
          },

          select:
            adminServiceSelect,
        });

      res.status(201).json({
        message:
          "Service created successfully",

        data: {
          service:
            formatAdminService(
              createdService,
            ),
        },
      });
    } catch (error) {
      console.error(
        "Failed to create admin service:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to create service",
      });
    }
  },
);

adminRouter.patch(
  "/services/:serviceId",
  async (req, res) => {
    const parsedParams =
      adminServiceParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        message:
          "Invalid service id",

        errors:
          parsedParams.error.flatten()
            .fieldErrors,
      });

      return;
    }

    const parsedBody =
      updateAdminServiceSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        message:
          "Invalid service data",

        errors:
          parsedBody.error.flatten()
            .fieldErrors,

        issues:
          parsedBody.error.issues,
      });

      return;
    }

    try {
      const service =
        await prisma.service.findUnique({
          where: {
            id:
              parsedParams.data
                .serviceId,
          },

          select: {
            id: true,
            name: true,
          },
        });

      if (!service) {
        res.status(404).json({
          message:
            "Service not found",
        });

        return;
      }

      if (
        parsedBody.data.name &&
        parsedBody.data.name !==
          service.name
      ) {
        const duplicateService =
          await prisma.service.findFirst({
            where: {
              id: {
                not: service.id,
              },

              name: {
                equals:
                  parsedBody.data.name,

                mode: "insensitive",
              },
            },

            select: {
              id: true,
            },
          });

        if (duplicateService) {
          res.status(409).json({
            message:
              "A service with this name already exists",
          });

          return;
        }
      }

      const updatedService =
        await prisma.service.update({
          where: {
            id: service.id,
          },

          data: {
            ...(parsedBody.data.name !==
              undefined && {
              name:
                parsedBody.data.name,
            }),

            ...(parsedBody.data
              .description !==
              undefined && {
              description:
                parsedBody.data
                  .description
                  ?.trim() || null,
            }),

            ...(parsedBody.data.price !==
              undefined && {
              price:
                parsedBody.data.price,
            }),

            ...(parsedBody.data.active !==
              undefined && {
              active:
                parsedBody.data.active,
            }),

            /*
             * Επιβάλλουμε ξανά τη σταθερή
             * διάρκεια και σε παλιά services.
             */
            durationMinutes:
              SERVICE_DURATION_MINUTES,
          },

          select:
            adminServiceSelect,
        });

      res.status(200).json({
        message:
          "Service updated successfully",

        data: {
          service:
            formatAdminService(
              updatedService,
            ),
        },
      });
    } catch (error) {
      console.error(
        "Failed to update admin service:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to update service",
      });
    }
  },
);

const adminBarberDetailsSelect = {
  id: true,
  name: true,
  bio: true,
  imageUrl: true,
  active: true,
  createdAt: true,
  updatedAt: true,

  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  },

  services: {
    orderBy: {
      service: {
        name: "asc",
      },
    },

    select: {
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          active: true,
        },
      },
    },
  },

  workingHours: {
    orderBy: {
      dayOfWeek: "asc",
    },

    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      active: true,
    },
  },
} satisfies Prisma.BarberSelect;

type AdminBarberDetails =
  Prisma.BarberGetPayload<{
    select:
      typeof adminBarberDetailsSelect;
  }>;

function formatAdminBarberDetails(
  barber: AdminBarberDetails,
) {
  return {
    ...barber,

    services:
      barber.services.map(
        ({ service }) => ({
          ...service,
          price: Number(
            service.price,
          ),
        }),
      ),
  };
}

adminRouter.get(
  "/barbers/:barberId/details",
  async (req, res) => {
    const parsedParams =
      adminBarberParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        message:
          "Invalid barber id",

        errors:
          parsedParams.error.flatten()
            .fieldErrors,
      });

      return;
    }

    try {
      const timeZone =
        process.env.BARBERSHOP_TIME_ZONE ??
        "Europe/Athens";

      const now =
        DateTime.now()
          .setZone(timeZone);

      const nowUtc =
        now.toUTC().toJSDate();

      const barber =
        await prisma.barber.findUnique({
          where: {
            id:
              parsedParams.data
                .barberId,
          },

          select:
            adminBarberDetailsSelect,
        });

      if (!barber) {
        res.status(404).json({
          message:
            "Barber not found",
        });

        return;
      }

      const [
        upcomingTimeOff,
        activeAppointments,
      ] = await Promise.all([
        prisma.timeOff.findMany({
          where: {
            barberId: barber.id,

            endsAt: {
              gt: nowUtc,
            },
          },

          orderBy: {
            startsAt: "asc",
          },

          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            reason: true,
          },
        }),

        prisma.appointment.findMany({
          where: {
            barberId: barber.id,

            status: {
              in: [
                "PENDING",
                "CONFIRMED",
              ],
            },

            startsAt: {
              gte: nowUtc,
            },
          },

          orderBy: {
            startsAt: "asc",
          },

          select:
            adminAppointmentSelect,
        }),
      ]);

      res.status(200).json({
        data: {
          barber:
            formatAdminBarberDetails(
              barber,
            ),

          upcomingTimeOff:
            upcomingTimeOff.map(
              (timeOff) => ({
                ...timeOff,

                localStartsAt:
                  DateTime.fromJSDate(
                    timeOff.startsAt,
                    {
                      zone: "utc",
                    },
                  )
                    .setZone(timeZone)
                    .toISO(),

                localEndsAt:
                  DateTime.fromJSDate(
                    timeOff.endsAt,
                    {
                      zone: "utc",
                    },
                  )
                    .setZone(timeZone)
                    .toISO(),

                timeZone,
              }),
            ),

          activeAppointments:
            activeAppointments.map(
              (appointment) =>
                formatAdminAppointment(
                  appointment,
                  timeZone,
                ),
            ),

          counts: {
            services:
              barber.services.length,

            workingDays:
              barber.workingHours.filter(
                (day) => day.active,
              ).length,

            upcomingTimeOff:
              upcomingTimeOff.length,

            activeAppointments:
              activeAppointments.length,
          },

          timeZone,
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve admin barber details:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve barber details",
      });
    }
  },
);