import { z } from "zod";

const nullableText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .nullable()
    .optional();

export const adminBarberParamsSchema = z.object({
  barberId: z.string().trim().min(1, "barberId is required"),
});

export const createAdminBarberSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    bio: nullableText(1000),
    imageUrl: z.string().trim().url().nullable().optional(),
    active: z.boolean().optional().default(true),
    userId: z.string().trim().min(1).nullable().optional(),
    serviceIds: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const updateAdminBarberSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    bio: nullableText(1000),
    imageUrl: z.string().trim().url().nullable().optional(),
    active: z.boolean().optional(),
    userId: z.string().trim().min(1).nullable().optional(),
    serviceIds: z.array(z.string().trim().min(1)).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

  const timePattern =
  /^([01]\d|2[0-3]):[0-5]\d$/;

const adminWorkingHoursItemSchema =
  z
    .object({
      dayOfWeek: z
        .number()
        .int()
        .min(0)
        .max(6),

      startTime: z
        .string()
        .regex(
          timePattern,
          "startTime must use HH:mm format",
        )
        .nullable(),

      endTime: z
        .string()
        .regex(
          timePattern,
          "endTime must use HH:mm format",
        )
        .nullable(),

      active: z.boolean(),
    })
    .strict()
    .superRefine(
      (workingHour, context) => {
        if (!workingHour.active) {
          return;
        }

        if (!workingHour.startTime) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["startTime"],
            message:
              "startTime is required for an active day",
          });
        }

        if (!workingHour.endTime) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endTime"],
            message:
              "endTime is required for an active day",
          });
        }

        if (
          workingHour.startTime &&
          workingHour.endTime &&
          workingHour.startTime >=
            workingHour.endTime
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endTime"],
            message:
              "endTime must be later than startTime",
          });
        }
      },
    );

export const updateAdminBarberWorkingHoursSchema =
  z
    .object({
      workingHours: z
        .array(
          adminWorkingHoursItemSchema,
        )
        .length(
          7,
          "Working hours must contain all 7 days",
        ),
    })
    .strict()
    .superRefine((data, context) => {
      const dayNumbers =
        data.workingHours.map(
          (workingHour) =>
            workingHour.dayOfWeek,
        );

      const uniqueDayNumbers =
        new Set(dayNumbers);

      if (uniqueDayNumbers.size !== 7) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["workingHours"],
          message:
            "Each day of the week must appear exactly once",
        });
      }
    });

    export const adminBarberTimeOffParamsSchema =
  z.object({
    barberId: z
      .string()
      .trim()
      .min(
        1,
        "barberId is required",
      ),

    timeOffId: z
      .string()
      .trim()
      .min(
        1,
        "timeOffId is required",
      ),
  });