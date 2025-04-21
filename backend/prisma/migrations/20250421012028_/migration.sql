-- CreateTable
CREATE TABLE "Consent" (
    "id" SERIAL NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "consent_datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "browser_fingerprint" TEXT,
    "accepted" BOOLEAN NOT NULL,
    "user_id" INTEGER,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
