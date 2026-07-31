import { z } from "zod";

export const staffAppointmentsQuerySchema =
  z.object({
    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "date must use the YYYY-MM-DD format",
      )
      .optional(),

    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ])
      .optional(),
  });

export const updateAppointmentStatusParamsSchema =
  z.object({
    appointmentId: z
      .string()
      .trim()
      .min(1, "appointmentId is required"),
  });

export const updateAppointmentStatusBodySchema =
  z.object({
    status: z.enum([
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ]),
  });


  const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Time must use the HH:mm format",
  );

const workingDaySchema = z
  .object({
    dayOfWeek: z
      .number()
      .int()
      .min(0)
      .max(6),

    active: z.boolean(),

    startTime: timeSchema.nullable(),
    endTime: timeSchema.nullable(),
  })
  .superRefine((day, context) => {
    if (!day.active) {
      return;
    }

    if (!day.startTime) {
      context.addIssue({
        code: "custom",
        path: ["startTime"],
        message:
          "startTime is required for an active working day",
      });
    }

    if (!day.endTime) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message:
          "endTime is required for an active working day",
      });
    }

    if (
      day.startTime &&
      day.endTime &&
      day.startTime >= day.endTime
    ) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message:
          "endTime must be later than startTime",
      });
    }
  });

export const updateWorkingHoursSchema = z
  .object({
    workingHours: z
      .array(workingDaySchema)
      .length(
        7,
        "Working hours must contain all 7 days",
      ),
  })
  .superRefine((data, context) => {
    const uniqueDays = new Set(
      data.workingHours.map(
        (day) => day.dayOfWeek,
      ),
    );

    if (uniqueDays.size !== 7) {
      context.addIssue({
        code: "custom",
        path: ["workingHours"],
        message:
          "Each dayOfWeek must appear exactly once",
      });
    }
  });

  const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use the YYYY-MM-DD format",
  );

export const previewTimeOffSchema = z
  .object({
    date: dateSchema,

    allDay: z.boolean(),

    startTime: timeSchema.nullable(),
    endTime: timeSchema.nullable(),

    reason: z
      .string()
      .trim()
      .max(
        250,
        "Reason must contain at most 250 characters",
      )
      .nullable()
      .optional(),
  })
  .superRefine((data, context) => {
    if (data.allDay) {
      return;
    }

    if (!data.startTime) {
      context.addIssue({
        code: "custom",
        path: ["startTime"],
        message:
          "startTime is required when allDay is false",
      });
    }

    if (!data.endTime) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message:
          "endTime is required when allDay is false",
      });
    }

    if (
      data.startTime &&
      data.endTime &&
      data.startTime >= data.endTime
    ) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message:
          "endTime must be later than startTime",
      });
    }
  });


  export const timeOffParamsSchema = z.object({
  timeOffId: z
    .string()
    .trim()
    .min(1, "timeOffId is required"),
});