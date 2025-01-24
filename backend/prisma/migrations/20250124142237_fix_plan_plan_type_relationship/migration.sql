-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "planTypeId" INTEGER;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "PlanType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
