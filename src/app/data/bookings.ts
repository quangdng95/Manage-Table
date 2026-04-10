export type Status = "seated" | "reserved" | "awaitingconfirm" | "waitingpayment" | "noshow" | "cancelled" | "completed";
export type Section = "Restaurant" | "First floor" | "Terrace" | "Bar";
export type Period = "morning" | "lunch" | "evening";

export interface TableAssignment {
  section: Section;
  table: number;
}

export type BookingType = "dine-in" | "banquet";
export type BanquetSubtype = "1st Birthday" | "Birthday" | "Company" | "Wedding" | "Other";

export interface Booking {
  id: number;
  time: string;
  endTime: string;
  section: Section;
  table: number;          // 0 = Unassigned / Waitlist
  guestName: string;
  guests: number;
  status: Status;
  tags: string[];
  hasNote: boolean;
  hasFile: boolean;
  period: Period;
  additionalTables?: TableAssignment[];
  /** HH:MM — recorded when status transitions to 'seated'. Used for split-color late rendering. */
  actualSeatedTime?: string;
  /** Guest contact phone — display masked in UI */
  phone?: string;
  /** Meal type — dine-in vs banquet function */
  bookingType?: BookingType;
  /** Banquet sub-category — only meaningful when bookingType === 'banquet' */
  banquetSubtype?: BanquetSubtype;
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
  { id: 101, time: "07:00", endTime: "07:45", section: "Restaurant", table: 2, guestName: "Sarah Mitchell", guests: 2, status: "awaitingconfirm", tags: ["Breakfast set"], hasNote: false, hasFile: false, period: "morning" },
  { id: 102, time: "07:30", endTime: "08:15", section: "First floor", table: 5, guestName: "James Anderson", guests: 4, status: "seated", tags: ["Vegan"], hasNote: true, hasFile: false, period: "morning" },
  { id: 103, time: "08:00", endTime: "08:50", section: "Restaurant", table: 1, guestName: "Emma Thompson", guests: 2, status: "reserved", tags: ["Weekend special"], hasNote: false, hasFile: true, period: "morning" },
  { id: 104, time: "08:00", endTime: "09:00", section: "Terrace", table: 7, guestName: "Oliver Davies", guests: 6, status: "seated", tags: ["Business"], hasNote: true, hasFile: true, period: "morning", additionalTables: [{ section: "Terrace", table: 6 }] },
  { id: 105, time: "08:30", endTime: "09:15", section: "Restaurant", table: 3, guestName: "Charlotte Lewis", guests: 3, status: "awaitingconfirm", tags: [], hasNote: false, hasFile: false, period: "morning" },
  { id: 106, time: "09:00", endTime: "10:00", section: "Restaurant", table: 4, guestName: "William Johnson", guests: 4, status: "seated", tags: ["Birthday 🎂"], hasNote: true, hasFile: false, period: "morning" },
  { id: 107, time: "09:00", endTime: "10:00", section: "First floor", table: 9, guestName: "Ava Wilson", guests: 8, status: "reserved", tags: ["Team breakfast"], hasNote: false, hasFile: false, period: "morning" },
  { id: 108, time: "09:30", endTime: "10:15", section: "Bar", table: 6, guestName: "Noah Brown", guests: 2, status: "awaitingconfirm", tags: [], hasNote: false, hasFile: false, period: "morning" },
  { id: 109, time: "10:00", endTime: "11:00", section: "Restaurant", table: 11, guestName: "Isabella Moore", guests: 5, status: "seated", tags: ["Allergen: nuts"], hasNote: true, hasFile: false, period: "morning" },
  { id: 110, time: "10:30", endTime: "11:15", section: "Terrace", table: 2, guestName: "Liam Taylor", guests: 2, status: "awaitingconfirm", tags: ["Yoga retreat"], hasNote: false, hasFile: false, period: "morning" },
  { id: 111, time: "11:00", endTime: "11:50", section: "Restaurant", table: 8, guestName: "Sophia Clark", guests: 4, status: "reserved", tags: [], hasNote: false, hasFile: true, period: "morning" },
  { id: 112, time: "11:00", endTime: "12:00", section: "First floor", table: 1, guestName: "Mason Lee", guests: 6, status: "awaitingconfirm", tags: ["Corporate"], hasNote: true, hasFile: false, period: "morning" },

