/*
  Warnings:

  - You are about to drop the column `cardExpirationDate` on the `PlanSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `cardLast4` on the `PlanSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `paymentGatewayTransactionId` on the `PlanSubscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlanSubscription" DROP COLUMN "cardExpirationDate",
DROP COLUMN "cardLast4",
DROP COLUMN "paymentGatewayTransactionId",
ADD COLUMN     "cardToken" TEXT DEFAULT '',
ADD COLUMN     "transactionId" TEXT DEFAULT '';
