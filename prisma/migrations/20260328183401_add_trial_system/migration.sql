-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ALTER COLUMN "subscriptionStatus" SET DEFAULT 'trialing';
