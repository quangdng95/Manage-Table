import React, { useRef, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Settings, MessageSquare,
  FileText, Calendar, Users, Pencil, Sun, Coffee, Moon, Clock, Globe,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useLang } from "../context/LanguageContext";
import type { Lang } from "../i18n/translations";

// ── March 2026 calendar ───────────────────────────────────────
const calendarWeeks = [
  { week: 9,  days: [null, null, null, null, null, null, 1] },
  { week: 10, days: [2,  3,  4,  5,  6,  7,  8]  },
  { week: 11, days: [9,  10, 11, 12, 13, 14, 15] },
  { week: 12, days: [16, 17, 18, 19, 20, 21, 22] },
  { week: 13, days: [23, 24, 25, 26, 27, 28, 29] },
  { week: 14, days: [30, 31, null, null, null, null, null] },
];

const TODAY_DAY = 23;

// ── Sidebar booking data ──────────────────────────────────────
interface SideBooking {
  id: number;
  name: string;
  tags?: { label: string; color: string }[];
  guests: number;
  hasNote?: boolean;
  hasFile?: boolean;
  hasSettings?: boolean;
  highlight?: string;
  timeGroup: string;
}

const sidebarBookings: SideBooking[] = [
  { id: 301, name: "Alice Johnson",    tags: [{ label: "Evening menu",    color: "#16a34a" }], guests: 2,  hasNote: true,  hasFile: true,  hasSettings: true, highlight: "#f0fdf4", timeGroup: "17:00" },
  { id: 302, name: "Michael Smithson", tags: [{ label: "Seafood special", color: "#0891b2" }], guests: 8,  hasSettings: true,                                                         timeGroup: "17:00" },
  { id: 303, name: "Jessica Taylor",   guests: 4, hasNote: true, hasFile: true, hasSettings: true, highlight: "#fef2f2", timeGroup: "17:00" },
  { id: 304, name: "Clark Benson",     guests: 3, hasNote: true, hasSettings: true,                                                         timeGroup: "17:30" },
  { id: 305, name: "David Brown",      guests: 6, hasNote: true, hasFile: true, hasSettings: true, highlight: "#fffbeb", timeGroup: "17:45" },
  { id: 306, name: "Emily Davis",      tags: [{ label: "Four seasons",    color: "#7c3aed" }], guests: 2,  hasSettings: true, highlight: "#f5f3ff", timeGroup: "17:45" },
  { id: 307, name: "John Elliot",      tags: [{ label: "Vegetarian menu", color: "#15803d" }], guests: 2,  hasSettings: true,                       timeGroup: "17:45" },
  { id: 308, name: "Sophia Williams",  guests: 11, hasNote: true, hasSettings: true, timeGroup: "18:15" },
  { id: 309, name: "Isabella White",   guests: 2,  hasNote: true, hasSettings: true, timeGroup: "18:15" },
  { id: 310, name: "James Wilson",     guests: 6,  hasNote: true, hasSettings: true, timeGroup: "18:15" },
  { id: 311, name: "Olivia Martinez",  tags: [{ label: "Four seasons", color: "#7c3aed" }], guests: 3, hasNote: true, hasSettings: true, timeGroup: "18:15" },
];

// ── Sub-components ────────────────────────────────────────────

