/*
  Warnings:

  - You are about to drop the column `anexo` on the `Denuncia` table. All the data in the column will be lost.
  - You are about to drop the column `denunciadoType` on the `Denuncia` table. All the data in the column will be lost.
  - You are about to drop the column `denunciadoUserId` on the `Denuncia` table. All the data in the column will be lost.
  - You are about to drop the column `denuncianteId` on the `Denuncia` table. All the data in the column will be lost.
  - You are about to drop the column `denuncianteType` on the `Denuncia` table. All the data in the column will be lost.
  - Made the column `descricao` on table `Denuncia` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Denuncia" DROP CONSTRAINT "CompanionDenunciante_FK";

-- DropForeignKey
ALTER TABLE "Denuncia" DROP CONSTRAINT "UserDenunciado_FK";

-- DropForeignKey
ALTER TABLE "Denuncia" DROP CONSTRAINT "UserDenunciante_FK";

-- AlterTable
ALTER TABLE "Denuncia" DROP COLUMN "anexo",
DROP COLUMN "denunciadoType",
DROP COLUMN "denunciadoUserId",
DROP COLUMN "denuncianteId",
DROP COLUMN "denuncianteType",
ADD COLUMN     "denunciadoContractorId" INTEGER,
ADD COLUMN     "denuncianteCompanionId" INTEGER,
ADD COLUMN     "denuncianteContractorId" INTEGER,
ALTER COLUMN "descricao" SET NOT NULL;

-- RenameForeignKey
ALTER TABLE "Denuncia" RENAME CONSTRAINT "CompanionDenunciado_FK" TO "Denuncia_denunciadoCompanionId_fkey";

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_denuncianteCompanionId_fkey" FOREIGN KEY ("denuncianteCompanionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_denuncianteContractorId_fkey" FOREIGN KEY ("denuncianteContractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_denunciadoContractorId_fkey" FOREIGN KEY ("denunciadoContractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
