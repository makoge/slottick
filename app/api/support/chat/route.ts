import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      console.error("GROQ_API_KEY is not defined in environment variables.");
      return NextResponse.json(
        { error: "AI support service is temporarily unavailable." },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => ({}));
    let rawMessages = body.messages;

    // Gracefully handle single message payload if sent by UI
    if (!Array.isArray(rawMessages) && typeof body.message === "string") {
      rawMessages = [{ role: "user", content: body.message.trim() }];
    }

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages payload" },
        { status: 400 },
      );
    }

    // Sanitize message objects for Groq API
    // ✅ Explicit union literal
    const formattedMessages: ChatCompletionMessageParam[] = rawMessages
      .map((m: any) => {
        const role: "user" | "assistant" =
          m.role === "assistant" ? "assistant" : "user";
        const content = String(m.content || m.text || m.body || "").trim();
        return { role, content };
      })
      .filter((m) => Boolean(m.content));

    if (formattedMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid message content provided" },
        { status: 400 },
      );
    }

    let dynamicContext = `
You are the friendly AI Concierge for Slottick.
Slottick is an appointment scheduling platform for barbershops, hair salons, nail techs, and wellness studios.
Guide clients on how to choose a service, pick a specialist, and book available time slots. Keep answers concise.
`;

    const businessSlug = body.businessSlug;

    // RAG: Load live business context including services and team roster
    if (businessSlug && typeof businessSlug === "string") {
      try {
        const biz = await prisma.business.findUnique({
          where: { slug: businessSlug },
          select: {
            name: true,
            city: true,
            country: true,
            heroTag: true,
            services: {
              select: {
                name: true,
                price: true,
                currency: true,
                durationMin: true,
                category: true,
              },
            },
            staff: {
              where: { isActive: true },
              select: {
                name: true,
                title: true,
              },
            },
            availabilityRules: {
              where: { staffId: null },
              take: 1,
              select: {
                start: true,
                end: true,
                timezone: true,
              },
            },
          },
        });

        if (biz) {
          const servicesList = biz.services?.length
            ? biz.services
                .map(
                  (s) =>
                    `- ${s.name}: ${s.price} ${s.currency} (${s.durationMin} mins, ${s.category})`,
                )
                .join("\n")
            : "No specific services listed currently.";

          const staffList = biz.staff?.length
            ? biz.staff
                .map((m) => `- ${m.name}${m.title ? ` (${m.title})` : ""}`)
                .join("\n")
            : "Our master service team.";

          const defaultRule = biz.availabilityRules?.[0];
          const hours = defaultRule
            ? `Standard Hours: ${defaultRule.start} - ${defaultRule.end} (${defaultRule.timezone})`
            : "Check calendar for open hours.";

          dynamicContext = `
You are the polite customer receptionist for "${biz.name}".
Location: ${biz.city || "Local Studio"}, ${biz.country || ""}
${hours}

Active Specialists & Craftsmen:
${staffList}

Services Offered:
${servicesList}

Instructions:
- Assist patrons in booking appointments and answering questions about services and specialists.
- Only reference services, prices, and team members provided above.
- Direct clients to pick their service and select an open calendar slot directly on this page.
- Keep answers under 3 short sentences.
`;
        }
      } catch (dbErr) {
        console.error("Prisma lookup failed in support route:", dbErr);
      }
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 250,
      messages: [
        { role: "system", content: dynamicContext },
        ...formattedMessages.slice(-6),
      ],
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "You can book directly by picking an offering and slot above.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Support chat error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process chat query" },
      { status: 500 },
    );
  }
}
