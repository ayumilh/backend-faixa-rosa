/*
  Warnings:

  - Changed the type of `gender` on the `PhysicalCharacteristics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `genitalia` on the `PhysicalCharacteristics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `eyeColor` on the `PhysicalCharacteristics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `hairLength` on the `PhysicalCharacteristics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `hairStyle` on the `PhysicalCharacteristics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "GenderType" AS ENUM ('MULHER_CISGENERO', 'HOMEM_CISGENERO', 'MULHER_TRANS', 'HOMEM_TRANS');

-- CreateEnum
CREATE TYPE "Genitalia" AS ENUM ('NATURAL', 'CIRURGIA');

-- CreateEnum
CREATE TYPE "hairStyle" AS ENUM ('LISO', 'CACHEADO', 'ONDULADO', 'CRESPO', 'RASPADO');

-- CreateEnum
CREATE TYPE "hairLength" AS ENUM ('CURTO', 'MEDIO', 'LONGO');

-- CreateEnum
CREATE TYPE "EyeColor" AS ENUM ('CASTANHOS', 'AZUIS', 'VERDES', 'CINZAS', 'PRETOS', 'OUTROS');

-- AlterTable
ALTER TABLE "PhysicalCharacteristics" DROP COLUMN "gender",
ADD COLUMN     "gender" "GenderType" NOT NULL,
DROP COLUMN "genitalia",
ADD COLUMN     "genitalia" "Genitalia" NOT NULL,
DROP COLUMN "eyeColor",
ADD COLUMN     "eyeColor" "EyeColor" NOT NULL,
DROP COLUMN "hairLength",
ADD COLUMN     "hairLength" "hairLength" NOT NULL,
ALTER COLUMN "shoeSize" SET DATA TYPE TEXT,
DROP COLUMN "hairStyle",
ADD COLUMN     "hairStyle" "hairStyle" NOT NULL;

-- DropEnum
DROP TYPE "Cabelo";
