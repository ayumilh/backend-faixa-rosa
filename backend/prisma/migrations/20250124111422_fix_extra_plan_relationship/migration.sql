/*
  Warnings:

  - You are about to drop the `_ExtraPlanPlans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ExtraPlanToPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ExtraPlanPlans" DROP CONSTRAINT "_ExtraPlanPlans_A_fkey";

-- DropForeignKey
ALTER TABLE "_ExtraPlanPlans" DROP CONSTRAINT "_ExtraPlanPlans_B_fkey";

-- DropForeignKey
ALTER TABLE "_ExtraPlanToPlan" DROP CONSTRAINT "_ExtraPlanToPlan_A_fkey";

-- DropForeignKey
ALTER TABLE "_ExtraPlanToPlan" DROP CONSTRAINT "_ExtraPlanToPlan_B_fkey";

-- AlterTable
ALTER TABLE "ExtraPlan" ADD COLUMN     "planId" INTEGER;

-- DropTable
DROP TABLE "_ExtraPlanPlans";

-- DropTable
DROP TABLE "_ExtraPlanToPlan";

-- AddForeignKey
ALTER TABLE "ExtraPlan" ADD CONSTRAINT "ExtraPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
