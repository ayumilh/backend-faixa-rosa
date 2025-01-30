/*
  Warnings:

  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceCompanion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceCompanion" DROP CONSTRAINT "ServiceCompanion_companionId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceCompanion" DROP CONSTRAINT "ServiceCompanion_serviceId_fkey";

-- DropTable
DROP TABLE "Service";

-- DropTable
DROP TABLE "ServiceCompanion";

-- CreateTable
CREATE TABLE "TimedServiceCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "timedServiceId" INTEGER,
    "isOffered" BOOLEAN NOT NULL DEFAULT true,
    "price" DOUBLE PRECISION,

    CONSTRAINT "TimedServiceCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCompanionOffered" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "isOffered" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ServiceCompanionOffered_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimedService" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPrice" DOUBLE PRECISION,

    CONSTRAINT "TimedService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOffered" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ServiceOffered_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimedService_name_key" ON "TimedService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOffered_name_key" ON "ServiceOffered"("name");

-- AddForeignKey
ALTER TABLE "TimedServiceCompanion" ADD CONSTRAINT "TimedServiceCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimedServiceCompanion" ADD CONSTRAINT "TimedServiceCompanion_timedServiceId_fkey" FOREIGN KEY ("timedServiceId") REFERENCES "TimedService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCompanionOffered" ADD CONSTRAINT "ServiceCompanionOffered_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCompanionOffered" ADD CONSTRAINT "ServiceCompanionOffered_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
