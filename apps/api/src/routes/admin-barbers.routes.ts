import { Router } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.middleware.js";
import {
  adminBarberParamsSchema,
  createAdminBarberSchema,
  updateAdminBarberSchema,
  updateAdminBarberWorkingHoursSchema,
  adminBarberTimeOffParamsSchema
} from "../schemas/admin-barbers.schema.js";

export const adminBarbersRouter = Router();

adminBarbersRouter.use(
  requireAuth,
  requireRole("ADMIN"),
);

const adminBarberSelect = {
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
          active: true,
          durationMinutes: true,
          price: true,
        },
      },
    },
  },
  _count: {
    select: {
      appointments: true,
      timeOff: true,
      workingHours: true,
    },
  },
} satisfies Prisma.BarberSelect;

const adminWorkingHoursSelect = {
  id: true,
  barberId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  active: true,
} satisfies Prisma.WorkingHoursSelect;

type AdminBarber = Prisma.BarberGetPayload<{
  select: typeof adminBarberSelect;
}>;

function formatAdminBarber(barber: AdminBarber) {
  return {
    ...barber,
    services: barber.services.map(({ service }) => ({
      ...service,
      price: Number(service.price),
    })),
  };
}

async function validateServiceIds(serviceIds: string[]) {
  const uniqueServiceIds = [...new Set(serviceIds)];

  if (uniqueServiceIds.length === 0) {
    return uniqueServiceIds;
  }

  const services = await prisma.service.findMany({
    where: {
      id: {
        in: uniqueServiceIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (services.length !== uniqueServiceIds.length) {
    return null;
  }

  return uniqueServiceIds;
}

async function validateBarberUser(
  userId: string | null | undefined,
  currentBarberId?: string,
) {
  if (userId === undefined || userId === null) {
    return true;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "BARBER",
      OR: [
        {
          barber: null,
        },
        ...(currentBarberId
          ? [
              {
                barber: {
                  is: {
                    id: currentBarberId,
                  },
                },
              },
            ]
          : []),
      ],
    },
    select: {
      id: true,
    },
  });

  return Boolean(user);
}

adminBarbersRouter.get(
  "/barber-users",
  async (_req, res) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: "BARBER",
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          barber: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(200).json({
        data: {
          users,
        },
      });
    } catch (error) {
      console.error("Failed to retrieve barber users:", error);

      res.status(500).json({
        message: "Unable to retrieve barber users",
      });
    }
  },
);

adminBarbersRouter.get(
  "/barbers",
  async (_req, res) => {
    try {
      const barbers = await prisma.barber.findMany({
        orderBy: [
          {
            active: "desc",
          },
          {
            name: "asc",
          },
        ],
        select: adminBarberSelect,
      });

      res.status(200).json({
        data: {
          barbers: barbers.map(formatAdminBarber),
          count: barbers.length,
        },
      });
    } catch (error) {
      console.error("Failed to retrieve admin barbers:", error);

      res.status(500).json({
        message: "Unable to retrieve barbers",
      });
    }
  },
);

