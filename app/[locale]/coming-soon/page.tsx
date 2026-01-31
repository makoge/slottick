export default async function ComingSoonPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const category = sp?.category ?? "this category";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-xl px-6 py-20">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Slotta</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Coming soon</h1>
          <p className="mt-3 text-slate-600">
            {category} is not available yet. You’re registered — we’ll unlock it soon.
          </p>

          <a
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            href="/"
          >
            Back to home
          </a>
        </section>
      </div>
    </main>
  );
}
