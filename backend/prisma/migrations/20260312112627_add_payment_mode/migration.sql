-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('RAZORPAY', 'COD', 'TEST_BYPASS');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'COD',
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;
