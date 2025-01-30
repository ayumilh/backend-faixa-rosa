/*
  Warnings:

  - Added the required column `description` to the `PhysicalCharacteristics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PhysicalCharacteristics" ADD COLUMN     "description" TEXT NOT NULL;
