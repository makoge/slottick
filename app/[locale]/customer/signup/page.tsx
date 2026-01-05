import { Suspense } from "react";
import CustomerSignupClient from "./signup-client";

export const dynamic = "force-dynamic";

export default function CustomerSignupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading…</div>}>
      <CustomerSignupClient />
    </Suspense>
  );
}

