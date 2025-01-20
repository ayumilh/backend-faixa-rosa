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
CREATE TYPE "Lugar" AS ENUM ('A_DOMICILIO', 'CLUBE_SWING', 'COM_LOCAL', 'DESPEDIDAS_SOLTEIRO', 'FESTAS_EVENTOS', 'HOTEL', 'JANTAR_ROMANTICO', 'VIAGENS');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('COMPRAS', 'ENTRETENIMENTO', 'SAUDE', 'OUTROS');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userType" "UserType" NOT NULL DEFAULT 'CONTRATANTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyCity" TEXT,
    "companyState" TEXT,
    "companyBio" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Companion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastOnline" TIMESTAMP(3) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "top10Id" INTEGER,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isDarkMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSubscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanSubscription_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Top10" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Top10_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethodCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,

    CONSTRAINT "PaymentMethodCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgeCategoryCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "ageCategory" "AgeCategory" NOT NULL,

    CONSTRAINT "AgeCategoryCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtendimentoCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "atendimento" "Atendimento" NOT NULL,

    CONSTRAINT "AtendimentoCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMethodCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "contactMethod" "ContactMethod" NOT NULL,

    CONSTRAINT "ContactMethodCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtniaCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "etnia" "Etnia" NOT NULL,

    CONSTRAINT "EtniaCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CabeloCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "cabelo" "Cabelo" NOT NULL,

    CONSTRAINT "CabeloCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstaturaCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "estatura" "Estatura" NOT NULL,

    CONSTRAINT "EstaturaCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorpoCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "corpo" "Corpo" NOT NULL,

    CONSTRAINT "CorpoCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeiosCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "seios" "Seios" NOT NULL,

    CONSTRAINT "SeiosCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PubisCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "pubis" "Pubis" NOT NULL,

    CONSTRAINT "PubisCompanion_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "LugarCompanion" (
    "id" SERIAL NOT NULL,
    "companionId" INTEGER NOT NULL,
    "lugar" "Lugar" NOT NULL,

    CONSTRAINT "LugarCompanion_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Companion_userId_key" ON "Companion"("userId");

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_top10Id_fkey" FOREIGN KEY ("top10Id") REFERENCES "Top10"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convenio" ADD CONSTRAINT "Convenio_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convenio" ADD CONSTRAINT "Convenio_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethodCompanion" ADD CONSTRAINT "PaymentMethodCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgeCategoryCompanion" ADD CONSTRAINT "AgeCategoryCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtendimentoCompanion" ADD CONSTRAINT "AtendimentoCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMethodCompanion" ADD CONSTRAINT "ContactMethodCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtniaCompanion" ADD CONSTRAINT "EtniaCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CabeloCompanion" ADD CONSTRAINT "CabeloCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstaturaCompanion" ADD CONSTRAINT "EstaturaCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorpoCompanion" ADD CONSTRAINT "CorpoCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeiosCompanion" ADD CONSTRAINT "SeiosCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PubisCompanion" ADD CONSTRAINT "PubisCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicosGeraisCompanion" ADD CONSTRAINT "ServicosGeraisCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicosEspeciaisCompanion" ADD CONSTRAINT "ServicosEspeciaisCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LugarCompanion" ADD CONSTRAINT "LugarCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_denuncianteId_fkey" FOREIGN KEY ("denuncianteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Denuncia" ADD CONSTRAINT "Denuncia_denunciadoId_fkey" FOREIGN KEY ("denunciadoId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
