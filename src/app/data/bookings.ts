export type Status = "seated" | "arrived" | "confirmed" | "waiting" | "noshow" | "cancelled";
export type Section = "Restaurant" | "First floor" | "Terrace" | "Bar";
export type Period = "morning" | "lunch" | "evening";

export interface Booking {
  id: number;
  time: string;
  endTime: string;
  section: Section;
  table: number;
  guestName: string;
  guests: number;
  status: Status;
  tags: string[];
  hasNote: boolean;
  hasFile: boolean;
  period: Period;
}

export const PERIOD_THEMES = {
  All: {
    accent: "#374151",
    accentLight: "#f1f5f9",
    accentMid: "#e2e8f0",
    textDark: "#111827",
    textMid: "#4b5563",
    gradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    label: "All Day",
    sublabel: "Full service · 07:00 — 22:00",
    iconColor: "#6b7280",
    barColor: "#0d9488",
    badgeBg: "#f3f4f6",
    badgeText: "#374151",
    timelineStart: 17 * 60,
    timelineCurrentTime: "18:00",
    timelineSlots: ["17:00","17:15","17:30","17:45","18:00","18:15","18:30","18:45","19:00","19:15","19:30"],
  },
  Morning: {
    accent: "#b45309",
    accentLight: "#fffbeb",
    accentMid: "#fef3c7",
    textDark: "#78350f",
    textMid: "#92400e",
    gradient: "linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)",
    label: "Morning Service",
    sublabel: "Breakfast & brunch · 07:00 — 12:00",
    iconColor: "#f59e0b",
    barColor: "#d97706",
    badgeBg: "#fef3c7",
    badgeText: "#92400e",
    timelineStart: 7 * 60,
    timelineCurrentTime: "09:00",
    timelineSlots: ["07:00","07:15","07:30","07:45","08:00","08:15","08:30","08:45","09:00","09:15","09:30","09:45","10:00","10:15","10:30","10:45","11:00","11:15","11:30","11:45","12:00"],
  },
  Lunch: {
    accent: "#c2410c",
    accentLight: "#fff7ed",
    accentMid: "#ffedd5",
    textDark: "#7c2d12",
    textMid: "#9a3412",
    gradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    label: "Lunch Service",
    sublabel: "Midday dining · 12:00 — 16:00",
    iconColor: "#ea580c",
    barColor: "#ea580c",
    badgeBg: "#ffedd5",
    badgeText: "#9a3412",
    timelineStart: 12 * 60,
    timelineCurrentTime: "13:30",
    timelineSlots: ["12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45","14:00","14:15","14:30","14:45","15:00","15:15","15:30","15:45","16:00"],
  },
  Evening: {
    accent: "#0f766e",
    accentLight: "#f0fdfa",
    accentMid: "#ccfbf1",
    textDark: "#134e4a",
    textMid: "#0f766e",
    gradient: "linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)",
    label: "Evening Service",
    sublabel: "Dinner service · 17:00 — 22:00",
    iconColor: "#0d9488",
    barColor: "#0d9488",
    badgeBg: "#ccfbf1",
    badgeText: "#134e4a",
    timelineStart: 17 * 60,
    timelineCurrentTime: "18:00",
    timelineSlots: ["17:00","17:15","17:30","17:45","18:00","18:15","18:30","18:45","19:00","19:15","19:30","19:45","20:00","20:15","20:30"],
  },
} as const;

