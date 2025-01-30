/*
  Warnings:

  - You are about to drop the `AtendimentoCompanion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CabeloCompanion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CorpoCompanion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EstaturaCompanion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EtniaCompanion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PubisCompanion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SeiosCompanion` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `details` to the `ContactMethodCompanion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AtendimentoCompanion" DROP CONSTRAINT "AtendimentoCompanion_companionId_fkey";

-- DropForeignKey
ALTER TABLE "CabeloCompanion" DROP CONSTRAINT "CabeloCompanion_companionId_fkey";

-- DropForeignKey
ALTER TABLE "CorpoCompanion" DROP CONSTRAINT "CorpoCompanion_companionId_fkey";

-- DropForeignKey
ALTER TABLE "EstaturaCompanion" DROP CONSTRAINT "EstaturaCompanion_companionId_fkey";

-- DropForeignKey
ALTER TABLE "EtniaCompanion" DROP CONSTRAINT "EtniaCompanion_companionId_fkey";

-- DropForeignKey
ALTER TABLE "PubisCompanion" DROP CONSTRAINT "PubisCompanion_companionId_fkey";

-- DropForeignKey
ALTER TABLE "SeiosCompanion" DROP CONSTRAINT "SeiosCompanion_companionId_fkey";

-- AlterTable
ALTER TABLE "ContactMethodCompanion" ADD COLUMN     "details" TEXT NOT NULL;

-- DropTable
DROP TABLE "AtendimentoCompanion";

-- DropTable
DROP TABLE "CabeloCompanion";

-- DropTable
DROP TABLE "CorpoCompanion";

-- DropTable
DROP TABLE "EstaturaCompanion";

-- DropTable
DROP TABLE "EtniaCompanion";

-- DropTable
DROP TABLE "PubisCompanion";

-- DropTable
DROP TABLE "SeiosCompanion";

-- CreateTable
CREATE TABLE "ServiceCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "atendimento" "Atendimento" NOT NULL,

    CONSTRAINT "ServiceCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalCharacteristics" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "genitalia" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "height" INTEGER NOT NULL,
    "estatura" "Estatura" NOT NULL,
    "ethnicity" "Etnia" NOT NULL,
    "eyeColor" TEXT NOT NULL,
    "hairStyle" "Cabelo" NOT NULL,
    "hairLength" TEXT NOT NULL,
    "shoeSize" INTEGER NOT NULL,
    "hasSilicone" BOOLEAN NOT NULL,
    "hasTattoos" BOOLEAN NOT NULL,
    "hasPiercings" BOOLEAN NOT NULL,
    "smoker" BOOLEAN NOT NULL,
    "pubis" "Pubis" NOT NULL,
    "bodyType" "Corpo" NOT NULL,
    "breastType" "Seios" NOT NULL,

    CONSTRAINT "PhysicalCharacteristics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalCharacteristics_companionId_key" ON "PhysicalCharacteristics"("companionId");

-- AddForeignKey
ALTER TABLE "ServiceCompanion" ADD CONSTRAINT "ServiceCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalCharacteristics" ADD CONSTRAINT "PhysicalCharacteristics_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
