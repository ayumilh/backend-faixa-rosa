-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CONTRATANTE', 'ACOMPANHANTE', 'ANUNCIANTE', 'EMPRESA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARTAO_CREDITO', 'PIX', 'LUXO', 'ECONOMICAS');

-- CreateEnum
CREATE TYPE "AgeCategory" AS ENUM ('COROAS', 'NINFETAS');

-- CreateEnum
CREATE TYPE "Atendimento" AS ENUM ('HOMENS', 'MULHERES', 'CASAIS', 'DEFICIENTES_FISICOS');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('LIGACAO', 'WHATSAPP', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "Etnia" AS ENUM ('BRANCAS', 'LATINAS', 'MULATAS', 'NEGRAS', 'ORIENTAIS');

-- CreateEnum
CREATE TYPE "Cabelo" AS ENUM ('MORENAS', 'LOIRAS', 'RUIVAS');

-- CreateEnum
CREATE TYPE "Estatura" AS ENUM ('ALTAS', 'MIGNON');

-- CreateEnum
CREATE TYPE "Corpo" AS ENUM ('GORDINHAS', 'MAGRAS');

-- CreateEnum
CREATE TYPE "Seios" AS ENUM ('PEITUDAS', 'SEIOS_NATURAIS');

-- CreateEnum
CREATE TYPE "Pubis" AS ENUM ('PELUDAS', 'DEPILADO');

-- CreateEnum
CREATE TYPE "ServicosGerais" AS ENUM ('BEIJOS_BOCA', 'EJACULACAO_CORPO', 'FACIAL', 'FANTASIAS_DISFARCES', 'MASSAGEM_EROTICA', 'NAMORADINHA', 'ORAL_SEM_CAMISINHA', 'ORAL_COM_CAMISINHA', 'SEXO_ANAL', 'PSE');

-- CreateEnum
CREATE TYPE "ServicosEspeciais" AS ENUM ('BEIJO_NEGRO', 'CHUVA_DOURADA', 'FETICHISMO', 'GARGANTA_PROFUNDA', 'SADO_DURO', 'SADO_SUAVE', 'SQUIRTING', 'STRAP_ON');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('COMPRAS', 'ENTRETENIMENTO', 'SAUDE', 'OUTROS');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(50) DEFAULT '',
    "lastName" VARCHAR(100) DEFAULT '',
    "email" VARCHAR(320) NOT NULL,
    "password" VARCHAR(64) DEFAULT '',
    "birthDate" DATE,
    "cpf" VARCHAR(11),
    "phone" VARCHAR(11) DEFAULT '',
    "userType" "UserType" NOT NULL DEFAULT 'CONTRATANTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyCity" TEXT,
    "companyState" TEXT,
    "companyBio" TEXT,
    "basePoints" INTEGER NOT NULL DEFAULT 0,
    "planId" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "profileVisibility" BOOLEAN NOT NULL DEFAULT true,
    "rank" INTEGER,
    "temporaryPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "fileFront" TEXT NOT NULL,
    "fileBack" TEXT,
    "documentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isBasic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planTypeId" INTEGER,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSubscription" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Companion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "profileStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "lastOnline" TIMESTAMP(3) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "top10Id" INTEGER,
    "planId" INTEGER,
    "planTypeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMethodCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "whatsappNumber" VARCHAR(15),
    "whatsappMessage" VARCHAR(255),
    "telegramUsername" VARCHAR(32),
    "telegramMessage" VARCHAR(255),
    "phoneNumber" VARCHAR(15),

    CONSTRAINT "ContactMethodCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimedServiceCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "timedServiceId" INTEGER,
    "isOffered" BOOLEAN NOT NULL DEFAULT true,
    "price" DOUBLE PRECISION,

    CONSTRAINT "TimedServiceCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethodCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,

    CONSTRAINT "PaymentMethodCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalCharacteristics" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "genitalia" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "height" INTEGER NOT NULL,
    "estatura" "Estatura" NOT NULL,
    "ethnicity" "Etnia" NOT NULL,
    "eyeColor" TEXT NOT NULL,
    "hairStyle" "Cabelo" NOT NULL,
    "hairLength" TEXT NOT NULL,
    "shoeSize" INTEGER NOT NULL,
    "hasSilicone" BOOLEAN NOT NULL,
    "hasTattoos" BOOLEAN NOT NULL,
    "hasPiercings" BOOLEAN NOT NULL,
    "smoker" BOOLEAN NOT NULL,
    "pubis" "Pubis" NOT NULL,
    "bodyType" "Corpo" NOT NULL,
    "breastType" "Seios" NOT NULL,
    "description" TEXT,
    "comparisonMedia" TEXT,

    CONSTRAINT "PhysicalCharacteristics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgeCategoryCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "ageCategory" "AgeCategory" NOT NULL,

    CONSTRAINT "AgeCategoryCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCompanionOffered" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "isOffered" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION,

    CONSTRAINT "ServiceCompanionOffered_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicosGeraisCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "servico" "ServicosGerais" NOT NULL,

    CONSTRAINT "ServicosGeraisCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicosEspeciaisCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "servico" "ServicosEspeciais" NOT NULL,

    CONSTRAINT "ServicosEspeciaisCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "locationId" INTEGER,

    CONSTRAINT "LocationCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimedService" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPrice" DOUBLE PRECISION,

    CONSTRAINT "TimedService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOffered" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isOffered" BOOLEAN NOT NULL,

    CONSTRAINT "ServiceOffered_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySchedule" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnavailableDates" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnavailableDates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Top10" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "points" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Top10_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convenio" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "instagram" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "planId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convenio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Denuncia" (
    "id" SERIAL NOT NULL,
    "denuncianteId" INTEGER NOT NULL,
    "denunciadoId" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "descricao" TEXT,
    "anexo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Denuncia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT NOT NULL,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL,
    "lastOnline" TIMESTAMP(3) NOT NULL,
    "companionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER,
    "url" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PlanExtraPlans" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PlanExtraPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CompanionExtraPlans" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CompanionExtraPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "PlanType_name_key" ON "PlanType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraPlan_name_key" ON "ExtraPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Companion_userId_key" ON "Companion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalCharacteristics_companionId_key" ON "PhysicalCharacteristics"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "TimedService_name_key" ON "TimedService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOffered_name_key" ON "ServiceOffered"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Top10_userId_key" ON "Top10"("userId");

-- CreateIndex
CREATE INDEX "_PlanExtraPlans_B_index" ON "_PlanExtraPlans"("B");

-- CreateIndex
CREATE INDEX "_CompanionExtraPlans_B_index" ON "_CompanionExtraPlans"("B");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "PlanType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "PlanType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_top10Id_fkey" FOREIGN KEY ("top10Id") REFERENCES "Top10"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMethodCompanion" ADD CONSTRAINT "ContactMethodCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimedServiceCompanion" ADD CONSTRAINT "TimedServiceCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimedServiceCompanion" ADD CONSTRAINT "TimedServiceCompanion_timedServiceId_fkey" FOREIGN KEY ("timedServiceId") REFERENCES "TimedService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethodCompanion" ADD CONSTRAINT "PaymentMethodCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalCharacteristics" ADD CONSTRAINT "PhysicalCharacteristics_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgeCategoryCompanion" ADD CONSTRAINT "AgeCategoryCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCompanionOffered" ADD CONSTRAINT "ServiceCompanionOffered_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCompanionOffered" ADD CONSTRAINT "ServiceCompanionOffered_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicosGeraisCompanion" ADD CONSTRAINT "ServicosGeraisCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicosEspeciaisCompanion" ADD CONSTRAINT "ServicosEspeciaisCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationCompanion" ADD CONSTRAINT "LocationCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationCompanion" ADD CONSTRAINT "LocationCompanion_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySchedule" ADD CONSTRAINT "WeeklySchedule_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnavailableDates" ADD CONSTRAINT "UnavailableDates_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Top10" ADD CONSTRAINT "Top10_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convenio" ADD CONSTRAINT "Convenio_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convenio" ADD CONSTRAINT "Convenio_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_denunciadoId_fkey" FOREIGN KEY ("denunciadoId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_denuncianteId_fkey" FOREIGN KEY ("denuncianteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanExtraPlans" ADD CONSTRAINT "_PlanExtraPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "ExtraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanExtraPlans" ADD CONSTRAINT "_PlanExtraPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanionExtraPlans" ADD CONSTRAINT "_CompanionExtraPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanionExtraPlans" ADD CONSTRAINT "_CompanionExtraPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "ExtraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
