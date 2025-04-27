-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_companionId_fkey";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "contractorId" INTEGER,
ALTER COLUMN "companionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
