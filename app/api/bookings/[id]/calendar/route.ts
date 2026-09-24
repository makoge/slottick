import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

function escapeICS(s: string) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toICSUTC(d: Date) {
  return (
    d.getUTCFullYear() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z"
  );
}

function toICSLocalInTZ(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";

  return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get(
    "minute",
  )}${get("second")}`;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          title: true,
        },
      },
      business: {
        include: {
          availabilityRules: {
            select: {
              timezone: true,
              staffId: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  // Resolve timezone: staff override -> business default -> UTC
  const rules = booking.business?.availabilityRules || [];
  const matchedRule =
    rules.find((r) => r.staffId === booking.staffId) ||
    rules.find((r) => !r.staffId) ||
    rules[0];

  const businessTZ = matchedRule?.timezone || "UTC";

  const start = new Date(booking.startsAt);
  const end = booking.endsAt
    ? new Date(booking.endsAt)
    : new Date(start.getTime() + booking.durationMin * 60 * 1000);

  const uid = `booking-${booking.id}@slottick`;
  const dtstamp = toICSUTC(new Date());

  const staffLabel = booking.staff?.name ? ` with ${booking.staff.name}` : "";
  const title = `${booking.serviceName ?? "Appointment"}${staffLabel} — ${
    booking.business?.name ?? "Slottick"
  }`;

  const location = [
    booking.business?.street,
    booking.business?.city,
    booking.business?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const description = [
    `Appointment: ${booking.serviceName ?? "Service"}`,
    booking.staff?.name
      ? `Specialist: ${booking.staff.name}${booking.staff.title ? ` (${booking.staff.title})` : ""}`
      : "",
    `Business: ${booking.business?.name ?? "Slottick"}`,
    booking.notes ? `Client Notes: ${booking.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const DTSTART =
    businessTZ === "UTC"
      ? `DTSTART:${toICSUTC(start)}`
      : `DTSTART;TZID=${escapeICS(businessTZ)}:${toICSLocalInTZ(start, businessTZ)}`;

  const DTEND =
    businessTZ === "UTC"
      ? `DTEND:${toICSUTC(end)}`
      : `DTEND;TZID=${escapeICS(businessTZ)}:${toICSLocalInTZ(end, businessTZ)}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Slottick//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeICS(uid)}`,
    `DTSTAMP:${dtstamp}`,
    DTSTART,
    DTEND,
    `SUMMARY:${escapeICS(title)}`,
    location ? `LOCATION:${escapeICS(location)}` : "",
    `DESCRIPTION:${escapeICS(description)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${booking.id}.ics"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
