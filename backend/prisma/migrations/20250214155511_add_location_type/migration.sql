/*
  Warnings:

  - Changed the type of `name` on the `Location` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('A_DOMICILIO', 'FESTAS_EVENTOS', 'HOTEIS', 'LOCAL_PROPRIO', 'MOTEIS');

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "name",
ADD COLUMN     "name" "LocationType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");
