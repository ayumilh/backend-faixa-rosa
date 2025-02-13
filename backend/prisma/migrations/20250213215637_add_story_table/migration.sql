/*
  Warnings:

  - You are about to drop the column `bodyType` on the `PhysicalCharacteristics` table. All the data in the column will be lost.
  - You are about to drop the column `breastType` on the `PhysicalCharacteristics` table. All the data in the column will be lost.
  - You are about to drop the column `estatura` on the `PhysicalCharacteristics` table. All the data in the column will be lost.
  - You are about to drop the column `pubis` on the `PhysicalCharacteristics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PhysicalCharacteristics" DROP COLUMN "bodyType",
DROP COLUMN "breastType",
DROP COLUMN "estatura",
DROP COLUMN "pubis",
ALTER COLUMN "hasComparisonMedia" DROP NOT NULL;
