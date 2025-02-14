/*
  Warnings:

  - The values [BRANCAS,LATINAS,MULATAS,NEGRAS,ORIENTAIS] on the enum `Etnia` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `hairStyle` on the `PhysicalCharacteristics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Etnia_new" AS ENUM ('BRANCA', 'LATINA', 'MULATA', 'NEGRA', 'ORIENTAl', 'OUTRA');
ALTER TABLE "PhysicalCharacteristics" ALTER COLUMN "ethnicity" TYPE "Etnia_new" USING ("ethnicity"::text::"Etnia_new");
ALTER TYPE "Etnia" RENAME TO "Etnia_old";
ALTER TYPE "Etnia_new" RENAME TO "Etnia";
DROP TYPE "Etnia_old";
COMMIT;

-- AlterTable
ALTER TABLE "PhysicalCharacteristics" DROP COLUMN "hairStyle",
ADD COLUMN     "hairStyle" TEXT NOT NULL;