  // ── LUNCH ────────────────────────────────
  { id: 201, time: "12:00", endTime: "13:00", section: "Restaurant", table: 1, guestName: "Olivia White", guests: 2, status: "seated", tags: ["Set lunch"], hasNote: false, hasFile: false, period: "lunch" },
  { id: 202, time: "12:00", endTime: "13:30", section: "Restaurant", table: 5, guestName: "Ethan Harris", guests: 4, status: "reserved", tags: ["Business"], hasNote: true, hasFile: false, period: "lunch" },
  { id: 203, time: "12:00", endTime: "13:00", section: "First floor", table: 9, guestName: "Amelia Jackson", guests: 8, status: "seated", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 204, time: "12:30", endTime: "13:30", section: "Restaurant", table: 2, guestName: "Alexander Young", guests: 3, status: "awaitingconfirm", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 205, time: "12:30", endTime: "14:00", section: "First floor", table: 7, guestName: "Mia Walker", guests: 5, status: "seated", tags: ["Four seasons"], hasNote: true, hasFile: true, period: "lunch" },
  { id: 206, time: "13:00", endTime: "14:00", section: "Restaurant", table: 3, guestName: "Benjamin Allen", guests: 2, status: "awaitingconfirm", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 207, time: "13:00", endTime: "14:30", section: "Terrace", table: 10, guestName: "Charlotte King", guests: 6, status: "reserved", tags: ["Birthday 🎂"], hasNote: true, hasFile: true, period: "lunch" },
  { id: 208, time: "13:30", endTime: "14:30", section: "Restaurant", table: 4, guestName: "Lucas Wright", guests: 4, status: "seated", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 209, time: "13:30", endTime: "14:30", section: "Bar", table: 8, guestName: "Harper Scott", guests: 3, status: "awaitingconfirm", tags: ["Wine pairing"], hasNote: false, hasFile: false, period: "lunch" },
  { id: 210, time: "14:00", endTime: "15:00", section: "Restaurant", table: 6, guestName: "Evelyn Green", guests: 2, status: "noshow", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 211, time: "14:00", endTime: "15:30", section: "First floor", table: 11, guestName: "Aiden Baker", guests: 7, status: "seated", tags: ["Anniversary ❤️"], hasNote: true, hasFile: false, period: "lunch" },
  { id: 212, time: "14:30", endTime: "15:30", section: "Restaurant", table: 1, guestName: "Abigail Nelson", guests: 4, status: "reserved", tags: ["VIP ⭐"], hasNote: false, hasFile: true, period: "lunch" },
  { id: 213, time: "15:00", endTime: "16:00", section: "Terrace", table: 5, guestName: "Logan Carter", guests: 2, status: "awaitingconfirm", tags: [], hasNote: false, hasFile: false, period: "lunch" },
  { id: 214, time: "15:00", endTime: "16:00", section: "Restaurant", table: 9, guestName: "Ella Mitchell", guests: 5, status: "seated", tags: ["Allergen: gluten"], hasNote: true, hasFile: false, period: "lunch" },
  { id: 215, time: "15:30", endTime: "16:30", section: "First floor", table: 3, guestName: "Jackson Perez", guests: 3, status: "awaitingconfirm", tags: [], hasNote: false, hasFile: false, period: "lunch" },

