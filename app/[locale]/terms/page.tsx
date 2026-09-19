import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="w-full pb-20">
      {/* HEADER BANNER */}
      <section className="relative w-full border-b border-slate-400/30 bg-white/40 px-4 py-10 shadow-xs backdrop-blur-xl sm:px-8 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
              ✓
            </span>
            <span className="font-mono uppercase tracking-wider">
              Legal Framework
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Terms of Service
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
            These Terms govern your access to and use of Slottick. By creating
            an account or operating through the platform, you agree to these
            conditions.
          </p>
        </div>
      </section>

      {/* DOCUMENT BODY */}
      <div className="mx-auto mt-8 max-w-4xl px-4 sm:px-8">
        <article className="rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-10">
          <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 text-xs leading-relaxed text-slate-700 sm:text-sm">
            Want to understand how our infrastructure works before using it?
            Visit the{" "}
            <Link
              href="/en"
              className="font-bold text-slate-900 underline underline-offset-2 hover:text-black"
            >
              main Slottick platform overview
            </Link>
            .
          </div>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700 sm:text-base">
            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Service Description
              </h2>
              <p className="mt-2 text-slate-700">
                Slottick provides an online booking and calendar orchestration
                platform for appointment-based businesses. While we engineer our
                tooling for peak reliability and accurate availability
                synchronization, we do not guarantee specific booking volume,
                client acquisition rates, or business revenue outcomes.
              </p>
            </section>

            <section className="border-t border-slate-200/80 pt-6">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                2. Subscriptions & Pricing
              </h2>
              <p className="mt-2 text-slate-700">
                Certain advanced features and tier allocations require an active
                subscription. Subscription pricing, package tiers, and included
                feature sets may be updated as the platform expands. Any rate
                adjustments will be announced with clear advance notice and will
                not apply retroactively to an active billing cycle.
              </p>
            </section>

            <section className="border-t border-slate-200/80 pt-6">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                3. Acceptable Use
              </h2>
              <p className="mt-2 text-slate-700">
                You agree not to exploit the platform, execute automated
                scraping or abusive query loops, attempt unauthorized access to
                infrastructure boundaries, or otherwise compromise system
                integrity and uptime performance.
              </p>
            </section>

            <section className="border-t border-slate-200/80 pt-6">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                4. Account Responsibility
              </h2>
              <p className="mt-2 text-slate-700">
                You maintain sole responsibility for preserving the
                confidentiality of your account credentials, restricting
                unauthorized access, and monitoring all operations performed
                under your authentication context.
              </p>
            </section>

            <section className="border-t border-slate-200/80 pt-6">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                5. Limitation of Liability
              </h2>
              <p className="mt-2 text-slate-700">
                Slottick is provided on an “as is” and “as available” basis
                without express or implied warranties. We disclaim liability for
                indirect, incidental, special, or consequential damages,
                including lost revenue, service interruptions, or scheduling
                discrepancies arising from external provider actions.
              </p>
            </section>

            <section className="border-t border-slate-200/80 pt-6">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                6. Termination
              </h2>
              <p className="mt-2 text-slate-700">
                We reserve the explicit right to suspend, restrict, or
                permanently terminate accounts that breach these Terms,
                participate in abusive practices, or jeopardize platform
                stability.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
