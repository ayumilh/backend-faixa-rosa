-- DropForeignKey
ALTER TABLE "PlanSubscription" DROP CONSTRAINT "PlanSubscription_planId_fkey";

-- AlterTable
ALTER TABLE "PlanSubscription" ALTER COLUMN "planId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