  // ── EVENING ──────────────────────────────
  { id: 301, time: "17:00", endTime: "17:45", section: "Restaurant", table: 1, guestName: "Alice Johnson", guests: 2, status: "seated", tags: ["Evening menu"], hasNote: true, hasFile: true, period: "evening" },
  { id: 302, time: "17:00", endTime: "18:00", section: "Restaurant", table: 8, guestName: "Michael Smithson", guests: 8, status: "seated", tags: ["Seafood special"], hasNote: false, hasFile: false, period: "evening" },
  { id: 303, time: "17:00", endTime: "17:45", section: "First floor", table: 4, guestName: "Jessica Taylor", guests: 4, status: "noshow", tags: [], hasNote: true, hasFile: true, period: "evening" },
  { id: 304, time: "17:30", endTime: "18:30", section: "Restaurant", table: 3, guestName: "Clark Benson", guests: 3, status: "reserved", tags: [], hasNote: true, hasFile: false, period: "evening" },
  { id: 305, time: "17:45", endTime: "18:45", section: "Restaurant", table: 4, guestName: "David Brown", guests: 6, status: "awaitingconfirm", tags: ["Four seasons"], hasNote: true, hasFile: true, period: "evening" },
  { id: 306, time: "17:45", endTime: "18:30", section: "First floor", table: 2, guestName: "Emily Davis", guests: 2, status: "awaitingconfirm", tags: ["Four seasons"], hasNote: false, hasFile: false, period: "evening" },
  { id: 307, time: "17:45", endTime: "18:30", section: "Restaurant", table: 7, guestName: "John Elliot", guests: 2, status: "awaitingconfirm", tags: ["Vegetarian menu"], hasNote: false, hasFile: false, period: "evening" },
  { id: 308, time: "18:15", endTime: "19:15", section: "Restaurant", table: 9, guestName: "Sophia Williams", guests: 11, status: "waitingpayment", tags: [], hasNote: true, hasFile: false, period: "evening" },
  { id: 309, time: "18:15", endTime: "19:00", section: "First floor", table: 5, guestName: "Isabella White", guests: 2, status: "awaitingconfirm", tags: [], hasNote: true, hasFile: false, period: "evening" },
  { id: 310, time: "18:15", endTime: "19:15", section: "Restaurant", table: 5, guestName: "James Wilson", guests: 6, status: "awaitingconfirm", tags: [], hasNote: true, hasFile: false, period: "evening" },
  { id: 311, time: "18:15", endTime: "19:15", section: "First floor", table: 8, guestName: "Olivia Martinez", guests: 3, status: "awaitingconfirm", tags: ["Four seasons"], hasNote: true, hasFile: false, period: "evening" },
  { id: 312, time: "19:00", endTime: "20:00", section: "Restaurant", table: 2, guestName: "Noah Garcia", guests: 4, status: "awaitingconfirm", tags: ["Tasting menu"], hasNote: false, hasFile: false, period: "evening" },
  { id: 313, time: "19:00", endTime: "20:30", section: "First floor", table: 7, guestName: "Ava Thompson", guests: 8, status: "awaitingconfirm", tags: ["Anniversary ❤️"], hasNote: true, hasFile: true, period: "evening" },
  { id: 314, time: "19:30", endTime: "21:00", section: "Terrace", table: 3, guestName: "Liam Wilson", guests: 5, status: "awaitingconfirm", tags: ["VIP ⭐", "Wine pairing"], hasNote: true, hasFile: false, period: "evening" },
  { id: 315, time: "20:00", endTime: "21:30", section: "Restaurant", table: 6, guestName: "Emma Davis", guests: 2, status: "awaitingconfirm", tags: ["Birthday 🎂"], hasNote: false, hasFile: false, period: "evening", phone: "+84 97 *** 8812", bookingType: "banquet", banquetSubtype: "Birthday" },

