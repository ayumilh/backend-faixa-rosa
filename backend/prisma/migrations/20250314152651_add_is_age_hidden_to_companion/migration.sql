-- AlterTable
ALTER TABLE "Companion" ADD COLUMN     "isAgeHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" SET DATA TYPE VARCHAR(15);
