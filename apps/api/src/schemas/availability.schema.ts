import { z } from "zod";

export const availableSlotsQuerySchema = z.object({
  serviceId: z
    .string()
    .trim()
    .min(1, "serviceId is required"),

  date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "date must use the YYYY-MM-DD format",
    ),
});