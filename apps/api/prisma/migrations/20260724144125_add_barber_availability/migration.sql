-- CreateTable
CREATE TABLE "barber_services" (
    "barberId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "barber_services_pkey" PRIMARY KEY ("barberId","serviceId")
);

-- CreateTable
CREATE TABLE "working_hours" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_off" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "time_off_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "barber_services_serviceId_idx" ON "barber_services"("serviceId");

-- CreateIndex
CREATE INDEX "working_hours_barberId_idx" ON "working_hours"("barberId");

-- CreateIndex
CREATE UNIQUE INDEX "working_hours_barberId_dayOfWeek_key" ON "working_hours"("barberId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "time_off_barberId_startsAt_endsAt_idx" ON "time_off"("barberId", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "barber_services" ADD CONSTRAINT "barber_services_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_services" ADD CONSTRAINT "barber_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