adminBarbersRouter.post(
  "/barbers",
  async (req, res) => {
    const parsedBody = createAdminBarberSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json({
        message: "Invalid barber data",
        errors: parsedBody.error.flatten().fieldErrors,
        issues: parsedBody.error.issues,
      });
      return;
    }

    try {
      const duplicateName = await prisma.barber.findFirst({
        where: {
          name: {
            equals: parsedBody.data.name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicateName) {
        res.status(409).json({
          message: "A barber with this name already exists",
        });
        return;
      }

      const serviceIds = await validateServiceIds(
        parsedBody.data.serviceIds,
      );

      if (!serviceIds) {
        res.status(400).json({
          message: "One or more services do not exist",
        });
        return;
      }

      const validUser = await validateBarberUser(
        parsedBody.data.userId,
      );

      if (!validUser) {
        res.status(409).json({
          message:
            "The selected user is not an available BARBER account",
        });
        return;
      }

      const createdBarber = await prisma.barber.create({
        data: {
          name: parsedBody.data.name,
          bio: parsedBody.data.bio?.trim() || null,
          imageUrl: parsedBody.data.imageUrl?.trim() || null,
          active: parsedBody.data.active,
          userId: parsedBody.data.userId ?? null,
          services: {
            create: serviceIds.map((serviceId) => ({
              serviceId,
            })),
          },
        },
        select: adminBarberSelect,
      });

      res.status(201).json({
        message: "Barber created successfully",
        data: {
          barber: formatAdminBarber(createdBarber),
        },
      });
    } catch (error) {
      console.error("Failed to create admin barber:", error);

      res.status(500).json({
        message: "Unable to create barber",
      });
    }
  },
);

adminBarbersRouter.patch(
  "/barbers/:barberId",
  async (req, res) => {
    const parsedParams = adminBarberParamsSchema.safeParse(req.params);
    const parsedBody = updateAdminBarberSchema.safeParse(req.body);

    if (!parsedParams.success) {
      res.status(400).json({
        message: "Invalid barber id",
        errors: parsedParams.error.flatten().fieldErrors,
      });
      return;
    }

    if (!parsedBody.success) {
      res.status(400).json({
        message: "Invalid barber data",
        errors: parsedBody.error.flatten().fieldErrors,
        issues: parsedBody.error.issues,
      });
      return;
    }

    try {
      const barber = await prisma.barber.findUnique({
        where: {
          id: parsedParams.data.barberId,
        },
        select: {
          id: true,
          name: true,
          active: true,
        },
      });

      if (!barber) {
        res.status(404).json({
          message: "Barber not found",
        });
        return;
      }

      if (
        parsedBody.data.name &&
        parsedBody.data.name !== barber.name
      ) {
        const duplicateName = await prisma.barber.findFirst({
          where: {
            id: {
              not: barber.id,
            },
            name: {
              equals: parsedBody.data.name,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

        if (duplicateName) {
          res.status(409).json({
            message: "A barber with this name already exists",
          });
          return;
        }
      }

      if (
        barber.active &&
        parsedBody.data.active === false
      ) {
        const activeAppointments = await prisma.appointment.count({
          where: {
            barberId: barber.id,
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
            startsAt: {
              gte: new Date(),
            },
          },
        });

        if (activeAppointments > 0) {
          res.status(409).json({
            message:
              "The barber has future active appointments and cannot be deactivated",
          });
          return;
        }
      }

      const validUser = await validateBarberUser(
        parsedBody.data.userId,
        barber.id,
      );

      if (!validUser) {
        res.status(409).json({
          message:
            "The selected user is not an available BARBER account",
        });
        return;
      }

      const serviceIds =
        parsedBody.data.serviceIds === undefined
          ? undefined
          : await validateServiceIds(parsedBody.data.serviceIds);

      if (serviceIds === null) {
        res.status(400).json({
          message: "One or more services do not exist",
        });
        return;
      }

      const updatedBarber = await prisma.$transaction(
        async (transaction) => {
          if (serviceIds !== undefined) {
            await transaction.barberService.deleteMany({
              where: {
                barberId: barber.id,
              },
            });

            if (serviceIds.length > 0) {
              await transaction.barberService.createMany({
                data: serviceIds.map((serviceId) => ({
                  barberId: barber.id,
                  serviceId,
                })),
              });
            }
          }

          return transaction.barber.update({
            where: {
              id: barber.id,
            },
            data: {
              ...(parsedBody.data.name !== undefined && {
                name: parsedBody.data.name,
              }),
              ...(parsedBody.data.bio !== undefined && {
                bio: parsedBody.data.bio?.trim() || null,
              }),
              ...(parsedBody.data.imageUrl !== undefined && {
                imageUrl:
                  parsedBody.data.imageUrl?.trim() || null,
              }),
              ...(parsedBody.data.active !== undefined && {
                active: parsedBody.data.active,
              }),
              ...(parsedBody.data.userId !== undefined && {
                userId: parsedBody.data.userId,
              }),
            },
            select: adminBarberSelect,
          });
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      res.status(200).json({
        message: "Barber updated successfully",
        data: {
          barber: formatAdminBarber(updatedBarber),
        },
      });
    } catch (error) {
      console.error("Failed to update admin barber:", error);

      res.status(500).json({
        message: "Unable to update barber",
      });
    }
  },
);

adminBarbersRouter.get(
  "/barbers/:barberId/working-hours",
  async (req, res) => {
    const parsedParams =
      adminBarberParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        message: "Invalid barber id",
        errors:
          parsedParams.error.flatten()
            .fieldErrors,
      });

      return;
    }

    try {
      const barber =
        await prisma.barber.findUnique({
          where: {
            id:
              parsedParams.data
                .barberId,
          },

          select: {
            id: true,
            name: true,
          },
        });

      if (!barber) {
        res.status(404).json({
          message: "Barber not found",
        });

        return;
      }

      const workingHours =
        await prisma.workingHours.findMany({
          where: {
            barberId: barber.id,
          },

          orderBy: {
            dayOfWeek: "asc",
          },

          select:
            adminWorkingHoursSelect,
        });

      res.status(200).json({
        data: {
          barber,
          workingHours,
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve admin barber working hours:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve barber working hours",
      });
    }
  },
);

adminBarbersRouter.put(
  "/barbers/:barberId/working-hours",
  async (req, res) => {
    const parsedParams =
      adminBarberParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        message: "Invalid barber id",
        errors:
          parsedParams.error.flatten()
            .fieldErrors,
      });

      return;
    }

    const parsedBody =
      updateAdminBarberWorkingHoursSchema.safeParse(
        req.body,
      );

    if (!parsedBody.success) {
      res.status(400).json({
        message:
          "Invalid working hours data",

        errors:
          parsedBody.error.flatten()
            .fieldErrors,

        issues:
          parsedBody.error.issues,
      });

      return;
    }

    try {
      const barber =
        await prisma.barber.findUnique({
          where: {
            id:
              parsedParams.data
                .barberId,
          },

          select: {
            id: true,
            name: true,
          },
        });

      if (!barber) {
        res.status(404).json({
          message: "Barber not found",
        });

        return;
      }

      await prisma.$transaction(
        parsedBody.data.workingHours.map(
          (workingHour) =>
            prisma.workingHours.upsert({
              where: {
                barberId_dayOfWeek: {
                  barberId: barber.id,
                  dayOfWeek:
                    workingHour.dayOfWeek,
                },
              },

              update: {
                startTime:
                  workingHour.active
                    ? workingHour.startTime
                    : null,

                endTime:
                  workingHour.active
                    ? workingHour.endTime
                    : null,

                active:
                  workingHour.active,
              },

              create: {
                barberId: barber.id,
                dayOfWeek:
                  workingHour.dayOfWeek,

                startTime:
                  workingHour.active
                    ? workingHour.startTime
                    : null,

                endTime:
                  workingHour.active
                    ? workingHour.endTime
                    : null,

                active:
                  workingHour.active,
              },
            }),
        ),
      );

      const updatedWorkingHours =
        await prisma.workingHours.findMany({
          where: {
            barberId: barber.id,
          },

          orderBy: {
            dayOfWeek: "asc",
          },

          select:
            adminWorkingHoursSelect,
        });

      res.status(200).json({
        message:
          "Barber working hours updated successfully",

        data: {
          barber,
          workingHours:
            updatedWorkingHours,
        },
      });
    } catch (error) {
      console.error(
        "Failed to update admin barber working hours:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to update barber working hours",
      });
    }
  },
);

adminBarbersRouter.delete(
  "/barbers/:barberId/time-off/:timeOffId",
  async (req, res) => {
    const parsedParams =
      adminBarberTimeOffParamsSchema.safeParse(
        req.params,
      );

    if (!parsedParams.success) {
      res.status(400).json({
        message:
          "Invalid time off parameters",

        errors:
          parsedParams.error.flatten()
            .fieldErrors,
      });

      return;
    }

    try {
      const {
        barberId,
        timeOffId,
      } = parsedParams.data;

      const barber =
        await prisma.barber.findUnique({
          where: {
            id: barberId,
          },

          select: {
            id: true,
            name: true,
          },
        });

      if (!barber) {
        res.status(404).json({
          message: "Barber not found",
        });

        return;
      }

      const timeOff =
        await prisma.timeOff.findFirst({
          where: {
            id: timeOffId,
            barberId,
          },

          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            reason: true,
          },
        });

      if (!timeOff) {
        res.status(404).json({
          message: "Time off not found",
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
          timeOff,
        },
      });
    } catch (error) {
      console.error(
        "Failed to delete admin barber time off:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to delete time off",
      });
    }
  },
);