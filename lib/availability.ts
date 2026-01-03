export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun..Sat

export type AvailabilityRule = {
  timezone: string; // for later
  days: Weekday[]; // working days
  start: string; // "10:00"
  end: string; // "18:00"
  breakStart?: string; // "13:00"
  breakEnd?: string; // "13:30"
  bufferMin: number; // 0, 5, 10...
  slotStepMin: number; // e.g. 30
};

export const defaultAvailability: AvailabilityRule = {
  timezone: "Europe/Tallinn",
  days: [1, 2, 3, 4, 5], // Mon-Fri
  start: "10:00",
  end: "18:00",
  breakStart: "13:00",
  breakEnd: "13:30",
  bufferMin: 10,
  slotStepMin: 30
};

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function toHHMM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function weekdayFromISODate(dateISO: string): Weekday {
  const [y, m, d] = dateISO.split("-").map(Number);
  const localDate = new Date(y, m - 1, d);
  return localDate.getDay() as Weekday;
}


export function isWithinBreak(mins: number, rule: AvailabilityRule) {
  if (!rule.breakStart || !rule.breakEnd) return false;
  const bs = toMinutes(rule.breakStart);
  const be = toMinutes(rule.breakEnd);
  return mins >= bs && mins < be;
}

export function generateTimeSlots(dateISO: string, rule: AvailabilityRule) {
  if (!dateISO) return [];

  const wd = weekdayFromISODate(dateISO);
  if (!rule.days.includes(wd)) return [];

  const start = toMinutes(rule.start);
  const end = toMinutes(rule.end);
  const step = Math.max(5, rule.slotStepMin || 30);

  const slots: string[] = [];
  for (let t = start; t + step <= end; t += step) {
    if (isWithinBreak(t, rule)) continue;
    slots.push(toHHMM(t));
  }
  return slots;
}

// localStorage helpers (client-only)
export function availabilityKey(slug: string) {
  return `slotta_availability:${slug}`;
}

export function loadAvailability(slug: string): AvailabilityRule {
  if (typeof window === "undefined") return defaultAvailability;
  const raw = localStorage.getItem(availabilityKey(slug));
  if (!raw) return defaultAvailability;
  try {
    return { ...defaultAvailability, ...JSON.parse(raw) };
  } catch {
    return defaultAvailability;
  }
}

export function saveAvailability(slug: string, rule: AvailabilityRule) {
  localStorage.setItem(availabilityKey(slug), JSON.stringify(rule));
}

export function canFitServiceAt(
  startHHMM: string,
  rule: AvailabilityRule,
  serviceDurationMin: number
) {
  const start = toMinutes(startHHMM);
  const end = toMinutes(rule.end);
  const total = serviceDurationMin + (rule.bufferMin || 0);
  return start + total <= end;
}

export function overlapsBreak(
  startHHMM: string,
  rule: AvailabilityRule,
  serviceDurationMin: number
) {
  if (!rule.breakStart || !rule.breakEnd) return false;

  const start = toMinutes(startHHMM);
  const finish = start + serviceDurationMin;

  const bs = toMinutes(rule.breakStart);
  const be = toMinutes(rule.breakEnd);

  // overlap if appointment intersects [bs, be)
  return start < be && finish > bs;
}

export function slotRangeForService(
  startHHMM: string,
  rule: AvailabilityRule,
  serviceDurationMin: number
) {
  const start = toMinutes(startHHMM);
  const step = Math.max(5, rule.slotStepMin || 30);
  const total = serviceDurationMin + (rule.bufferMin || 0);

  // number of slots to block (ceil to slotStep)
  const blocks = Math.ceil(total / step);

  const times: string[] = [];
  for (let i = 0; i < blocks; i++) {
    times.push(toHHMM(start + i * step));
  }
  return times;
}