  // ── UNASSIGNED (Waitlist) — table: 0 ───────────────────────
  { id: 401, time: "18:00", endTime: "19:30", section: "Restaurant", table: 0, guestName: "Pending — Nguyen Family",  guests: 6,  status: "reserved",      tags: ["VIP ⭐"],                     hasNote: true,  hasFile: false, period: "evening", phone: "+84 90 *** 4321", bookingType: "dine-in" },
  { id: 402, time: "19:00", endTime: "20:30", section: "Restaurant", table: 0, guestName: "Pending — Chen Group",    guests: 10, status: "awaitingconfirm", tags: ["Birthday 🎂", "Anniversary ❤️"], hasNote: false, hasFile: false, period: "evening", phone: "+84 91 *** 7788", bookingType: "banquet", banquetSubtype: "Birthday" },
  { id: 403, time: "20:00", endTime: "21:00", section: "Restaurant", table: 0, guestName: "Pending — Smith Co.",     guests: 8,  status: "reserved",      tags: ["Corporate", "Business"],     hasNote: true,  hasFile: true,  period: "evening", phone: "+84 93 *** 5566", bookingType: "banquet", banquetSubtype: "Company" },
  { id: 404, time: "17:30", endTime: "19:00", section: "Terrace",    table: 0, guestName: "Pending — Pham Wedding",  guests: 12, status: "reserved",      tags: ["Wedding 💍"],                 hasNote: true,  hasFile: true,  period: "evening", phone: "+84 97 *** 1234", bookingType: "banquet", banquetSubtype: "Wedding" },
  { id: 405, time: "18:30", endTime: "20:00", section: "Bar",         table: 0, guestName: "Pending — Le Birthday",  guests: 5,  status: "awaitingconfirm", tags: ["Birthday 🎂"],               hasNote: true,  hasFile: false, period: "evening", phone: "+84 98 *** 9090", bookingType: "banquet", banquetSubtype: "1st Birthday" },
  { id: 406, time: "19:30", endTime: "21:00", section: "Restaurant", table: 0, guestName: "Pending — Tran Co.",     guests: 9,  status: "awaitingconfirm", tags: ["Corporate"],                  hasNote: false, hasFile: false, period: "evening", phone: "+84 99 *** 8877", bookingType: "banquet", banquetSubtype: "Company" },
  { id: 407, time: "20:30", endTime: "22:00", section: "First floor", table: 0, guestName: "Pending — Hmm Group",   guests: 7,  status: "reserved",      tags: ["VIP ⭐"],                     hasNote: false, hasFile: true,  period: "evening", phone: "+84 91 *** 3344", bookingType: "dine-in" },
  // ── UNASSIGNED MORNING (cluster demo — overlapping 10:00–11:30) ─────────
  { id: 411, time: "10:00", endTime: "11:30", section: "Restaurant", table: 0, guestName: "Pending — Kim Group",    guests: 4, status: "reserved",      tags: ["VIP ⭐"],       hasNote: false, hasFile: false, period: "morning", phone: "+84 90 *** 1111", bookingType: "dine-in" },
  { id: 412, time: "10:15", endTime: "11:45", section: "Restaurant", table: 0, guestName: "Pending — Park Family",  guests: 6, status: "awaitingconfirm", tags: ["Birthday 🎂"], hasNote: true,  hasFile: false, period: "morning", phone: "+84 91 *** 2222", bookingType: "banquet", banquetSubtype: "Birthday" },
  { id: 413, time: "10:30", endTime: "12:00", section: "Restaurant", table: 0, guestName: "Pending — Lee Co.",      guests: 8, status: "reserved",      tags: ["Corporate"],   hasNote: false, hasFile: true,  period: "morning", phone: "+84 92 *** 3333", bookingType: "banquet", banquetSubtype: "Company" },
];

