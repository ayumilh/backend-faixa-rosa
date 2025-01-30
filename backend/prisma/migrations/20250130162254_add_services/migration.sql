/*
  Warnings:

  - Added the required column `isOffered` to the `ServiceOffered` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServiceOffered" ADD COLUMN     "isOffered" BOOLEAN NOT NULL;
