export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>

      <p className="mt-6 text-slate-600">
        Slottick respects your privacy. This policy explains how we collect,
        use, and protect your personal information.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Information we collect</h2>
      <p className="mt-2 text-slate-600">
        We collect information you provide when creating an account, such as
        business name, email address, and booking details. We also collect
        information necessary to operate bookings, payments, and customer
        notifications.
      </p>

      <h2 className="mt-8 text-xl font-semibold">How we use your information</h2>
      <ul className="mt-2 list-disc space-y-2 pl-6 text-slate-600">
        <li>To provide booking and scheduling services</li>
        <li>To communicate important service-related updates</li>
        <li>To improve platform performance and reliability</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Data protection</h2>
      <p className="mt-2 text-slate-600">
        We take reasonable technical and organizational measures to protect your
        data. Passwords are securely hashed and sensitive information is never
        stored in plain text.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Third-party services</h2>
      <p className="mt-2 text-slate-600">
        Payments and analytics may be handled by trusted third-party providers.
        These services only receive the data required to perform their function.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Contact</h2>
      <p className="mt-2 text-slate-600">
        If you have questions about this policy, contact us at{" "}
        <span className="font-medium">support@slottick.com</span>.
      </p>
    </section>
  );
}
