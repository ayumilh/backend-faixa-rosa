-- AlterTable
ALTER TABLE "PlanSubscription" ADD COLUMN     "cardExpirationDate" TEXT DEFAULT '',
ADD COLUMN     "cardLast4" TEXT DEFAULT '',
ADD COLUMN     "nextPaymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paymentGatewayTransactionId" TEXT DEFAULT '',
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'default_method',
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
