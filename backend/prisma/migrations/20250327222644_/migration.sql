/*
  Warnings:

  - The `planSubscriptionId` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `planSubscriptionId` column on the `PlanSubscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_planSubscriptionId_fkey";

-- DropIndex
DROP INDEX "Payment_planSubscriptionId_key";

-- DropIndex
DROP INDEX "PlanSubscription_planSubscriptionId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "planSubscriptionId",
ADD COLUMN     "planSubscriptionId" INTEGER;

-- AlterTable
ALTER TABLE "PlanSubscription" DROP COLUMN "planSubscriptionId",
ADD COLUMN     "planSubscriptionId" INTEGER;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planSubscriptionId_fkey" FOREIGN KEY ("planSubscriptionId") REFERENCES "PlanSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
