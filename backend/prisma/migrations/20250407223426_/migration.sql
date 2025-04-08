/*
  Warnings:

  - You are about to drop the column `cardToken` on the `PlanSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `PlanSubscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "cardToken" TEXT,
ADD COLUMN     "issuer_id" TEXT,
ADD COLUMN     "paymentMethodId" TEXT DEFAULT 'default_method_id';

-- AlterTable
ALTER TABLE "PlanSubscription" DROP COLUMN "cardToken",
DROP COLUMN "transactionId";
