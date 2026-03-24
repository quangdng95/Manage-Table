import React from "react";
import { ArrowRight, Sun, Utensils, Moon, Calendar, Users } from "lucide-react";
import { PERIOD_THEMES, ALL_BOOKINGS, getBookingsForDay, type Booking } from "../data/bookings";

const OCTAGON_CLIP =
  "polygon(29.3% 0%, 70.7% 0%, 100% 29.3%, 100% 70.7%, 70.7% 100%, 29.3% 100%, 0% 70.7%, 0% 29.3%)";

type TableStatus = "seated" | "arrived" | "noshow" | "available" | "taken" | "confirmed";

const STATUS_COLORS: Record<TableStatus, string> = {
  seated:    "#0f766e",
  arrived:   "#38bdf8",
  noshow:    "#ef4444",
  available: "#374151",
  taken:     "#8b5cf6",
  confirmed: "#9ca3af",
};

interface TableData {
  id: string;
  number: number;
  shape: "rect" | "octagon" | "circle";
  status: TableStatus;
  time: string;
  x: number;
  y: number;
  w: number;
  h: number;
  topChairs?: number;
  bottomChairs?: number;
  leftChairs?: number;
  rightChairs?: number;
  booking?: Booking;  // linked booking if any
}

// ── Per-period table statuses ───────────────────────────────
type PeriodStatuses = Record<string, TableStatus>;

const PERIOD_STATUS_MAP: Record<string, PeriodStatuses> = {
  All: {
    t1: "seated", t2: "seated", t3: "seated", t4: "arrived",
    t8a: "available", t8b: "available", t5: "noshow", t10: "seated",
    t8c: "taken", t6a: "available", t6b: "available",
    t9: "available", t11a: "available", t11b: "available", t11c: "available", t8d: "available",
  },
  Morning: {
    t1: "seated",    t2: "confirmed", t3: "available", t4: "seated",
    t8a: "available",t8b: "available", t5: "available", t10: "confirmed",
    t8c: "available",t6a: "available", t6b: "available",
    t9: "confirmed", t11a: "available", t11b: "available", t11c: "available", t8d: "available",
  },
  Lunch: {
    t1: "seated",    t2: "arrived",   t3: "seated",   t4: "seated",
    t8a: "confirmed",t8b: "seated",   t5: "noshow",   t10: "arrived",
    t8c: "confirmed",t6a: "seated",   t6b: "confirmed",
    t9: "available", t11a: "seated",  t11b: "arrived", t11c: "confirmed", t8d: "available",
  },
  Evening: {
    t1: "seated",    t2: "seated",   t3: "seated",    t4: "arrived",
    t8a: "available",t8b: "available",t5: "noshow",    t10: "seated",
    t8c: "taken",    t6a: "available",t6b: "available",
    t9: "available", t11a: "available",t11b: "available",t11c: "available",t8d: "available",
  },
};

// Period-specific next booking times (displayed on table)
const PERIOD_TIMES: Record<string, string> = {
  All:     "18:00",
  Morning: "09:00",
  Lunch:   "13:30",
  Evening: "22:15",
};

const CHAIR_DEPTH = 12;
const CHAIR_GAP = 5;
const CHAIR_WIDTH = 20;

function ChairRow({ count, tableW, tableH, color, side }: {
  count: number; tableW: number; tableH: number; color: string; side: "top" | "bottom";
}) {
  const spacing = tableW / count;
  const topVal = side === "top" ? -(CHAIR_DEPTH + CHAIR_GAP) : tableH + CHAIR_GAP;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: spacing * i + (spacing - CHAIR_WIDTH) / 2,
          top: topVal,
          width: CHAIR_WIDTH,
          height: CHAIR_DEPTH,
          backgroundColor: color,
          opacity: 0.85,
          borderRadius: side === "top" ? "3px 3px 0 0" : "0 0 3px 3px",
        }} />
      ))}
    </>
  );
}

function ChairCol({ count, tableH, tableW, color, side }: {
  count: number; tableH: number; tableW: number; color: string; side: "left" | "right";
}) {
  const spacing = tableH / count;
  const leftVal = side === "left" ? -(CHAIR_DEPTH + CHAIR_GAP) : tableW + CHAIR_GAP;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          top: spacing * i + (spacing - CHAIR_WIDTH) / 2,
          left: leftVal,
          width: CHAIR_DEPTH,
          height: CHAIR_WIDTH,
          backgroundColor: color,
          opacity: 0.85,
          borderRadius: side === "left" ? "3px 0 0 3px" : "0 3px 3px 0",
        }} />
      ))}
    </>
  );
}

