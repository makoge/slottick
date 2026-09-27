// app/[locale]/dashboard/clients/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ClientDossierView from "./ClientDossierView";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const client = await prisma.clientProfile.findUnique({
    where: { id },
    include: {
      records: {
        orderBy: { date: "desc" },
        include: {
          staff: {
            select: { name: true, title: true },
          },
        },
      },
      photos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Serialize dates for Client Component hydration
  const serializedClient = {
    ...client,
    records: client.records.map((r) => ({
      ...r,
      date: r.date.toISOString(),
    })),
    photos: client.photos.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <ClientDossierView locale={locale} initialClient={serializedClient} />
    </div>
  );
}
