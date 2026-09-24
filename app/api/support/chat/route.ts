import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/db";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, businessSlug } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages payload" },
        { status: 400 },
      );
    }

    let dynamicContext = `
You are the friendly AI Support Assistant for Slottick.
Slottick is an appointment booking marketplace for barbers, hair stylists, nail technicians, and wellness studios.
Help users understand how to search for services, book appointments, or navigate their dashboard.
`;

    // RAG: Query live business details from your database if on a shop page
    if (businessSlug && typeof businessSlug === "string") {
      try {
        const biz = await prisma.business.findUnique({
          where: { slug: businessSlug },
          include: {
            services: true,
          },
        });

        if (biz) {
          const servicesList = biz.services?.length
            ? biz.services
                .map(
                  (s: any) =>
                    `- ${s.name}: ${s.price} ${s.currency} (${s.durationMin} mins, Category: ${s.category || "General"})`,
                )
                .join("\n")
            : "No specific services listed currently.";

          dynamicContext = `
You are the customer receptionist for "${biz.name}".
Location: ${biz.city || "Not specified"}, ${biz.country || ""}
Services Offered:
${servicesList}

Instructions:
- Answer client inquiries using strictly the services, prices, and details provided above.
- If a client asks for a service not listed, politely let them know it is not currently offered.
- Encourage them to select their preferred service and pick an open time slot directly on this page.
- Keep answers concise, helpful, and polite.
`;
        }
      } catch (dbErr) {
        console.error("Prisma lookup failed in support route:", dbErr);
        // Continues with general dynamicContext fallback if DB fails
      }
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        { role: "system", content: dynamicContext },
        ...messages.slice(-6),
      ],
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "I'm here to help. Could you please rephrase your question?";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Support chat error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process chat query" },
      { status: 500 },
    );
  }
}
