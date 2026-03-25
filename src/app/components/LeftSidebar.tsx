import React, { useRef, useCallback, useState as useStateAlias } from "react";
import {
  ChevronLeft, ChevronRight, Settings, MessageSquare,
  FileText, Calendar, Users, Pencil, Sun, Coffee, Moon, Clock, Globe,
  ChevronDown, ChevronUp, Info, X,
} from "lucide-react";
import { useLang } from "../context/LanguageContext";
import type { Lang } from "../i18n/translations";
import { getBookingsForDay } from "../data/bookings";

// ── March 2026 calendar ───────────────────────────────────────
const calendarWeeks = [
  { week: 9,  days: [null, null, null, null, null, null, 1] },
  { week: 10, days: [2,  3,  4,  5,  6,  7,  8]  },
  { week: 11, days: [9,  10, 11, 12, 13, 14, 15] },
  { week: 12, days: [16, 17, 18, 19, 20, 21, 22] },
  { week: 13, days: [23, 24, 25, 26, 27, 28, 29] },
  { week: 14, days: [30, 31, null, null, null, null, null] },
];

const TODAY_DAY = new Date().getDate();

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

// ── Icon Legend (collapsible) ─────────────────────────────────
function IconLegend() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-emerald-200 hover:text-emerald-700 transition-all text-gray-600 shadow-sm"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          <Info size={14} /> View Icon Legend
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden"
            style={{ animation: "fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2.5 font-bold text-gray-800" style={{ fontSize: 14 }}>
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Info size={12} strokeWidth={3} /></div> 
                What do the icons mean?
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center transition-colors"><X size={14}/></button>
            </div>
            
            <div className="p-5 space-y-4 bg-white">
              {[
                { icon: <Settings size={14} className="text-emerald-600" />, label: "Settings", desc: "Open booking editor to modify reservations", bg: "bg-emerald-50" },
                { icon: <MessageSquare size={14} className="text-blue-600" />, label: "Messages", desc: "Guest or staff notes and requests", bg: "bg-blue-50" },
                { icon: <FileText size={14} className="text-purple-600" />, label: "Documents", desc: "Attached menus, receipts & forms", bg: "bg-purple-50" },
                { icon: <Users size={14} className="text-gray-600" />, label: "Guests", desc: "Total number of guests in party", bg: "bg-gray-50" },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                  <div className={`w-9 h-9 rounded-lg ${row.bg} flex items-center justify-center shrink-0`}>{row.icon}</div>
                  <div>
                    <div className="text-gray-900" style={{ fontSize: 13, fontWeight: 700 }}>{row.label}</div>
                    <div className="text-gray-500 mt-0.5" style={{ fontSize: 12, lineHeight: 1.4 }}>{row.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center flex justify-end">
              <button 
                onClick={() => setOpen(false)}
                className="px-5 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors shadow-sm"
                style={{ fontSize: 12 }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
        {/* Time-grouped booking list — dynamic from selectedDay */}
        <DynamicBookingList selectedDay={selectedDay} onBookingClick={onBookingClick} onIconClick={onIconClick} />
      </div>

      {/* Icon Legend — global reference placed above language toggle */}
      <IconLegend />

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