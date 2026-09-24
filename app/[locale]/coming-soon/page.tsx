import Link from "next/link";

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; industry?: string }>;
}) {
  const sp = await searchParams;
  const rawTarget = sp?.industry ?? sp?.category ?? "This category";
  const formattedTarget = rawTarget
    .replace(/\(Comming Soon\)/gi, "")
    .replace(/_/g, " ")
    .trim();

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-12 sm:px-6">
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -top-12 h-64 w-64 rounded-full bg-lime-200/40 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -bottom-12 h-64 w-64 rounded-full bg-slate-400/30 blur-3xl sm:h-80 sm:w-80" />

      {/* Main Glassmorphic Panel */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 text-center shadow-xl backdrop-blur-2xl sm:p-10">
        {/* Slottick Identity Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
            ✓
          </span>
          <span className="font-mono uppercase tracking-wider">
            Early Access Queue
          </span>
        </div>

        {/* Feature Lock Icon */}
        <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-lime-300/80 bg-lime-100/90 text-2xl font-bold text-lime-950 shadow-sm backdrop-blur-md">
          <span className="font-mono">⏳</span>
        </div>

        {/* Heading */}
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Coming Soon
        </h1>

        {/* Lead Text */}
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
          <span className="font-bold text-slate-900">{formattedTarget}</span> is
          currently being finalized. Your account registration is saved, and we
          will unlock this industry workflow shortly.
        </p>

        {/* Status Confirmation Callout */}
        <div className="mt-6 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 font-mono text-xs text-slate-600">
          Status: Waitlist priority confirmed for this sector
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
          >
            Back to Home →
          </Link>
        </div>
      </div>
    </div>
  );
}
