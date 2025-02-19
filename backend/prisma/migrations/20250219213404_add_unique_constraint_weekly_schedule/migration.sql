/*
  Warnings:

  - A unique constraint covering the columns `[companionId,dayOfWeek]` on the table `WeeklySchedule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WeeklySchedule_companionId_dayOfWeek_key" ON "WeeklySchedule"("companionId", "dayOfWeek");