function MiniCalendar({ selectedDay, onDaySelect }: { selectedDay: number; onDaySelect: (d: number) => void }) {
  const { t } = useLang();
  const eventNightDays = [4, 11, 18];

  return (
    <div className="px-2 pt-2 pb-1">
      <div className="flex items-center justify-between mb-1">
        <button className="px-2 py-0.5 text-gray-600 border border-gray-200 rounded hover:bg-gray-50"
          style={{ fontSize: 10 }} onClick={() => onDaySelect(TODAY_DAY)}>
          {t.sidebar.today}
        </button>
        <div className="flex items-center gap-1">
          <button className="p-0.5 text-gray-500 hover:text-gray-700"><ChevronLeft size={14} /></button>
          <span className="text-gray-700" style={{ fontSize: 11, fontWeight: 600 }}>{t.sidebar.month}</span>
          <button className="p-0.5 text-gray-500 hover:text-gray-700"><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="flex items-center">
        <div style={{ width: 22, flexShrink: 0 }} />
        {t.sidebar.dayLabels.map((d, i) => (
          <div key={i} className="text-center" style={{
            flex: 1, fontSize: 10, fontWeight: 600,
            color: i >= 5 ? "#d1d5db" : "#9ca3af",
          }}>{d}</div>
        ))}
      </div>

      {/* Weeks */}
      {calendarWeeks.map((week) => (
        <div key={week.week} className="flex items-center">
          <div className="text-center text-gray-300" style={{ width: 22, flexShrink: 0, fontSize: 9 }}>{week.week}</div>
          {week.days.map((day, di) => {
            const isEvent    = day !== null && eventNightDays.includes(day);
            const isToday    = day === TODAY_DAY;
            const isSelected = day !== null && day === selectedDay;
            const isWeekend  = di >= 5;
            return (
              <div
                key={di}
                onClick={() => day !== null && onDaySelect(day)}
                className="relative flex items-center justify-center rounded-full transition-all"
                style={{
                  flex: 1, aspectRatio: "1", fontSize: 10,
                  cursor: day !== null ? "pointer" : "default",
                  backgroundColor:
                    isSelected && !isToday ? "#0f766e"
                    : isEvent             ? "#dcfce7"
                    : "transparent",
                  fontWeight: isSelected || isToday ? 700 : 400,
                  color:
                    isSelected && !isToday ? "white"
                    : isToday   ? "#0f766e"
                    : isEvent   ? "#15803d"
                    : isWeekend ? "#d1d5db"
                    : day === null ? "transparent"
                    : "#374151",
                  outline: isToday ? "2px solid #10b981" : "none",
                  outlineOffset: -1,
                }}
              >
                {day ?? ""}
                {isEvent && !isSelected && (
                  <span
                    className="absolute rounded-full bg-emerald-500"
                    style={{ width: 3, height: 3, bottom: 1, left: "50%", transform: "translateX(-50%)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Event night legend */}
      <div
        className="mt-1.5 mx-0.5 flex items-start gap-1.5 px-1.5 py-1 rounded-lg cursor-default"
        style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
        title={t.sidebar.eventNightDesc}
      >
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 border border-emerald-400 flex items-center justify-center shrink-0">
            <span className="w-1 h-1 rounded-full bg-emerald-600 block" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-emerald-800 truncate" style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1.3 }}>
            {t.sidebar.eventNight}
          </p>
          <p className="text-emerald-600" style={{ fontSize: 8.5, lineHeight: 1.3 }}>
            {t.sidebar.eventNightDesc}
          </p>
        </div>
      </div>
    </div>
  );
}

function BookingStatusBar({
  onOpenSettings,
  statsOpen,
  onToggleStats,
}: {
  onOpenSettings: () => void;
  statsOpen: boolean;
  onToggleStats: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-t border-b border-gray-100 bg-white">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span style={{ fontSize: 11 }} className="text-gray-700">{t.sidebar.bookingOpen}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSettings}
          className="text-gray-400 hover:text-emerald-600 transition-colors p-0.5 rounded hover:bg-emerald-50"
          title="Edit booking settings"
        >
          <Pencil size={12} />
        </button>
        {/* Collapse / expand toggle */}
        <button
          onClick={onToggleStats}
          className="text-gray-400 hover:text-emerald-600 transition-colors p-0.5 rounded hover:bg-emerald-50"
          title={statsOpen ? "Collapse stats" : "Expand stats"}
        >
          {statsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
    </div>
  );
}

function StatsPanel({ collapsed }: { collapsed: boolean }) {
  const { t } = useLang();

  if (collapsed) {
    // Compact view: only bookings count, guest count, remaining today
    return (
      <div className="px-2 py-1.5 border-b border-gray-100">
        <div className="flex gap-3">
          {/* Bookings */}
          <div className="flex items-center gap-1">
            <Calendar size={11} className="text-gray-400 shrink-0" />
            <span className="font-semibold text-gray-800" style={{ fontSize: 11 }}>30</span>
            <span className="text-gray-400" style={{ fontSize: 10 }}>{t.sidebar.bookings}</span>
          </div>
          <div className="h-3.5 w-px bg-gray-200 self-center" />
          {/* Guests */}
          <div className="flex items-center gap-1">
            <Users size={11} className="text-gray-400 shrink-0" />
            <span className="font-semibold text-gray-800" style={{ fontSize: 11 }}>86</span>
            <span className="text-gray-400" style={{ fontSize: 10 }}>{t.sidebar.guests}</span>
          </div>
        </div>
        {/* Remaining today row */}
        <div className="flex gap-3 mt-1">
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-gray-400 shrink-0" />
            <span className="text-gray-500" style={{ fontSize: 10 }}>{t.sidebar.remainingToday}: 12 {t.sidebar.bookings.toLowerCase()}, 31 {t.sidebar.guests.toLowerCase()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-2 border-b border-gray-100">
      <div className="flex gap-2 mb-2">
        <div className="flex items-center gap-0.5 text-gray-400"><Calendar size={13} /></div>
        <div className="flex items-center gap-0.5 text-gray-400"><Users size={13} /></div>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <div>
          <div className="text-gray-500" style={{ fontSize: 10 }}>{t.sidebar.bookings}</div>
          <div className="font-semibold text-gray-800" style={{ fontSize: 12 }}>30</div>
          <div style={{ fontSize: 10 }} className="text-gray-400">{t.sidebar.remainingToday}: 12</div>
          <div style={{ fontSize: 10 }} className="flex gap-1 mt-0.5">
            <Sun size={9} className="text-amber-400 mt-0.5" />
            <span className="text-gray-500">{t.sidebar.morning}: 6</span>
          </div>
          <div style={{ fontSize: 10 }} className="flex gap-1">
            <Coffee size={9} className="text-orange-400 mt-0.5" />
            <span className="text-gray-500">{t.sidebar.lunch}: 8</span>
          </div>
          <div style={{ fontSize: 10 }} className="flex gap-1">
            <Moon size={9} className="text-indigo-400 mt-0.5" />
            <span className="text-gray-500">{t.sidebar.evening}: 16</span>
          </div>
        </div>
        <div>
          <div className="text-gray-500" style={{ fontSize: 10 }}>{t.sidebar.guests}</div>
          <div className="font-semibold text-gray-800" style={{ fontSize: 12 }}>86 <span className="text-gray-400 font-normal" style={{ fontSize: 10 }}>(8)</span></div>
          <div style={{ fontSize: 10 }} className="text-gray-400">{t.sidebar.remainingToday}: 31 <span>(2)</span></div>
          <div style={{ fontSize: 10 }} className="text-gray-500">{t.sidebar.morning}: 18 <span className="text-gray-400">(4)</span></div>
          <div style={{ fontSize: 10 }} className="text-gray-500">{t.sidebar.lunch}: 22 <span className="text-gray-400">(0)</span></div>
          <div style={{ fontSize: 10 }} className="text-gray-500">{t.sidebar.evening}: 32 <span className="text-gray-400">(4)</span></div>
        </div>
      </div>
    </div>
  );
}

function BookingItem({ booking, onBookingClick, onIconClick }: {
  booking: SideBooking;
  onBookingClick: (id: number) => void;
  onIconClick: (id: number, tab: string) => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-2 py-1 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
      style={{ backgroundColor: booking.highlight || undefined, minHeight: 28 }}
    >
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              className="text-gray-800 truncate hover:text-emerald-700 hover:underline transition-colors text-left"
              style={{ fontSize: 11, fontWeight: 500 }}
              onClick={() => onBookingClick(booking.id)}
            >
              {booking.name}
            </button>
            {booking.tags?.map((tag) => (
              <span
                key={tag.label}
                className="px-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity"
                style={{ fontSize: 9, backgroundColor: tag.color, whiteSpace: "nowrap" }}
                onClick={() => onBookingClick(booking.id)}
                title={`Tag: ${tag.label}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0 ml-1">
        {booking.hasSettings && (
          <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Edit"
            onClick={() => onIconClick(booking.id, "edit")}><Settings size={10} /></button>
        )}
        {booking.hasNote && (
          <button className="text-blue-300 hover:text-blue-500 transition-colors" title="Messages"
            onClick={() => onIconClick(booking.id, "messages")}><MessageSquare size={10} /></button>
        )}
        {booking.hasFile && (
          <button className="text-purple-300 hover:text-purple-500 transition-colors" title="Documents"
            onClick={() => onIconClick(booking.id, "documents")}><FileText size={10} /></button>
        )}
        <div className="flex items-center gap-0.5 ml-1">
          <span className="font-medium text-gray-700" style={{ fontSize: 11 }}>{booking.guests}</span>
          <Users size={9} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
}

// ── Language toggle ───────────────────────────────────────────
function LangToggle() {
  const { lang, setLang, t } = useLang();
  const isEN = lang === "en";
  return (
    <div className="border-t border-gray-100 px-3 py-2.5 bg-white shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Globe size={12} className="text-gray-400" />
          <span className="text-gray-500" style={{ fontSize: 10.5 }}>{t.sidebar.language}</span>
        </div>

        <button
          onClick={() => setLang(lang === "en" ? "vi" : "en")}
          className="relative flex items-center rounded-full border border-gray-200 overflow-hidden transition-all hover:border-emerald-300"
          style={{ width: 72, height: 24, backgroundColor: "#f8fafc", padding: 2 }}
          aria-label="Toggle language"
        >
          <div
            className="absolute rounded-full transition-all duration-200"
            style={{
              width: 32, height: 18,
              backgroundColor: "#10b981",
              left: isEN ? 2 : 36,
              top: 2,
              boxShadow: "0 1px 3px rgba(16,185,129,0.35)",
            }}
          />
          <span
            className="relative z-10 transition-colors duration-200"
            style={{
              width: 34, textAlign: "center", fontSize: 10, fontWeight: 700,
              color: isEN ? "white" : "#9ca3af",
              letterSpacing: "0.03em",
            }}
          >
            EN
          </span>
          <span
            className="relative z-10 transition-colors duration-200"
            style={{
              width: 34, textAlign: "center", fontSize: 10, fontWeight: 700,
              color: !isEN ? "white" : "#9ca3af",
              letterSpacing: "0.03em",
            }}
          >
            VI
          </span>
        </button>
      </div>

      <div className="mt-1 text-center">
        <span className="text-gray-400" style={{ fontSize: 9.5 }}>{t.sidebar.langFull}</span>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
const MIN_WIDTH = 160;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 210;

export function LeftSidebar({ onOpenSettings, onBookingClick, onIconClick, selectedDay, onDaySelect }: {
  onOpenSettings: () => void;
  onBookingClick: (id: number) => void;
  onIconClick: (id: number, tab: string) => void;
  selectedDay: number;
  onDaySelect: (d: number) => void;
}) {
  const groups = [
    { time: "17:00" }, { time: "17:30" },
    { time: "17:45" }, { time: "18:15" },
  ];

  const [sidebarWidth, setSidebarWidth] = React.useState(DEFAULT_WIDTH);
  const [statsOpen, setStatsOpen] = React.useState(true);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth]);

  return (
    <aside
      className="flex flex-col border-r border-gray-200 bg-white relative"
      style={{ width: sidebarWidth, flexShrink: 0, height: "100%", overflow: "hidden" }}
    >
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <MiniCalendar selectedDay={selectedDay} onDaySelect={onDaySelect} />
        <BookingStatusBar
          onOpenSettings={onOpenSettings}
          statsOpen={statsOpen}
          onToggleStats={() => setStatsOpen(v => !v)}
        />
        <StatsPanel collapsed={!statsOpen} />
        {/* Time-grouped booking list */}
        <div>
          {groups.map((group) => {
            const groupBookings = sidebarBookings.filter((b) => b.timeGroup === group.time);
            return (
              <div key={group.time}>
                <div className="px-2 py-1 bg-gray-50 border-b border-gray-100 flex items-center gap-1">
                  <Clock size={10} className="text-gray-400" />
                  <span className="font-semibold text-gray-600" style={{ fontSize: 11 }}>{group.time}</span>
                </div>
                {groupBookings.map((b) => (
                  <BookingItem key={b.id} booking={b} onBookingClick={onBookingClick} onIconClick={onIconClick} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Language toggle — pinned to bottom */}
      <LangToggle />

      {/* ── Drag resize handle ── */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 5,
          height: "100%",
          cursor: "col-resize",
          zIndex: 10,
          // subtle visual hint on hover
        }}
        className="group"
      >
        {/* Thin highlight line visible on hover */}
        <div
          className="absolute inset-y-0 right-0 group-hover:bg-emerald-400 transition-colors duration-150"
          style={{ width: 3, backgroundColor: "transparent" }}
        />
      </div>
    </aside>
  );
}