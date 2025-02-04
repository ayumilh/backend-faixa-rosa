/*
  Warnings:

  - You are about to drop the column `extraPlanId` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `PlanSubscription` table. All the data in the column will be lost.
  - You are about to drop the `_UserExtraPlans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserPlanTypes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `companionId` to the `PlanSubscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PlanSubscription" DROP CONSTRAINT "PlanSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_planId_fkey";

-- DropForeignKey
ALTER TABLE "_UserExtraPlans" DROP CONSTRAINT "_UserExtraPlans_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserExtraPlans" DROP CONSTRAINT "_UserExtraPlans_B_fkey";

-- DropForeignKey
ALTER TABLE "_UserPlanTypes" DROP CONSTRAINT "_UserPlanTypes_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserPlanTypes" DROP CONSTRAINT "_UserPlanTypes_B_fkey";

-- AlterTable
ALTER TABLE "Companion" ADD COLUMN     "planTypeId" INTEGER,
ALTER COLUMN "profileStatus" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "extraPlanId";

-- AlterTable
ALTER TABLE "PlanSubscription" DROP COLUMN "userId",
ADD COLUMN     "companionId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_UserExtraPlans";

-- DropTable
DROP TABLE "_UserPlanTypes";

-- CreateTable
CREATE TABLE "_PlanExtraPlans" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PlanExtraPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CompanionExtraPlans" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CompanionExtraPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PlanExtraPlans_B_index" ON "_PlanExtraPlans"("B");

-- CreateIndex
CREATE INDEX "_CompanionExtraPlans_B_index" ON "_CompanionExtraPlans"("B");

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "PlanType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanExtraPlans" ADD CONSTRAINT "_PlanExtraPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "ExtraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanExtraPlans" ADD CONSTRAINT "_PlanExtraPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanionExtraPlans" ADD CONSTRAINT "_CompanionExtraPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanionExtraPlans" ADD CONSTRAINT "_CompanionExtraPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "ExtraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