export const ALL_BOOKINGS: Booking[] = [
  // ── MORNING ──────────────────────────────
  { id: 101, time: "07:00", endTime: "07:45", section: "Restaurant", table: 2, guestName: "Sarah Mitchell", guests: 2, status: "confirmed", tags: ["Breakfast set"], hasNote: false, hasFile: false, period: "morning" },
  { id: 102, time: "07:30", endTime: "08:15", section: "First floor", table: 5, guestName: "James Anderson", guests: 4, status: "seated", tags: ["Vegan"], hasNote: true, hasFile: false, period: "morning" },
  { id: 103, time: "08:00", endTime: "08:50", section: "Restaurant", table: 1, guestName: "Emma Thompson", guests: 2, status: "arrived", tags: ["Weekend special"], hasNote: false, hasFile: true, period: "morning" },
  { id: 104, time: "08:00", endTime: "09:00", section: "Terrace", table: 7, guestName: "Oliver Davies", guests: 6, status: "seated", tags: ["Business"], hasNote: true, hasFile: true, period: "morning" },
  { id: 105, time: "08:30", endTime: "09:15", section: "Restaurant", table: 3, guestName: "Charlotte Lewis", guests: 3, status: "confirmed", tags: [], hasNote: false, hasFile: false, period: "morning" },
  { id: 106, time: "09:00", endTime: "10:00", section: "Restaurant", table: 4, guestName: "William Johnson", guests: 4, status: "seated", tags: ["Birthday 🎂"], hasNote: true, hasFile: false, period: "morning" },
  { id: 107, time: "09:00", endTime: "10:00", section: "First floor", table: 9, guestName: "Ava Wilson", guests: 8, status: "arrived", tags: ["Team breakfast"], hasNote: false, hasFile: false, period: "morning" },
  { id: 108, time: "09:30", endTime: "10:15", section: "Bar", table: 6, guestName: "Noah Brown", guests: 2, status: "confirmed", tags: [], hasNote: false, hasFile: false, period: "morning" },
  { id: 109, time: "10:00", endTime: "11:00", section: "Restaurant", table: 11, guestName: "Isabella Moore", guests: 5, status: "seated", tags: ["Allergen: nuts"], hasNote: true, hasFile: false, period: "morning" },
  { id: 110, time: "10:30", endTime: "11:15", section: "Terrace", table: 2, guestName: "Liam Taylor", guests: 2, status: "confirmed", tags: ["Yoga retreat"], hasNote: false, hasFile: false, period: "morning" },
  { id: 111, time: "11:00", endTime: "11:50", section: "Restaurant", table: 8, guestName: "Sophia Clark", guests: 4, status: "arrived", tags: [], hasNote: false, hasFile: true, period: "morning" },
  { id: 112, time: "11:00", endTime: "12:00", section: "First floor", table: 1, guestName: "Mason Lee", guests: 6, status: "confirmed", tags: ["Corporate"], hasNote: true, hasFile: false, period: "morning" },

  // ── LUNCH ────────────────────────────────
  { id: 201, time: "12:00", endTime: "13:00", section: "Restaurant", table: 1, guestName: "Olivia White", guests: 2, status: "seated", tags: ["Set lunch"], hasNote: false, hasFile: false, period: "lunch" },
  { id: 202, time: "12:00", endTime: "13:30", section: "Restaurant", table: 5, guestName: "Ethan Harris", guests: 4, status: "arrived", tags: ["Business"], hasNote: true, hasFile: false, period: "lunch" },
  { id: 203, time: "12:00", endTime: "13:00", section: "First floor", table: 9, guestName: "Amelia Jackson", guests: 8, status: "seated", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 204, time: "12:30", endTime: "13:30", section: "Restaurant", table: 2, guestName: "Alexander Young", guests: 3, status: "confirmed", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 205, time: "12:30", endTime: "14:00", section: "First floor", table: 7, guestName: "Mia Walker", guests: 5, status: "seated", tags: ["Four seasons"], hasNote: true, hasFile: true, period: "lunch" },
  { id: 206, time: "13:00", endTime: "14:00", section: "Restaurant", table: 3, guestName: "Benjamin Allen", guests: 2, status: "confirmed", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 207, time: "13:00", endTime: "14:30", section: "Terrace", table: 10, guestName: "Charlotte King", guests: 6, status: "arrived", tags: ["Birthday 🎂"], hasNote: true, hasFile: true, period: "lunch" },
  { id: 208, time: "13:30", endTime: "14:30", section: "Restaurant", table: 4, guestName: "Lucas Wright", guests: 4, status: "seated", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 209, time: "13:30", endTime: "14:30", section: "Bar", table: 8, guestName: "Harper Scott", guests: 3, status: "confirmed", tags: ["Wine pairing"], hasNote: false, hasFile: false, period: "lunch" },
  { id: 210, time: "14:00", endTime: "15:00", section: "Restaurant", table: 6, guestName: "Evelyn Green", guests: 2, status: "noshow", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 211, time: "14:00", endTime: "15:30", section: "First floor", table: 11, guestName: "Aiden Baker", guests: 7, status: "seated", tags: ["Anniversary ❤️"], hasNote: true, hasFile: false, period: "lunch" },
  { id: 212, time: "14:30", endTime: "15:30", section: "Restaurant", table: 1, guestName: "Abigail Nelson", guests: 4, status: "arrived", tags: ["VIP ⭐"], hasNote: false, hasFile: true, period: "lunch" },
  { id: 213, time: "15:00", endTime: "16:00", section: "Terrace", table: 5, guestName: "Logan Carter", guests: 2, status: "confirmed", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 214, time: "15:00", endTime: "16:00", section: "Restaurant", table: 9, guestName: "Ella Mitchell", guests: 5, status: "seated", tags: ["Allergen: gluten"], hasNote: true, hasFile: false, period: "lunch" },
  { id: 215, time: "15:30", endTime: "16:30", section: "First floor", table: 3, guestName: "Jackson Perez", guests: 3, status: "confirmed", tags: [], hasNote: false, hasFile: false, period: "lunch" },

  // ── EVENING ──────────────────────────────
  { id: 301, time: "17:00", endTime: "17:45", section: "Restaurant", table: 1, guestName: "Alice Johnson", guests: 2, status: "seated", tags: ["Evening menu"], hasNote: true, hasFile: true, period: "evening" },
  { id: 302, time: "17:00", endTime: "18:00", section: "Restaurant", table: 8, guestName: "Michael Smithson", guests: 8, status: "seated", tags: ["Seafood special"], hasNote: false, hasFile: false, period: "evening" },
  { id: 303, time: "17:00", endTime: "17:45", section: "First floor", table: 4, guestName: "Jessica Taylor", guests: 4, status: "noshow", tags: [], hasNote: true, hasFile: true, period: "evening" },
  { id: 304, time: "17:30", endTime: "18:30", section: "Restaurant", table: 3, guestName: "Clark Benson", guests: 3, status: "arrived", tags: [], hasNote: true, hasFile: false, period: "evening" },
  { id: 305, time: "17:45", endTime: "18:45", section: "Restaurant", table: 4, guestName: "David Brown", guests: 6, status: "confirmed", tags: ["Four seasons"], hasNote: true, hasFile: true, period: "evening" },
  { id: 306, time: "17:45", endTime: "18:30", section: "First floor", table: 2, guestName: "Emily Davis", guests: 2, status: "confirmed", tags: ["Four seasons"], hasNote: false, hasFile: false, period: "evening" },
  { id: 307, time: "17:45", endTime: "18:30", section: "Restaurant", table: 7, guestName: "John Elliot", guests: 2, status: "confirmed", tags: ["Vegetarian menu"], hasNote: false, hasFile: false, period: "evening" },
  { id: 308, time: "18:15", endTime: "19:15", section: "Restaurant", table: 9, guestName: "Sophia Williams", guests: 11, status: "waiting", tags: [], hasNote: true, hasFile: false, period: "evening" },
  { id: 309, time: "18:15", endTime: "19:00", section: "First floor", table: 5, guestName: "Isabella White", guests: 2, status: "confirmed", tags: [], hasNote: true, hasFile: false, period: "evening" },
  { id: 310, time: "18:15", endTime: "19:15", section: "Restaurant", table: 5, guestName: "James Wilson", guests: 6, status: "confirmed", tags: [], hasNote: true, hasFile: false, period: "evening" },
  { id: 311, time: "18:15", endTime: "19:15", section: "First floor", table: 8, guestName: "Olivia Martinez", guests: 3, status: "confirmed", tags: ["Four seasons"], hasNote: true, hasFile: false, period: "evening" },
  { id: 312, time: "19:00", endTime: "20:00", section: "Restaurant", table: 2, guestName: "Noah Garcia", guests: 4, status: "confirmed", tags: ["Tasting menu"], hasNote: false, hasFile: false, period: "evening" },
  { id: 313, time: "19:00", endTime: "20:30", section: "First floor", table: 7, guestName: "Ava Thompson", guests: 8, status: "confirmed", tags: ["Anniversary ❤️"], hasNote: true, hasFile: true, period: "evening" },
  { id: 314, time: "19:30", endTime: "21:00", section: "Terrace", table: 3, guestName: "Liam Wilson", guests: 5, status: "confirmed", tags: ["VIP ⭐", "Wine pairing"], hasNote: true, hasFile: false, period: "evening" },
  { id: 315, time: "20:00", endTime: "21:30", section: "Restaurant", table: 6, guestName: "Emma Davis", guests: 2, status: "confirmed", tags: ["Birthday 🎂"], hasNote: false, hasFile: false, period: "evening" },
];

