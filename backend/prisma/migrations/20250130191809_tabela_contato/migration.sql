/*
  Warnings:

  - You are about to drop the column `contactMethod` on the `ContactMethodCompanion` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `ContactMethodCompanion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ContactMethodCompanion" DROP COLUMN "contactMethod",
DROP COLUMN "details",
ADD COLUMN     "phoneNumber" VARCHAR(15),
ADD COLUMN     "telegramMessage" VARCHAR(255),
ADD COLUMN     "telegramUsername" VARCHAR(32),
ADD COLUMN     "whatsappMessage" VARCHAR(255),
ADD COLUMN     "whatsappNumber" VARCHAR(15);
