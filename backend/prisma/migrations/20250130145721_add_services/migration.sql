/*
  Warnings:

  - You are about to drop the column `atendimento` on the `ServiceCompanion` table. All the data in the column will be lost.
  - You are about to drop the `LugarCompanion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LugarCompanion" DROP CONSTRAINT "LugarCompanion_companionId_fkey";

-- AlterTable
ALTER TABLE "ServiceCompanion" DROP COLUMN "atendimento",
ADD COLUMN     "isOffered" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "serviceId" INTEGER;

-- DropTable
DROP TABLE "LugarCompanion";

-- CreateTable
CREATE TABLE "LocationCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "lugar" "Lugar" NOT NULL,

    CONSTRAINT "LocationCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPrice" DOUBLE PRECISION,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- AddForeignKey
ALTER TABLE "ServiceCompanion" ADD CONSTRAINT "ServiceCompanion_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationCompanion" ADD CONSTRAINT "LocationCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
