/*
  Warnings:

  - You are about to drop the column `planId` on the `ExtraPlan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExtraPlan" DROP CONSTRAINT "ExtraPlan_planId_fkey";

-- AlterTable
ALTER TABLE "ExtraPlan" DROP COLUMN "planId";
