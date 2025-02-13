-- AlterTable
ALTER TABLE "PlanSubscription" ADD COLUMN     "extraPlanId" INTEGER;

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_extraPlanId_fkey" FOREIGN KEY ("extraPlanId") REFERENCES "ExtraPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
