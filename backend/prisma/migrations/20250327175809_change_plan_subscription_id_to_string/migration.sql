-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_planSubscriptionId_fkey";

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "planSubscriptionId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "PlanSubscription" ALTER COLUMN "planSubscriptionId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planSubscriptionId_fkey" FOREIGN KEY ("planSubscriptionId") REFERENCES "PlanSubscription"("planSubscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;
