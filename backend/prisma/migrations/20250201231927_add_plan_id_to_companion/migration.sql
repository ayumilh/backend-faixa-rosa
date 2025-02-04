-- AlterTable
ALTER TABLE "Companion" ADD COLUMN     "planId" INTEGER;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
