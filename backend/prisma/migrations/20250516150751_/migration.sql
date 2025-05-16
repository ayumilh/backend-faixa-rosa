/*
  Warnings:

  - A unique constraint covering the columns `[companionId,extraPlanId]` on the table `PlanSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlanSubscription_companionId_extraPlanId_key" ON "PlanSubscription"("companionId", "extraPlanId");
