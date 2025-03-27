/*
  Warnings:

  - A unique constraint covering the columns `[planSubscriptionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Payment_planSubscriptionId_key" ON "Payment"("planSubscriptionId");