export const STATUS_META: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  seated:    { label: "Seated",    color: "#0f766e", bg: "#f0fdfa", dot: "#0d9488" },
  arrived:   { label: "Arrived",   color: "#0369a1", bg: "#eff6ff", dot: "#38bdf8" },
  confirmed: { label: "Confirmed", color: "#374151", bg: "#f9fafb", dot: "#9ca3af" },
  waiting:   { label: "Waiting",   color: "#b45309", bg: "#fffbeb", dot: "#f59e0b" },
  noshow:    { label: "No-show",   color: "#b91c1c", bg: "#fef2f2", dot: "#ef4444" },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6", dot: "#d1d5db" },
};

// ── Today is March 23, 2026 ───────────────────────────────────
export const TODAY_DAY = 23;

/** Returns the bookings to display for a given calendar day.
 *  Day 23 = today → full dataset.
 *  Other days → deterministic subset so the calendar feels live. */
export function getBookingsForDay(day: number): Booking[] {
  if (day === TODAY_DAY) return ALL_BOOKINGS;
  // Pseudorandom but deterministic subset for neighbouring days
  return ALL_BOOKINGS.filter(b => (b.id * 7 + day * 3) % 11 < 8);
}

/** True when a booking is "done" — visually faded in all views. */
export function isDoneBooking(b: Booking, nowMin: number, day: number): boolean {
  if (day < TODAY_DAY) return true;   // past day: everything done
  if (day > TODAY_DAY) return false;  // future day: nothing done yet
  // today: noshow/cancelled always faded
  if (b.status === "noshow" || b.status === "cancelled") return true;
  // active statuses (seated/arrived) are never faded regardless of time
  if (b.status === "seated" || b.status === "arrived") return false;
  // confirmed/waiting: faded once end-time has passed
  const [eh, em] = b.endTime.split(":").map(Number);
  return (eh * 60 + em) < nowMin;
}