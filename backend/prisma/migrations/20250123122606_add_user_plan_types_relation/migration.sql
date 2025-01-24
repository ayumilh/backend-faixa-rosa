/*
  Warnings:

  - You are about to drop the column `isDarkMode` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Top10` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Top10` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `points` to the `Top10` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rank` to the `Top10` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Top10` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "isDarkMode";

-- AlterTable
ALTER TABLE "Top10" DROP COLUMN "updatedAt",
ADD COLUMN     "points" INTEGER NOT NULL,
ADD COLUMN     "rank" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "basePoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "planId" INTEGER,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rank" INTEGER,
ADD COLUMN     "temporaryPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PlanType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "accessDashboard" BOOLEAN NOT NULL DEFAULT false,
    "accessMetrics" BOOLEAN NOT NULL DEFAULT false,
    "accessConvenio" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "cityChangeAllowed" BOOLEAN NOT NULL DEFAULT true,
    "cityChangeFee" DOUBLE PRECISION NOT NULL,
    "isDarkMode" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,

    CONSTRAINT "PlanType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isTemporary" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "pointsBonus" INTEGER NOT NULL DEFAULT 0,
    "tempPoints" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "hasContact" BOOLEAN NOT NULL DEFAULT false,
    "canHideAge" BOOLEAN NOT NULL DEFAULT false,
    "hasPublicReviews" BOOLEAN NOT NULL DEFAULT false,
    "hasDarkMode" BOOLEAN NOT NULL DEFAULT false,
    "hasStories" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExtraPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserPlanTypes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserPlanTypes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserExtraPlans" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserExtraPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanType_name_key" ON "PlanType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraPlan_name_key" ON "ExtraPlan"("name");

-- CreateIndex
CREATE INDEX "_UserPlanTypes_B_index" ON "_UserPlanTypes"("B");

-- CreateIndex
CREATE INDEX "_UserExtraPlans_B_index" ON "_UserExtraPlans"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Top10_userId_key" ON "Top10"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Top10" ADD CONSTRAINT "Top10_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPlanTypes" ADD CONSTRAINT "_UserPlanTypes_A_fkey" FOREIGN KEY ("A") REFERENCES "PlanType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPlanTypes" ADD CONSTRAINT "_UserPlanTypes_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserExtraPlans" ADD CONSTRAINT "_UserExtraPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "ExtraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserExtraPlans" ADD CONSTRAINT "_UserExtraPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
