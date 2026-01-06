"use client";

export function SubscribeButton({
  email,
  locale,
  userId,
}: {
  email?: string;
  locale: string;
  userId: string;
}) {
  const onClick = async () => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale, userId }),
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  return <button onClick={onClick}>Subscribe</button>;
}
