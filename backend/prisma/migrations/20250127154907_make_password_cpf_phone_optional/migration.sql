/*
  Warnings:

  - You are about to alter the column `firstName` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `lastName` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(320)`.
  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to alter the column `cpf` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(11)`.
  - You are about to alter the column `phone` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(11)`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "firstName" SET DEFAULT '',
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "lastName" SET DEFAULT '',
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(320),
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "password" SET DEFAULT '',
ALTER COLUMN "password" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "cpf" DROP NOT NULL,
ALTER COLUMN "cpf" SET DEFAULT '',
ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(11),
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "phone" SET DEFAULT '',
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(11);
