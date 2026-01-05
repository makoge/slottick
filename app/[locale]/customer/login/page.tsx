import { Suspense } from "react";
import CustomerLoginClient from "./login-client";

export const dynamic = "force-dynamic";

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading…</div>}>
      <CustomerLoginClient />
    </Suspense>
  );
}

