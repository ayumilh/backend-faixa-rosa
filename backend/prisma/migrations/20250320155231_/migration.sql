/*
  Warnings:

  - A unique constraint covering the columns `[planId,extraPlanId]` on the table `PlanSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "extraPlanId" INTEGER,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'default_method';

-- CreateIndex
CREATE UNIQUE INDEX "PlanSubscription_planId_extraPlanId_key" ON "PlanSubscription"("planId", "extraPlanId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_extraPlanId_fkey" FOREIGN KEY ("extraPlanId") REFERENCES "ExtraPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_extraPlanId_fkey" FOREIGN KEY ("planId", "extraPlanId") REFERENCES "PlanSubscription"("planId", "extraPlanId") ON DELETE RESTRICT ON UPDATE CASCADE;
