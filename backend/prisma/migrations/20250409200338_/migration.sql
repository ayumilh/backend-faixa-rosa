-- CreateTable
CREATE TABLE "CarrouselImage" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrouselImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarrouselImage_companionId_order_key" ON "CarrouselImage"("companionId", "order");

-- AddForeignKey
ALTER TABLE "CarrouselImage" ADD CONSTRAINT "CarrouselImage_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
