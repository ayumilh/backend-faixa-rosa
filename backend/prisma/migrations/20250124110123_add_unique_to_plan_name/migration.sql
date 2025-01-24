/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Plan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "extraPlanId" INTEGER,
ADD COLUMN     "isBasic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_ExtraPlanPlans" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ExtraPlanPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExtraPlanToPlan" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ExtraPlanToPlan_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ExtraPlanPlans_B_index" ON "_ExtraPlanPlans"("B");

-- CreateIndex
CREATE INDEX "_ExtraPlanToPlan_B_index" ON "_ExtraPlanToPlan"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- AddForeignKey
ALTER TABLE "_ExtraPlanPlans" ADD CONSTRAINT "_ExtraPlanPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "ExtraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraPlanPlans" ADD CONSTRAINT "_ExtraPlanPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraPlanToPlan" ADD CONSTRAINT "_ExtraPlanToPlan_A_fkey" FOREIGN KEY ("A") REFERENCES "ExtraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraPlanToPlan" ADD CONSTRAINT "_ExtraPlanToPlan_B_fkey" FOREIGN KEY ("B") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
