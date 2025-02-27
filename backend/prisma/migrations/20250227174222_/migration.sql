/*
  Warnings:

  - A unique constraint covering the columns `[userName]` on the table `Companion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userName]` on the table `Contractor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Companion" ADD COLUMN     "userName" TEXT NOT NULL DEFAULT 'defaultUserName';

-- AlterTable
ALTER TABLE "Contractor" ADD COLUMN     "userName" TEXT NOT NULL DEFAULT 'defaultUserName';

-- CreateIndex
CREATE UNIQUE INDEX "Companion_userName_key" ON "Companion"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_userName_key" ON "Contractor"("userName");
