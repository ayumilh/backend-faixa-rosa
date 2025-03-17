/*
  Warnings:

  - You are about to alter the column `phoneNumber` on the `ContactMethodCompanion` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `VarChar(11)`.
  - You are about to alter the column `phone` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `VarChar(11)`.

*/
-- AlterTable
ALTER TABLE "ContactMethodCompanion" ALTER COLUMN "phoneNumber" SET DATA TYPE VARCHAR(11);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" SET DATA TYPE VARCHAR(11);
