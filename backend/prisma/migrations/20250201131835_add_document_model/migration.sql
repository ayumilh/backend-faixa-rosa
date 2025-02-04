-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "fileFront" TEXT NOT NULL,
    "fileBack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
