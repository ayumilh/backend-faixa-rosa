/*
  Warnings:

  - A unique constraint covering the columns `[planSubscriptionId]` on the table `PlanSubscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `planSubscriptionId` to the `PlanSubscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_planId_extraPlanId_fkey";

-- DropIndex
DROP INDEX "PlanSubscription_planId_extraPlanId_key";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "planSubscriptionId" INTEGER;

-- AlterTable
ALTER TABLE "PlanSubscription" ADD COLUMN     "planSubscriptionId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PlanSubscription_planSubscriptionId_key" ON "PlanSubscription"("planSubscriptionId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planSubscriptionId_fkey" FOREIGN KEY ("planSubscriptionId") REFERENCES "PlanSubscription"("planSubscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;
