-- CreateEnum
CREATE TYPE "AppointmentCancelledBy" AS ENUM ('CUSTOMER', 'BARBER', 'ADMIN', 'SYSTEM');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" "AppointmentCancelledBy";
