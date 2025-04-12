/*
  Warnings:

  - You are about to drop the column `cardToken` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "cardToken",
ADD COLUMN     "cardId" TEXT,
ADD COLUMN     "customerId" TEXT;
