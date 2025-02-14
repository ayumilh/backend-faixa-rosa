-- CreateEnum
CREATE TYPE "AmenityType" AS ENUM ('WIFI', 'CHUVEIRO', 'AR_CONDICIONADO', 'ESTACIONAMENTO', 'FRIGOBAR', 'PRESERVATIVOS');

-- AlterTable
ALTER TABLE "LocationCompanion" ADD COLUMN     "amenities" "AmenityType"[];
