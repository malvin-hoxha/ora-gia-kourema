/*
  Warnings:

  - A unique constraint covering the columns `[stripeCheckoutSessionId]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAY_AT_STORE', 'STRIPE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'EXPIRED', 'REFUNDED');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentExpiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAY_AT_STORE',
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "priceAtBooking" DECIMAL(10,2),
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "appointments_stripeCheckoutSessionId_key" ON "appointments"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_stripePaymentIntentId_key" ON "appointments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "appointments_paymentStatus_paymentExpiresAt_idx" ON "appointments"("paymentStatus", "paymentExpiresAt");