export const STATUS_META: Record<Status, { label: string; shortLabel: string; color: string; bg: string; dot: string }> = {
  awaitingconfirm: { label: "Awaiting Confirm", shortLabel: "Aw.C",  color: "#6a0dad", bg: "#f3e5f5", dot: "#9C27B0" },
  reserved:        { label: "Reserved",         shortLabel: "Res.",  color: "#e65100", bg: "#fff3e0", dot: "#FF9800" },
  seated:          { label: "Seated",           shortLabel: "Sea.",  color: "#006064", bg: "#e0f7fa", dot: "#00BCD4" },
  waitingpayment:  { label: "Waiting Payment",  shortLabel: "W.P.",  color: "#880e4f", bg: "#fce4ec", dot: "#E91E63" },
  completed:       { label: "Completed",        shortLabel: "Com.",  color: "#1b5e20", bg: "#e8f5e9", dot: "#4CAF50" },
  noshow:          { label: "No Show",          shortLabel: "N.S.",  color: "#b71c1c", bg: "#fef2f2", dot: "#F44336" },
  cancelled:       { label: "Cancelled",        shortLabel: "Can.",  color: "#424242", bg: "#f5f5f5", dot: "#9E9E9E" },
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

export type TimeState = "past" | "current" | "upcoming";

/** Globally mutates a booking's status and ensures "Early Free" duration slicing. */
export function updateBookingStatus(id: number, newStatus: Status, selectedDay: number) {
  const b = ALL_BOOKINGS.find(x => x.id === id);
  if (!b) return;

  b.status = newStatus;

  // Record actual seated time for split-color late visualization
  if (newStatus === "seated") {
    const dNow = new Date();
    const hh = String(dNow.getHours()).padStart(2, "0");
    const mm = String(dNow.getMinutes()).padStart(2, "0");
    b.actualSeatedTime = `${hh}:${mm}`;
  } else {
    // Clear if moved to another status
    delete b.actualSeatedTime;
  }

  // Early Free Logic
  if (newStatus === "completed") {
    const dNow = new Date();
    const nowMins = dNow.getHours() * 60 + dNow.getMinutes();
    const currDay = dNow.getDate();

    if (selectedDay === currDay) {
      const [eH, eM] = b.endTime.split(":").map(Number);
      const endMins = eH * 60 + eM;
      if (nowMins < endMins) {
        const roundedNowH = Math.floor(nowMins / 60);
        const roundedNowM = nowMins % 60;
        b.endTime = `${String(roundedNowH).padStart(2, "0")}:${String(roundedNowM).padStart(2, "0")}`;
      }
    }
  }
}

/** Returns the next available booking ID (max existing id + 1). */
export function getNextBookingId(): number {
  return Math.max(0, ...ALL_BOOKINGS.map(b => b.id)) + 1;
}

/** Derives the service period from a given HH:MM time string. */
export function getPeriodForTime(time: string): Period {
  const [h] = time.split(":").map(Number);
  if (h < 12) return "morning";
  if (h < 17) return "lunch";
  return "evening";
}

/** Pushes a new booking into the shared ALL_BOOKINGS array (global mutation). */
export function addBooking(newBooking: Booking): void {
  ALL_BOOKINGS.push(newBooking);
}

/** Merges a partial Booking payload into an existing booking (global mutation). */
export function updateBooking(id: number, patch: Partial<Booking>): void {
  const idx = ALL_BOOKINGS.findIndex(b => b.id === id);
  if (idx === -1) return;
  Object.assign(ALL_BOOKINGS[idx], patch);
}

/** Determines the visual hierarchy state of a booking on the timeline based on its status and time. */
export function getBookingTimeState(b: Booking, nowMin: number, day: number): TimeState {
  if (b.status === "completed" || b.status === "noshow" || b.status === "cancelled") return "past";
  const currentDay = new Date().getDate();
  if (day < currentDay) return "past";
  if (day > currentDay) return "upcoming";

  const [eh, em] = b.endTime.split(":").map(Number);
  const endMin = eh * 60 + em;
  
  if (endMin < nowMin) {
    // End time passed completely -> fade away as past
    return "past";
  }

  // Active guests (if they haven't finished yet)
  if (b.status === "seated" || b.status === "reserved" || b.status === "waitingpayment") return "current";

  const [sh, sm] = b.time.split(":").map(Number);
  const startMin = sh * 60 + sm;
  
  // Highlight as "Current" if it starts within the next 30 minutes
  if (startMin - nowMin <= 30 && startMin >= nowMin) {
    return "current";
  }
  
  return "upcoming";
}