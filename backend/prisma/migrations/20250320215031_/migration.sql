-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_extraPlanId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_planId_extraPlanId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_planId_fkey";

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "planId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "_PaymentExtraPlans" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PaymentExtraPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PaymentExtraPlans_B_index" ON "_PaymentExtraPlans"("B");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_extraPlanId_fkey" FOREIGN KEY ("planId", "extraPlanId") REFERENCES "PlanSubscription"("planId", "extraPlanId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentExtraPlans" ADD CONSTRAINT "_PaymentExtraPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "ExtraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentExtraPlans" ADD CONSTRAINT "_PaymentExtraPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
