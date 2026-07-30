import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { DateTime } from "luxon";
import { availableSlotsQuerySchema } from "../schemas/availability.schema.js";
import {
  createZonedDateTime,
  SLOT_INTERVAL_MINUTES,
  slotOverlapsAnyRange,
} from "../utils/availability.js";

import { z } from "zod";

export const barbersRouter = Router();

barbersRouter.get("/", async (_req, res) => {
  try {
    const barbers = await prisma.barber.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        bio: true,
        imageUrl: true,
        services: {
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

    const response = barbers.map((barber) => ({
      id: barber.id,
      name: barber.name,
      bio: barber.bio,
      imageUrl: barber.imageUrl,
      services: barber.services.map(({ service }) => ({
        id: service.id,
        name: service.name,
        duration: service.durationMinutes,
        price: Number(service.price),
      })),
    }));

    res.status(200).json({
      data: response,
    });
  } catch (error) {
    console.error("Failed to retrieve barbers:", error);

    res.status(500).json({
      message: "Unable to retrieve barbers",
    });
  }
});

barbersRouter.get(
  "/:barberId/available-slots",
  async (req, res) => {
    try {
      const { barberId } = req.params;

      const parsedQuery = availableSlotsQuerySchema.safeParse(
        req.query,
      );

      if (!parsedQuery.success) {

        const errors = z.flattenError(parsedQuery.error).fieldErrors;

        res.status(400).json({
          message: "Invalid availability query",
          errors,
        });

        return;
      }

      const { serviceId, date } = parsedQuery.data;

      const timeZone =
        process.env.BARBERSHOP_TIME_ZONE ?? "Europe/Athens";

      const selectedDate = DateTime.fromISO(date, {
        zone: timeZone,
      }).startOf("day");

      if (!selectedDate.isValid) {
        res.status(400).json({
          message: "Invalid date",
        });

        return;
      }

      const today = DateTime.now()
        .setZone(timeZone)
        .startOf("day");

      if (selectedDate < today) {
        res.status(400).json({
          message: "Availability cannot be requested for a past date",
        });

        return;
      }

      const latestAllowedDate = today.plus({
        days: 90,
      });

      if (selectedDate > latestAllowedDate) {
        res.status(400).json({
          message:
            "Availability can only be requested up to 90 days in advance",
        });

        return;
      }

      /*
       * Luxon:
       * Monday = 1
       * ...
       * Sunday = 7
       *
       * Database:
       * Sunday = 0
       * Monday = 1
       * ...
       * Saturday = 6
       */
      const dayOfWeek = selectedDate.weekday % 7;

      const barber = await prisma.barber.findFirst({
        where: {
          id: barberId,
          active: true,
          services: {
            some: {
              serviceId,
              service: {
                active: true,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,

          workingHours: {
            where: {
              dayOfWeek,
              active: true,
            },
            select: {
              startTime: true,
              endTime: true,
            },
          },

          services: {
            where: {
              serviceId,
            },
            select: {
              service: {
                select: {
                  id: true,
                  name: true,
                  durationMinutes: true,
                },
              },
            },
          },
        },
      });

      if (!barber) {
        res.status(404).json({
          message:
            "Barber was not found or does not offer this service",
        });

        return;
      }

      const workingHours = barber.workingHours[0];
      const barberService = barber.services[0]?.service;

      if (!barberService) {
        res.status(404).json({
          message: "Service is not available for this barber",
        });

        return;
      }

      if (!workingHours) {
        res.status(200).json({
          data: {
            barber: {
              id: barber.id,
              name: barber.name,
            },
            service: barberService,
            date,
            timeZone,
            isWorkingDay: false,
            slots: [],
          },
        });

        return;
      }

      if (!workingHours.startTime || !workingHours.endTime) {
        throw new Error("Invalid working hours");
      }

      const workingDayStart = createZonedDateTime(
        date,
        workingHours.startTime,
        timeZone,
      );

      const workingDayEnd = createZonedDateTime(
        date,
        workingHours.endTime,
        timeZone,
      );

      if (!workingDayStart.isValid || !workingDayEnd.isValid) {
        throw new Error(
          `Invalid working hours for barber ${barber.id}`,
        );
      }

      const dayStartUtc = selectedDate
        .startOf("day")
        .toUTC()
        .toJSDate();

      const dayEndUtc = selectedDate
        .plus({ days: 1 })
        .startOf("day")
        .toUTC()
        .toJSDate();

      /*
       * Overlap condition:
       *
       * existing.startsAt < requestedEnd
       * existing.endsAt > requestedStart
       */
      const [appointments, timeOff] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            barberId,
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
            startsAt: {
              lt: dayEndUtc,
            },
            endsAt: {
              gt: dayStartUtc,
            },
          },
          select: {
            startsAt: true,
            endsAt: true,
          },
        }),

        prisma.timeOff.findMany({
          where: {
            barberId,
            startsAt: {
              lt: dayEndUtc,
            },
            endsAt: {
              gt: dayStartUtc,
            },
          },
          select: {
            startsAt: true,
            endsAt: true,
          },
        }),
      ]);

      const blockedRanges = [
        ...appointments,
        ...timeOff,
      ];

      const now = DateTime.now().setZone(timeZone);
      const slots = [];

      let currentSlotStart = workingDayStart;

      while (currentSlotStart < workingDayEnd) {
        const currentSlotEnd = currentSlotStart.plus({
          minutes: barberService.durationMinutes,
        });

        const fitsInsideWorkingHours =
          currentSlotEnd <= workingDayEnd;

        const isInTheFuture = currentSlotStart > now;

        const overlapsBlockedRange = slotOverlapsAnyRange(
          currentSlotStart,
          currentSlotEnd,
          blockedRanges,
        );

        if (
          fitsInsideWorkingHours &&
          isInTheFuture &&
          !overlapsBlockedRange
        ) {
          slots.push({
            startsAt: currentSlotStart.toUTC().toISO(),
            endsAt: currentSlotEnd.toUTC().toISO(),
            localStartsAt: currentSlotStart.toISO(),
            localEndsAt: currentSlotEnd.toISO(),
            label: currentSlotStart.toFormat("HH:mm"),
          });
        }

        currentSlotStart = currentSlotStart.plus({
          minutes: SLOT_INTERVAL_MINUTES,
        });
      }

      res.status(200).json({
        data: {
          barber: {
            id: barber.id,
            name: barber.name,
          },

          service: {
            id: barberService.id,
            name: barberService.name,
            durationMinutes:
              barberService.durationMinutes,
          },

          date,
          timeZone,
          isWorkingDay: true,

          workingHours: {
            startTime: workingHours.startTime,
            endTime: workingHours.endTime,
          },

          slots,
        },
      });
    } catch (error) {
      console.error(
        "Failed to calculate available slots:",
        error,
      );

      res.status(500).json({
        message: "Unable to calculate available slots",
      });
    }
  },
);

barbersRouter.get("/:barberId", async (req, res) => {
  try {
    const { barberId } = req.params;

    const barber = await prisma.barber.findFirst({
      where: {
        id: barberId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        bio: true,
        imageUrl: true,
        services: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                durationMinutes: true,
                price: true,
              },
            },
          },
        },
        workingHours: {
          where: {
            active: true,
          },
          orderBy: {
            dayOfWeek: "asc",
          },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!barber) {
      res.status(404).json({
        message: "Barber not found",
      });

      return;
    }

    res.status(200).json({
      data: {
        id: barber.id,
        name: barber.name,
        bio: barber.bio,
        imageUrl: barber.imageUrl,
        services: barber.services.map(({ service }) => ({
          id: service.id,
          name: service.name,
          description: service.description ?? "",
          duration: service.durationMinutes,
          price: Number(service.price),
        })),
        workingHours: barber.workingHours,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve barber:", error);

    res.status(500).json({
      message: "Unable to retrieve barber",
    });
  }
});