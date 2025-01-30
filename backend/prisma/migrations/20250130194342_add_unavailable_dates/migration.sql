-- CreateTable
CREATE TABLE "UnavailableDates" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnavailableDates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UnavailableDates" ADD CONSTRAINT "UnavailableDates_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
