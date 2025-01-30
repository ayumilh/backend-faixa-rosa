/*
  Warnings:

  - You are about to drop the column `lugar` on the `LocationCompanion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LocationCompanion" DROP COLUMN "lugar";

-- DropEnum
DROP TYPE "Lugar";
