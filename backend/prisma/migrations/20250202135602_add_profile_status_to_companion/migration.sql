/*
  Warnings:

  - You are about to drop the column `status` on the `Companion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Companion" DROP COLUMN "status",
ADD COLUMN     "profileStatus" TEXT NOT NULL DEFAULT 'pending';