function FloorTable({ table, period, onBookingClick }: { table: TableData; period: string; onBookingClick?: (id: number) => void }) {
  const color    = STATUS_COLORS[table.status];
  const hasGuest = table.booking && ["seated","arrived","taken","confirmed"].includes(table.status);
  const initials = table.booking
    ? table.booking.guestName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
    : null;

  function handleClick() {
    if (table.booking && onBookingClick) onBookingClick(table.booking.id);
  }

  return (
    <div style={{ position: "absolute", left: table.x, top: table.y, width: table.w, height: table.h }}>
      {table.topChairs    && <ChairRow count={table.topChairs} tableW={table.w} tableH={table.h} color={color} side="top" />}
      {table.bottomChairs && <ChairRow count={table.bottomChairs} tableW={table.w} tableH={table.h} color={color} side="bottom" />}
      {table.leftChairs   && <ChairCol count={table.leftChairs} tableH={table.h} tableW={table.w} color={color} side="left" />}
      {table.rightChairs  && <ChairCol count={table.rightChairs} tableH={table.h} tableW={table.w} color={color} side="right" />}

      <div
        className="hover:opacity-90 active:scale-95 transition-all select-none flex flex-col items-center justify-center group"
        style={{
          width: table.w,
          height: table.h,
          backgroundColor: color,
          borderRadius: table.shape === "circle" ? "50%" : table.shape === "rect" ? "8px" : "0",
          clipPath: table.shape === "octagon" ? OCTAGON_CLIP : undefined,
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          cursor: table.booking ? "pointer" : "default",
          position: "relative",
        }}
        onClick={handleClick}
        title={table.booking ? `${table.booking.guestName} · ${table.booking.time}–${table.booking.endTime} · ${table.booking.guests} guests` : `Table ${table.number} — available`}
      >
        {/* Table number */}
        <span style={{ color: "white", fontSize: table.w < 75 ? 13 : 18, fontWeight: 800, lineHeight: 1 }}>
          {table.number}
        </span>

        {/* Guest name or time */}
        {hasGuest && table.booking ? (
          <>
            <div style={{ color: "rgba(255,255,255,0.92)", fontSize: table.w < 75 ? 8.5 : 10, marginTop: 2, fontWeight: 600, letterSpacing: "0.01em", maxWidth: table.w - 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", paddingLeft: 4, paddingRight: 4 }}>
              {table.w < 80 ? initials : table.booking.guestName.split(" ")[0]}
            </div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: table.w < 75 ? 7.5 : 9, display: "flex", alignItems: "center", gap: 2, marginTop: 1 }}>
              <Users size={table.w < 75 ? 7 : 8} />
              <span>{table.booking.guests}</span>
              <span style={{ opacity: 0.6 }}>·</span>
              <span>{table.booking.time}</span>
            </div>
          </>
        ) : (
          <div style={{ color: "rgba(255,255,255,0.88)", fontSize: table.w < 75 ? 9 : 11, display: "flex", alignItems: "center", gap: 2, marginTop: table.w < 75 ? 2 : 4 }}>
            <ArrowRight size={table.w < 75 ? 7 : 9} />
            <span>{table.time}</span>
          </div>
        )}

        {/* "Click to view" hint on hover when has booking */}
        {table.booking && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            style={{ backgroundColor: "rgba(0,0,0,0.25)", borderRadius: table.shape === "circle" ? "50%" : table.shape === "rect" ? "8px" : "0", clipPath: table.shape === "octagon" ? OCTAGON_CLIP : undefined }}>
            <span className="text-white" style={{ fontSize: table.w < 75 ? 7.5 : 9, fontWeight: 700, textAlign: "center" }}>View</span>
          </div>
        )}
      </div>
    </div>
  );
}

const BASE_TABLES: Omit<TableData, "status" | "time" | "booking">[] = [
  { id: "t1",  number: 1,  shape: "rect",    x: 55,  y: 55,  w: 122, h: 65,  topChairs: 2, bottomChairs: 2 },
  { id: "t2",  number: 2,  shape: "rect",    x: 205, y: 55,  w: 122, h: 65,  topChairs: 2, bottomChairs: 2 },
  { id: "t3",  number: 3,  shape: "rect",    x: 358, y: 55,  w: 122, h: 65,  topChairs: 2, bottomChairs: 2 },
  { id: "t4",  number: 4,  shape: "rect",    x: 508, y: 55,  w: 172, h: 65,  topChairs: 3, bottomChairs: 3 },
  { id: "t8a", number: 8,  shape: "octagon", x: 720, y: 52,  w: 68,  h: 68  },
  { id: "t8b", number: 8,  shape: "octagon", x: 42,  y: 178, w: 118, h: 118 },
  { id: "t5",  number: 5,  shape: "octagon", x: 218, y: 178, w: 118, h: 118 },
  { id: "t10", number: 10, shape: "rect",    x: 388, y: 165, w: 80,  h: 132, leftChairs: 2, rightChairs: 2 },
  { id: "t8c", number: 8,  shape: "octagon", x: 568, y: 210, w: 94,  h: 94  },
  { id: "t6a", number: 6,  shape: "circle",  x: 272, y: 328, w: 68,  h: 68  },
  { id: "t6b", number: 6,  shape: "circle",  x: 375, y: 328, w: 68,  h: 68  },
  { id: "t9",  number: 9,  shape: "rect",    x: 30,  y: 422, w: 172, h: 76,  topChairs: 3, bottomChairs: 3 },
  { id: "t11a",number: 11, shape: "rect",    x: 228, y: 422, w: 118, h: 76,  topChairs: 2, bottomChairs: 2 },
  { id: "t11b",number: 11, shape: "rect",    x: 370, y: 422, w: 118, h: 76,  topChairs: 2, bottomChairs: 2 },
  { id: "t11c",number: 11, shape: "rect",    x: 510, y: 422, w: 118, h: 76,  topChairs: 2, bottomChairs: 2 },
  { id: "t8d", number: 8,  shape: "octagon", x: 720, y: 425, w: 68,  h: 68  },
];

