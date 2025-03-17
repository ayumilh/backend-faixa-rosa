/*
  Warnings:

  - You are about to drop the column `tempPoints` on the `ExtraPlan` table. All the data in the column will be lost.
  - You are about to drop the column `cityChangeAllowed` on the `PlanType` table. All the data in the column will be lost.
  - You are about to drop the column `cityChangeFee` on the `PlanType` table. All the data in the column will be lost.
  - You are about to drop the column `basePoints` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `companyAddress` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `companyBio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `companyCity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `companyState` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `temporaryPoints` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalPoints` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExtraPlan" DROP COLUMN "tempPoints",
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "ExtraPlan_id_seq";

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Plan_id_seq";

-- AlterTable
ALTER TABLE "PlanType" DROP COLUMN "cityChangeAllowed",
DROP COLUMN "cityChangeFee",
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "PlanType_id_seq";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "basePoints",
DROP COLUMN "companyAddress",
DROP COLUMN "companyBio",
DROP COLUMN "companyCity",
DROP COLUMN "companyName",
DROP COLUMN "companyState",
DROP COLUMN "points",
DROP COLUMN "rank",
DROP COLUMN "temporaryPoints",
DROP COLUMN "totalPoints";

-- CreateTable
CREATE TABLE "CityChangeConfig" (
    "id" SERIAL NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 65.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityChangeConfig_pkey" PRIMARY KEY ("id")
);
