import { getMessages } from "@/lib/i18n";

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await getMessages(locale); // keep for future translations

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-1 text-sm font-medium">
              Built for services
            </span>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Stop managing bookings.
              <br />
              Let clients book your real availability.
            </h1>

            <p className="max-w-xl text-lg text-slate-600">
              Slottick turns your schedule into a booking link.
              You set the rules once, clients book themselves.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href={`/${locale}/register`}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create your Slottick
              </a>

              <a
                href={`/${locale}/book/demo-lash-studio`}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                See booking flow
              </a>

              <a
                href={`/${locale}/explore`}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Explore services
              </a>
            </div>
          </div>

          {/* VISUAL PLACEHOLDER */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <div className="space-y-4 text-sm text-slate-600">
              <p>✔ Services & durations</p>
              <p>✔ Availability rules</p>
              <p>✔ Buffer & breaks</p>
              <p>✔ One shareable link</p>
              <p>✔ No double booking</p>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="mt-32 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Booking shouldn’t feel like a second job
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Endless messages. Manual confirmations. No-shows.
            Your time gets booked but it’s not protected.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-20 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Set your rules",
              desc: "Working hours, breaks, buffer time, services and durations. You do this once."
            },
            {
              title: "Share your Slottick",
              desc: "One link that always shows your real availability. No back-and-forth."
            },
            {
              title: "Get booked properly",
              desc: "Clients pick a service and time. You get confirmed bookings only."
            }
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* CLIENT ANGLE */}
        <section className="mt-32 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Better for your clients too
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Clients can rebook, check availability, and confirm appointments
            without messaging you. Fewer questions. More bookings.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-32 rounded-3xl bg-slate-900 px-8 py-14 text-white">
          <h2 className="text-3xl font-bold tracking-tight">
            Your availability is your business.
          </h2>
          <p className="mt-4 max-w-xl text-slate-300">
            Slottick helps you control it, and get booked without chaos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`/${locale}/register`}
              className="inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Create your Slottick
            </a>
            <a
              href={`/${locale}/explore`}
              className="inline-flex rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore services
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
