/*
  Warnings:

  - You are about to drop the column `denunciadoId` on the `Denuncia` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Denuncia" DROP CONSTRAINT "CompanionDenunciado_FK";

-- DropForeignKey
ALTER TABLE "Denuncia" DROP CONSTRAINT "UserDenunciado_FK";

-- AlterTable
ALTER TABLE "Denuncia" DROP COLUMN "denunciadoId",
ADD COLUMN     "denunciadoCompanionId" INTEGER,
ADD COLUMN     "denunciadoUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "CompanionDenunciado_FK" FOREIGN KEY ("denunciadoCompanionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "UserDenunciado_FK" FOREIGN KEY ("denunciadoUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
