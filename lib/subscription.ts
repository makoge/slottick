export function businessHasAccess(business: {
  subscriptionStatus?: string | null;
  trialEndsAt?: Date | null;
  currentPeriodEnd?: Date | null;
}) {
  const now = new Date();

  const hasTrialAccess =
    business.subscriptionStatus === "trialing" &&
    !!business.trialEndsAt &&
    business.trialEndsAt > now;

  const hasPaidAccess =
    business.subscriptionStatus === "active" &&
    !!business.currentPeriodEnd &&
    business.currentPeriodEnd > now;

  return hasTrialAccess || hasPaidAccess;
}