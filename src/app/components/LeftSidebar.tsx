import React, { useRef, useCallback, useState } from "react";
import {
  ChevronLeft, ChevronRight, Settings, MessageSquare,
  FileText, Calendar, Users, Pencil, Sun, Coffee, Moon, Clock,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useLang } from "../context/LanguageContext";
import type { Lang } from "../i18n/translations";
import { getBookingsForDay } from "../data/bookings";

// March 2026 constants
const TODAY_DAY = new Date().getDate();
const DAYS_IN_MONTH = 31; // March 2026 has 31 days

const useStateAlias = useState; // keep alias intact for existing usages below

// ── Sidebar booking data type ────────────────────────────────
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

// ── Sub-components ────────────────────────────────────────────

// ── WeekStrip — compact 7-day week navigator ───────────────────
/**
 * Shows a single row of 7 days (S M T W T F S), centered on the selected day.
 * Prev/Next moves by 7 days.
 */
function WeekStrip({ selectedDay, onDaySelect }: { selectedDay: number; onDaySelect: (d: number) => void }) {
  // Week offset relative to today’s week (in weeks)
  const [weekOffset, setWeekOffset] = useState(0);

  // Build the 7-day array for the displayed week
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  // March 1, 2026 is a Sunday (dayOfWeek=0). We use March 2026 as an anchor.
  // Compute the Monday (day 1) of the week that contains TODAY_DAY
  const march1Dow = new Date(2026, 2, 1).getDay(); // should be 0 (Sun)
  const todayAbsDay = TODAY_DAY + march1Dow - 1; // 0-based index in the month grid
  const todayWeekStart = todayAbsDay - (todayAbsDay % 7); // Sunday of today’s week (0-based grid)

  const weekStartGridIdx = todayWeekStart + weekOffset * 7;
  const weekDays: (number | null)[] = Array.from({ length: 7 }, (_, i) => {
    const d = weekStartGridIdx + i - march1Dow + 2; // +2: offset month start alignment
    return d >= 1 && d <= DAYS_IN_MONTH ? d : null;
  });

  // Header: show range like "Mar 23–29" or month straddle
  const firstValid = weekDays.find(d => d !== null);
  const lastValid = [...weekDays].reverse().find(d => d !== null);
  const headerLabel = firstValid && lastValid
    ? `Mar ${firstValid}–${lastValid}, 2026`
    : "March 2026";

  return (
    <div className="px-3 pt-3 pb-2 border-b border-gray-100">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-800" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {headerLabel}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 transition-colors flex items-center justify-center"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-2 h-6 rounded-md hover:bg-blue-50 text-blue-600 transition-colors flex items-center justify-center"
            style={{ fontSize: 10, fontWeight: 700 }}
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 transition-colors flex items-center justify-center"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-gray-400" style={{ fontSize: 11, fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {weekDays.map((day, i) => {
          const isToday    = day === TODAY_DAY;
          const isSelected = day !== null && day === selectedDay;
          const isWeekend  = i === 0 || i === 6;
          return (
            <div key={i} className="flex justify-center items-center">
              <div
                onClick={() => day !== null && onDaySelect(day)}
                className="relative flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 30, height: 30, fontSize: 13,
                  fontWeight: isSelected || isToday ? 700 : 500,
                  cursor: day !== null ? "pointer" : "default",
                  backgroundColor: isSelected ? "#2563eb" : isToday && !isSelected ? "#dbeafe" : "transparent",
                  color: isSelected ? "white" : day === null ? "transparent" : isWeekend ? "#9ca3af" : isToday ? "#1d4ed8" : "#374151",
                  outline: isToday && !isSelected ? "2px solid #3b82f6" : "none",
                  outlineOffset: -2,
                }}
              >
                {day ?? ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event night legend */}
      <div
        className="mt-2 mx-0.5 flex items-start gap-1.5 px-1.5 py-1 rounded-lg cursor-default"
        style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
      >
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 border border-emerald-400 flex items-center justify-center shrink-0">
            <span className="w-1 h-1 rounded-full bg-emerald-600 block" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-emerald-800 truncate" style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1.3 }}>
            Chef’s Table Wednesday
          </p>
          <p className="text-emerald-600" style={{ fontSize: 8.5, lineHeight: 1.3 }}>
            Weekly recurring special event · fixed menu · fully pre-booked
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
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }} className="text-gray-800">{t.sidebar.bookingOpen}</span>
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
        <div className="flex gap-4">
          {/* Bookings */}
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <span className="font-semibold text-gray-800" style={{ fontSize: 14, lineHeight: 1.4 }}>30</span>
            <span className="text-gray-500" style={{ fontSize: 14, lineHeight: 1.4 }}>{t.sidebar.bookings}</span>
          </div>
          <div className="h-4 w-px bg-gray-200 self-center" />
          {/* Guests */}
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-gray-400 shrink-0" />
            <span className="font-semibold text-gray-800" style={{ fontSize: 14, lineHeight: 1.4 }}>86</span>
            <span className="text-gray-500" style={{ fontSize: 14, lineHeight: 1.4 }}>{t.sidebar.guests}</span>
          </div>
        </div>
        {/* Remaining today row */}
        <div className="flex gap-3 mt-1.5">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400 shrink-0" />
            <span className="text-gray-500" style={{ fontSize: 13, lineHeight: 1.4 }}>{t.sidebar.remainingToday}: 12 {t.sidebar.bookings.toLowerCase()}, 31 {t.sidebar.guests.toLowerCase()}</span>
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
      className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all flex flex-col gap-2 relative group"
      style={{ backgroundColor: booking.highlight || "white" }}
      onClick={() => onBookingClick(booking.id)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-gray-900 font-bold" style={{ fontSize: 13 }}>{booking.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5 text-gray-500" style={{ fontSize: 11 }}>
            <Users size={11} /> {booking.guests} Guests
          </div>
        </div>
        
        {/* Actions row */}
        <div className="flex items-center gap-1">
          {booking.hasSettings && (
            <button className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit"
              onClick={e => { e.stopPropagation(); onIconClick(booking.id, "edit"); }}><Settings size={12} /></button>
          )}
          {booking.hasNote && (
            <button className="p-1.5 rounded-lg bg-gray-50 text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Messages"
              onClick={e => { e.stopPropagation(); onIconClick(booking.id, "messages"); }}><MessageSquare size={12} /></button>
          )}
          {booking.hasFile && (
            <button className="p-1.5 rounded-lg bg-gray-50 text-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Documents"
              onClick={e => { e.stopPropagation(); onIconClick(booking.id, "documents"); }}><FileText size={12} /></button>
          )}
        </div>
      </div>
      
      {/* Tags */}
      {booking.tags && booking.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1 border-t border-gray-50 pt-2">
          {booking.tags.map(tag => (
            <span key={tag.label} className="px-2 py-0.5 rounded-md text-white font-medium shadow-sm transition-opacity hover:opacity-90" style={{ fontSize: 10, backgroundColor: tag.color }}>{tag.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dynamic booking list ──────────────────────────────────────
function DynamicBookingList({ selectedDay, onBookingClick, onIconClick }: {
  selectedDay: number;
  onBookingClick: (id: number) => void;
  onIconClick: (id: number, tab: string) => void;
}) {
  const dayBookings = getBookingsForDay(selectedDay);
  
  // Sort by start time
  const sorted = [...dayBookings].sort((a, b) => a.time.localeCompare(b.time));
  
  // Filter for ONLY Upcoming bookings (per requirements)
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const isToday = selectedDay === TODAY_DAY;
  
  const upcomingBookings = sorted.filter(b => {
    if (selectedDay < TODAY_DAY) return false;
    if (selectedDay > TODAY_DAY) return true;
    const [gh, gm] = b.time.split(":").map(Number);
    return (gh * 60 + gm) >= nowMins;
  });

  // Build time groups
  type Group = { time: string; bookings: typeof upcomingBookings };
  const groupMap = new Map<string, Group>();
  for (const b of upcomingBookings) {
    if (!groupMap.has(b.time)) groupMap.set(b.time, { time: b.time, bookings: [] });
    groupMap.get(b.time)!.bookings.push(b);
  }
  const groups = Array.from(groupMap.values());

  if (groups.length === 0) {
    return (
      <div className="px-3 py-10 text-center text-gray-400 flex flex-col items-center gap-2" style={{ fontSize: 12 }}>
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mb-1">
          <Calendar size={16} className="text-gray-300" />
        </div>
        No upcoming bookings
      </div>
    );
  }

  return (
    <div className="p-3 space-y-5">
      {groups.map((group) => {
        return (
          <div key={group.time}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold" style={{ fontSize: 11, letterSpacing: "0.02em" }}>{group.time}</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="space-y-3">
              {group.bookings.map((b) => (
                <BookingItem
                  key={b.id}
                  booking={{
                    id: b.id,
                    name: b.guestName,
                    guests: b.guests,
                    tags: b.tags.length > 0 ? b.tags.map(t => ({ label: t, color: "#0f766e" })) : undefined,
                    hasNote: b.hasNote,
                    hasFile: b.hasFile,
                    hasSettings: true,
                    timeGroup: b.time,
                  }}
                  onBookingClick={onBookingClick}
                  onIconClick={onIconClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}





// ── Main export ───────────────────────────────────────────────
const MIN_WIDTH = 256;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 256;

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
        <WeekStrip selectedDay={selectedDay} onDaySelect={onDaySelect} />
        <BookingStatusBar
          onOpenSettings={onOpenSettings}
          statsOpen={statsOpen}
          onToggleStats={() => setStatsOpen(v => !v)}
        />
        <StatsPanel collapsed={!statsOpen} />
        {/* Time-grouped booking list — dynamic from selectedDay */}
        <DynamicBookingList selectedDay={selectedDay} onBookingClick={onBookingClick} onIconClick={onIconClick} />
      </div>

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