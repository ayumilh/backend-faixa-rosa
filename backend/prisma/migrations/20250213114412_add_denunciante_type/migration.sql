/*
  Warnings:

  - Added the required column `denuncianteType` to the `Denuncia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Denuncia" ADD COLUMN     "denuncianteType" "UserType" NOT NULL;

-- RenameForeignKey
ALTER TABLE "Denuncia" RENAME CONSTRAINT "Denuncia_denuncianteId_fkey" TO "Denuncia_denuncianteUserId_fkey";

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_denuncianteId_fkey" FOREIGN KEY ("denuncianteId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
