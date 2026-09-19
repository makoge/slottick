import Link from "next/link";

export default function PrivacyPage() {
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
              Compliance & Security
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
            Slottick respects your privacy. This policy explains how we collect,
            use, and safeguard your personal data across our booking ecosystem.
          </p>
        </div>
      </section>

      {/* DOCUMENT BODY */}
      <div className="mx-auto mt-8 max-w-4xl px-4 sm:px-8">
        <article className="rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-10">
          <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 text-xs leading-relaxed text-slate-700 sm:text-sm">
            Learn more about how{" "}
            <Link
              href="/en"
              className="font-bold text-slate-900 underline underline-offset-2 hover:text-black"
            >
              Slottick helps service businesses manage bookings
            </Link>{" "}
            with automated schedules and client protection.
          </div>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700 sm:text-base">
            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Information We Collect
              </h2>
              <p className="mt-2 text-slate-700">
                We collect information you provide when creating an account,
                such as your business name, email address, and booking details.
                We also collect the operational records necessary to handle
                appointments, sync calendar availability, process client fees,
                and send reminder notifications.
              </p>
            </section>

            <section className="border-t border-slate-200/80 pt-6">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                2. How We Use Your Information
              </h2>
              <ul className="mt-3 space-y-2 pl-2">
                {[
                  "To operate live booking links, slot allocations, and calendar schedules",
                  "To dispatch essential appointment confirmations and service updates",
                  "To monitor platform uptime, system performance, and infrastructure reliability",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-t border-slate-200/80 pt-6">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                3. Data Protection
              </h2>
              <p className="mt-2 text-slate-700">
                We implement industry-standard technical and organizational
                security controls to protect your records. Authentication tokens
                and passwords are encrypted using modern cryptographic hashes,
                and sensitive client information is never stored or transmitted
                in plain text.
              </p>
            </section>

            <section className="border-t border-slate-200/80 pt-6">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                4. Third-Party Services
              </h2>
              <p className="mt-2 text-slate-700">
                Payments, transactional delivery, and analytics telemetry may be
                processed by certified external providers. These infrastructure
                partners only receive the minimum scoped data required to
                execute their specific functions.
              </p>
            </section>

            <section className="border-t border-slate-200/80 pt-6">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                5. Contact Us
              </h2>
              <p className="mt-2 text-slate-700">
                If you have inquiries or privacy concerns regarding this policy,
                reach out directly to our compliance desk at{" "}
                <span className="font-mono font-bold text-slate-900">
                  support@slottick.com
                </span>
                .
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
