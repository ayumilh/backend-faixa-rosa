/*
  Warnings:

  - Added the required column `denunciadoType` to the `Denuncia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Denuncia" ADD COLUMN     "denunciadoType" "UserType" NOT NULL;

-- RenameForeignKey
ALTER TABLE "Denuncia" RENAME CONSTRAINT "Denuncia_denunciadoId_fkey" TO "CompanionDenunciado_FK";

-- RenameForeignKey
ALTER TABLE "Denuncia" RENAME CONSTRAINT "Denuncia_denuncianteId_fkey" TO "CompanionDenunciante_FK";

-- RenameForeignKey
ALTER TABLE "Denuncia" RENAME CONSTRAINT "Denuncia_denuncianteUserId_fkey" TO "UserDenunciante_FK";

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "UserDenunciado_FK" FOREIGN KEY ("denunciadoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
