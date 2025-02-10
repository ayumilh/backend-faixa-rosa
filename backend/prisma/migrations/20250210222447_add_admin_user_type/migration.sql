-- AlterEnum
ALTER TYPE "UserType" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Companion" ADD COLUMN     "documentStatus" TEXT NOT NULL DEFAULT 'PENDING';
