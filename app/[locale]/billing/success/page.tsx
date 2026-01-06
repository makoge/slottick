
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default function SuccessPage() {
  return (
    <div>
      <h1>Payment successful 🎉</h1>
      <p>Your subscription is active.</p>
    </div>
  );
}