import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};


export default function CancelPage() {
  return (
    <div>
      <h1>Payment cancelled</h1>
      <p>You were not charged.</p>
    </div>
  );
}