const LEGEND_ITEMS: { color: string; label: string; border?: boolean }[] = [
  { color: STATUS_COLORS.seated,    label: "Seated" },
  { color: STATUS_COLORS.arrived,   label: "Arrived" },
  { color: STATUS_COLORS.confirmed, label: ">20 min. to arrival" },
  { color: STATUS_COLORS.noshow,    label: "No-show warning" },
  { color: STATUS_COLORS.taken,     label: "Taken" },
  { color: "transparent",           label: "Available", border: true },
];

interface TableplanProps {
  period: string;
  day: number;
  onBookingClick?: (id: number) => void;
}

export function Tableplan({ period, day, onBookingClick }: TableplanProps) {
  const theme = PERIOD_THEMES[period as keyof typeof PERIOD_THEMES] ?? PERIOD_THEMES.All;
  const statusMap = PERIOD_STATUS_MAP[period] ?? PERIOD_STATUS_MAP.All;
  const timeLabel = PERIOD_TIMES[period] ?? "18:00";

  const PeriodIcon = period === "Morning" ? Sun : period === "Lunch" ? Utensils : period === "Evening" ? Moon : Calendar;

  // Build booking lookup for Restaurant section + period
  const periodBookings = getBookingsForDay(day).filter(b => {
    if (period === "All") return b.section === "Restaurant";
    return b.section === "Restaurant" && b.period === period.toLowerCase();
  });

  function findBooking(tableNum: number): Booking | undefined {
    return periodBookings.find(b => b.table === tableNum);
  }

  const tables: TableData[] = BASE_TABLES.map(t => ({
    ...t,
    status: statusMap[t.id] ?? "available",
    time:   timeLabel,
    booking: findBooking(t.number),
  }));

  // Stats for current period
  const occupied = tables.filter(t => ["seated", "arrived"].includes(t.status)).length;
  const total = tables.length;
  const pct = Math.round((occupied / total) * 100);

  return (
    <div className="flex-1 flex flex-col overflow-auto" style={{ backgroundColor: "#f8fafc" }}>

      {/* ── Period Banner ── */}
      {period !== "All" && (
        <div
          className="flex items-center justify-between px-5 py-2.5 border-b shrink-0"
          style={{ background: theme.gradient, borderBottomColor: theme.accentMid }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.accent }}
            >
              <PeriodIcon size={15} color="white" />
            </div>
            <div>
              <div className="font-semibold" style={{ fontSize: 13, color: theme.textDark }}>{theme.label}</div>
              <div style={{ fontSize: 11, color: theme.textMid }}>{theme.sublabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="font-bold" style={{ fontSize: 18, color: theme.accent, lineHeight: 1 }}>{occupied}</div>
              <div style={{ fontSize: 10, color: theme.textMid }}>occupied</div>
            </div>
            <div className="text-center">
              <div className="font-bold" style={{ fontSize: 18, color: theme.accent, lineHeight: 1 }}>{total - occupied}</div>
              <div style={{ fontSize: 10, color: theme.textMid }}>available</div>
            </div>
            <div className="text-center">
              <div className="font-bold" style={{ fontSize: 18, color: theme.accent, lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 10, color: theme.textMid }}>utilization</div>
            </div>
            {/* Mini occupancy bar */}
            <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.accentMid }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: theme.accent }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-auto" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          {/* Floor plan canvas */}
          <div className="relative" style={{ minWidth: 830, minHeight: 560, padding: "22px 20px 28px 20px" }}>
            {tables.map(t => <FloorTable key={t.id} table={t} period={period} onBookingClick={onBookingClick} />)}
          </div>

          {/* Legend */}
          <div className="flex items-center flex-wrap gap-5 border-t border-gray-100 px-6 py-3" style={{ backgroundColor: "#fafafa" }}>
            {LEGEND_ITEMS.map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div style={{
                  width: 13, height: 13, borderRadius: 2, flexShrink: 0,
                  backgroundColor: item.border ? "transparent" : item.color,
                  border: item.border ? "1.5px solid #9ca3af" : "none",
                }} />
                <span className="text-gray-600" style={{ fontSize: 11 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}