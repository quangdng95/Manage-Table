import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, X, MessageSquare, FileText,
  ChevronDown, ChevronRight, Plus, Zap, Info, Clock,
} from "lucide-react";
import { ALL_BOOKINGS, getBookingsForDay, getBookingTimeState, type Booking } from "../data/bookings";
import { useLang } from "../context/LanguageContext";

// ── Layout constants ─────────────────────────────────────────
const START_HOUR  = 7;
const END_HOUR    = 22;
const LABEL_W     = 90;
const BAND_H      = 20;
const HDR_H       = 38;
const SEC_H       = 24;
// CURRENT_MIN removed — now computed live via nowMin state

// ── Period zoom config ────────────────────────────────────────
const PERIOD_CONFIG: Record<string, { startH: number; endH: number }> = {
  "All":     { startH: 7,  endH: 22 },
  "Morning": { startH: 7,  endH: 12 },
  "Lunch":   { startH: 12, endH: 17 },
  "Evening": { startH: 17, endH: 22 },
};

// ── Period bands ─────────────────────────────────────────────
const BANDS = [
  { from: 7*60,  to: 12*60, label: "Morning", bg: "#fef9c3", border: "#fde68a", text: "#92400e" },
  { from: 12*60, to: 17*60, label: "Lunch",   bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" },
  { from: 17*60, to: 22*60, label: "Evening", bg: "#ecfdf5", border: "#6ee7b7", text: "#064e3b" },
];

// ── Sections & tables ─────────────────────────────────────────
const SECTIONS = [
  { name: "Restaurant",  tables: [1,2,3,4,5,6,7,8,9,11] },
  { name: "First floor", tables: [1,2,3,5,7,8,9,10,11] },
  { name: "Terrace",     tables: [2,3,5,10] },
  { name: "Bar",         tables: [6,8] },
];

// ── Colors by STATUS ─────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  confirmed: "#6366f1",
  arrived:   "#0ea5e9",
  seated:    "#10b981",
  waiting:   "#f59e0b",
  noshow:    "#ef4444",
  cancelled: "#9ca3af",
};
const STATUS_LIGHT: Record<string, string> = {
  confirmed: "#a5b4fc",
  arrived:   "#7dd3fc",
  seated:    "#6ee7b7",
  waiting:   "#fcd34d",
  noshow:    "#f87171",
  cancelled: "#d1d5db",
};
function barColor(b: Booking) {
  return STATUS_COLOR[b.status] ?? "#6366f1";
}
function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToTimeStr(min: number) {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// ── Slot popup data ───────────────────────────────────────────
interface SlotPopupData {
  section: string;
  table: number;
  time: string;
  timeMin: number;
  screenX: number;
  screenY: number;
}

// ── Slot popup classification ─────────────────────────────────
function classifyTime(min: number, nowMin: number): "past" | "now" | "future" {
  if (min < nowMin - 14) return "past";
  if (min <= nowMin + 14) return "now";
  return "future";
}

// ── SlotPopup component ──────────────────────────────────────
interface SlotPopupProps {
  slot: SlotPopupData;
  nowMin: number;
  onNewBooking: (slot: SlotPopupData) => void;
  onWalkIn:     (slot: SlotPopupData) => void;
  onClose:      () => void;
}

function SlotPopup({ slot, nowMin, onNewBooking, onWalkIn, onClose }: SlotPopupProps) {
  const { t } = useLang();
  const ts = t.slot;
  const kind = classifyTime(slot.timeMin, nowMin);
  const popupRef = useRef<HTMLDivElement>(null);

  // Position popup near click but keep within viewport
  const [pos, setPos] = useState({ x: slot.screenX + 10, y: slot.screenY - 24 });
  useEffect(() => {
    if (!popupRef.current) return;
    const w = popupRef.current.offsetWidth;
    const h = popupRef.current.offsetHeight;
    let x = slot.screenX + 10;
    let y = slot.screenY - 24;
    if (x + w > window.innerWidth  - 8) x = slot.screenX - w - 10;
    if (y + h > window.innerHeight - 8) y = slot.screenY - h;
    if (y < 8) y = 8;
    setPos({ x, y });
  }, [slot]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [onClose]);

  const kindMeta = {
    past:   { badge: ts.badgePast,    badgeBg: "#f3f4f6", badgeText: "#6b7280", dotColor: "#9ca3af" },
    now:    { badge: ts.badgeNow,     badgeBg: "#dbeafe", badgeText: "#1d4ed8", dotColor: "#3b82f6" },
    future: { badge: slot.time,       badgeBg: "#d1fae5", badgeText: "#065f46", dotColor: "#10b981" },
  }[kind];

  return (
    <div
      ref={popupRef}
      className="fixed z-[100] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: 230, animation: "fadeSlotIn 0.15s cubic-bezier(0.34,1.4,0.64,1)" }}
    >
      <style>{`@keyframes fadeSlotIn { from { opacity:0; transform:scale(0.92) translateY(4px);} to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50 flex items-start justify-between gap-2">
        <div>
          <div className="text-gray-800" style={{ fontSize: 12, fontWeight: 700 }}>
            {slot.section} · T.{slot.table}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock size={10} className="text-gray-400" />
            <span className="text-gray-500" style={{ fontSize: 11 }}>{slot.time}</span>
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{ fontSize: 9.5, fontWeight: 700, backgroundColor: kindMeta.badgeBg, color: kindMeta.badgeText }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: kindMeta.dotColor }} />
              {kindMeta.badge}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"><X size={13} /></button>
      </div>

      {/* Options */}
      <div className="p-2.5 space-y-1.5">

        {/* Walk-in — always available */}
        <button
          onClick={() => { onWalkIn(slot); onClose(); }}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl border-2 hover:bg-blue-50 transition-colors text-left group"
          style={{ borderColor: kind !== "future" ? "#3b82f6" : "#e5e7eb" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
            style={{ backgroundColor: kind !== "future" ? "#3b82f6" : "#eff6ff" }}
          >
            <Zap size={14} color={kind !== "future" ? "white" : "#3b82f6"} />
          </div>
          <div>
            <div className="text-gray-800" style={{ fontSize: 12, fontWeight: 600 }}>{ts.walkIn}</div>
            <div className="text-gray-500" style={{ fontSize: 10.5 }}>
              {kind === "future" ? ts.walkInFutureDesc : ts.walkInNowDesc}
            </div>
          </div>
          {kind !== "future" && (
            <span className="ml-auto px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0" style={{ fontSize: 9, fontWeight: 700 }}>{ts.badgePrimary}</span>
          )}
        </button>

        {/* New booking — future & now only */}
        {kind !== "past" && (
          <button
            onClick={() => { onNewBooking(slot); onClose(); }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border-2 hover:bg-emerald-50 transition-colors text-left group"
            style={{ borderColor: kind === "future" ? "#10b981" : "#e5e7eb" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: kind === "future" ? "#10b981" : "#f0fdf4" }}
            >
              <Plus size={14} color={kind === "future" ? "white" : "#10b981"} />
            </div>
            <div>
              <div className="text-gray-800" style={{ fontSize: 12, fontWeight: 600 }}>{ts.newBooking}</div>
              <div className="text-gray-500" style={{ fontSize: 10.5 }}>
                {kind === "future" ? `${ts.newBookingFutureDesc} ${slot.time}` : ts.newBookingNowDesc}
              </div>
            </div>
            {kind === "future" && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0" style={{ fontSize: 9, fontWeight: 700 }}>{ts.badgePlan}</span>
            )}
          </button>
        )}

        {/* Past time note */}
        {kind === "past" && (
          <div className="flex items-start gap-2 px-1 pb-1">
            <Info size={11} className="text-gray-300 mt-0.5 shrink-0" />
            <p className="text-gray-400" style={{ fontSize: 10, lineHeight: 1.4 }}>{ts.pastNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────
export interface SlotInfo {
  section: string;
  table: number;
  timeSlot: string;
}

interface TimelineProps {
  period: string;
  day: number;
  onBookingClick?: (id: number) => void;
  onSlotNewBooking?: (slot: SlotInfo) => void;
  onSlotWalkIn?: (slot: SlotInfo) => void;
}

// ── Main component ────────────────────────────────────────────
export function Timeline({ period, day, onBookingClick, onSlotNewBooking, onSlotWalkIn }: TimelineProps) {
  const { t } = useLang();
  const tl = t.timeline;
  const ts = t.slot;
  const [search,    setSearch]    = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [popup,     setPopup]     = useState<SlotPopupData | null>(null);
  const [zoom,      setZoom]      = useState(1);
  const [rowHeight, setRowHeight] = useState(28);
  const scrollRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => Math.max(1, Math.min(5, z - (e.deltaY || e.deltaX) * 0.01)));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Live "now" minute — updates every 60 s ──────────────────
  const [nowMin, setNowMin] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Dynamic layout based on period ──────────────────────────
  const { startH, endH } = PERIOD_CONFIG[period] ?? PERIOD_CONFIG["All"];
  const START_MIN   = startH * 60;
  const END_MIN     = endH * 60;
  const totalMins   = END_MIN - START_MIN;
  const qCount      = (endH - startH) * 4 + 1;
  const hours       = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);

  const minToPct = (m: number) => ((m - START_MIN) / totalMins) * 100;

  // Filter bookings by day then by period/time window
  const dayBookings = getBookingsForDay(day);
  const visibleBookings = dayBookings.filter(b => {
    if (period === "All") return true;
    return timeToMin(b.time) < END_MIN && timeToMin(b.endTime) > START_MIN;
  });

  // Search matching
  const matchIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return new Set(visibleBookings.filter(b => b.guestName.toLowerCase().includes(q)).map(b => b.id));
  }, [search, period]);

  const matchCount = matchIds ? matchIds.size : null;

  function getOpacity(b: Booking): number {
    const searchOk = !matchIds || matchIds.has(b.id);
    return searchOk ? 1 : 0.1;
  }

  function isHighlighted(b: Booking) { return !!matchIds && matchIds.has(b.id); }

  function toggleSection(name: string) {
    setCollapsed(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }

  // Click on an empty cell in a row
  function handleCellClick(e: React.MouseEvent<HTMLDivElement>, section: string, table: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX  = e.clientX - rect.left;
    const rawMin = (relX / rect.width) * totalMins + START_MIN;
    const snapped = Math.round(rawMin / 15) * 15;
    const clamped = Math.max(START_MIN, Math.min(END_MIN - 15, snapped));
    setPopup({ section, table, time: minToTimeStr(clamped), timeMin: clamped, screenX: e.clientX, screenY: e.clientY });
  }

  const currentPct = nowMin >= START_MIN && nowMin <= END_MIN
    ? minToPct(nowMin)
    : -9999; // hide if outside view

  function scrollToNow() {
    const el = scrollRef.current;
    if (!el || currentPct <= 0) return;
    const trackWidth = el.scrollWidth - LABEL_W;
    const targetX = LABEL_W + (currentPct / 100) * trackWidth - (el.clientWidth / 2);
    el.scrollTo({ left: Math.max(0, targetX), behavior: "smooth" });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white relative" style={{ minHeight: 0 }}>

      {/* ── Search toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white shrink-0 flex-wrap">

        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={12} className="absolute text-gray-400 pointer-events-none" style={{ left: 9, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tl.searchPlaceholder}
            className="w-full border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-emerald-400 text-gray-700"
            style={{ paddingLeft: 28, paddingRight: search ? 28 : 10, paddingTop: 5, paddingBottom: 5, fontSize: 12 }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"><X size={12} /></button>
          )}
        </div>

        {matchIds !== null && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white"
            style={{ fontSize: 11, fontWeight: 600, backgroundColor: matchCount! > 0 ? "#0d9488" : "#ef4444" }}>
            {matchCount! > 0 ? `${matchCount} ${matchCount !== 1 ? tl.matchSuffixPlural : tl.matchSuffix}` : tl.noResults}
          </div>
        )}

        <div className="h-5 w-px bg-gray-200" />

        {/* Legend — status based */}
        <div className="flex items-center gap-3 flex-wrap">
          {([
            { label: "Confirmed", color: STATUS_COLOR.confirmed },
            { label: "Arrived",   color: STATUS_COLOR.arrived   },
            { label: "Seated",    color: STATUS_COLOR.seated    },
            { label: "Waiting",   color: STATUS_COLOR.waiting   },
            { label: "No-show",   color: STATUS_COLOR.noshow    },
            { label: "Cancelled", color: STATUS_COLOR.cancelled },
          ] as const).map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-gray-500" style={{ fontSize: 10 }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-gray-400" style={{ fontSize: 10.5 }}>
          <div className="flex items-center gap-2 px-2 border-r border-gray-200 mr-1">
            <span className="text-gray-400">Row</span>
            <input type="range" min={28} max={64} step={4} value={rowHeight} onChange={(e) => setRowHeight(parseInt(e.target.value))} className="w-20 accent-emerald-500 cursor-pointer" />
          </div>
          <div className="flex items-center gap-2 px-2 border-r border-gray-200 mr-1">
            <span className="text-gray-400">Zoom</span>
            <input type="range" min={1} max={5} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-20 accent-emerald-500 cursor-pointer" />
          </div>
          <button onClick={scrollToNow} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors cursor-pointer" style={{ fontWeight: 600 }}>
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            {tl.nowLabel} · {minToTimeStr(nowMin)}
          </button>
          <span className="text-gray-300 ml-1">·</span>
          <span>{tl.clickHint}</span>
        </div>
      </div>

      {/* ── Scrollable area ── */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-white relative">
        <div style={{ width: `${zoom * 100}%`, minWidth: "100%", minHeight: "100%", display: "flex", flexDirection: "column" }}>

          {/* Sticky Headers Container */}
          <div className="sticky top-0 flex flex-col shrink-0 z-30 bg-white border-b border-gray-200 drop-shadow-sm">

            {/* Period band row */}
            <div className="flex w-full" style={{ height: BAND_H }}>
              <div style={{ width: LABEL_W, minWidth: LABEL_W, backgroundColor: "#f8fafc" }} className="sticky left-0 z-40 border-r border-gray-200 shrink-0 flex-none" />
              <div className="relative flex-1 min-w-0" style={{ height: BAND_H }}>
              {period === "All" ? (
                BANDS.map(b => {
                  const left = minToPct(Math.max(b.from, START_MIN));
                  const right = minToPct(Math.min(b.to, END_MIN));
                  const width = Math.max(0, right - left);
                  if (width <= 0) return null;

                  const bandLabel = b.label === "Morning" ? tl.legendMorning : b.label === "Lunch" ? tl.legendLunch : tl.legendEvening;
                  return (
                    <div key={b.label} className="absolute top-0 bottom-0 flex items-center justify-center border-b"
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: b.bg, borderColor: b.border, borderRight: `1px solid ${b.border}` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: b.text, letterSpacing: "0.04em" }}>
                        {b.label === "Morning" ? "🌅" : b.label === "Lunch" ? "☀️" : "🌙"} {bandLabel}
                      </span>
                    </div>
                  );
                })
              ) : (
                // Zoomed view — single band spanning full width
                (() => {
                  const band = BANDS.find(b => b.label.toLowerCase() === period.toLowerCase()) ?? BANDS[2];
                  const svcLabel = tl.serviceLabel[period as keyof typeof tl.serviceLabel] ?? period;
                  return (
                    <div className="absolute inset-0 flex items-center justify-center border-b"
                      style={{ backgroundColor: band.bg, borderColor: band.border }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: band.text, letterSpacing: "0.04em" }}>
                        {band.label === "Morning" ? "🌅" : band.label === "Lunch" ? "☀️" : "🌙"} {svcLabel}
                      </span>
                    </div>
                  );
                })()
              )}
              {currentPct > 0 && <div className="absolute top-0 bottom-0" style={{ left: `${currentPct}%`, width: 1.5, backgroundColor: "#3b82f6", zIndex: 5 }} />}
            </div>
          </div>

          {/* Hour header */}
          <div className="flex w-full bg-white" style={{ height: HDR_H }}>
            <div className="sticky left-0 z-40 bg-white border-r border-gray-200 flex items-end pb-1 px-2 shrink-0 flex-none" style={{ width: LABEL_W }}>
              <span className="text-gray-400" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sec · T.</span>
            </div>
            <div className="relative flex-1 min-w-0" style={{ height: HDR_H }}>
              {Array.from({ length: qCount }, (_, i) => {
                const pct = minToPct(START_MIN + i * 15);
                return (
                  <div key={i} className="absolute top-0 bottom-0" style={{ left: `${pct}%`, width: 1, backgroundColor: i % 4 === 0 ? "#e5e7eb" : "#f3f4f6" }} />
                )
              })}
              {currentPct > 0 && <div className="absolute top-0 bottom-0" style={{ left: `${currentPct}%`, width: 1.5, backgroundColor: "#3b82f6", zIndex: 5 }} />}
              {hours.map(h => {
                if (h === endH) return null;
                const pct = minToPct(h * 60);
                const widthPct = (60 / totalMins) * 100;
                return (
                  <div key={h} className="absolute flex flex-col justify-end px-1" style={{ left: `${pct}%`, bottom: 4, width: `${widthPct}%` }}>
                    <span className="text-gray-600" style={{ fontSize: period === "All" ? 11 : 12, fontWeight: 500 }}>
                      {String(h).padStart(2, "0")}:00
                    </span>
                    {period !== "All" && (
                      <div className="flex gap-px mt-0.5">
                        {[15,30,45].map(m => (
                          <span key={m} className="text-gray-400" style={{ fontSize: 9 }}>{m}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fluid sections container */}
        <div className="flex-1 flex flex-col">
          {SECTIONS.map(sec => {
            const isColl  = collapsed.has(sec.name);
            const secBks  = ALL_BOOKINGS.filter(b => b.section === sec.name);
            const active  = secBks.filter(b => b.status === "seated" || b.status === "arrived").length;

            return (
              <div key={sec.name} className="contents">
                {/* Section header */}
                <div className="flex border-b border-gray-200 shrink-0 w-full sticky" style={{ top: BAND_H + HDR_H, zIndex: 20, height: SEC_H, backgroundColor: "#f1f5f9" }}>
                  <div
                    className="sticky left-0 z-30 flex justify-between items-center gap-1.5 px-2 border-r border-gray-300 cursor-pointer hover:bg-slate-200 transition-colors shrink-0 flex-none"
                    style={{ width: LABEL_W, backgroundColor: "#e2e8f0" }}
                    onClick={() => toggleSection(sec.name)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isColl ? <ChevronRight size={11} className="text-gray-500 shrink-0" /> : <ChevronDown size={11} className="text-gray-500 shrink-0" />}
                      <span className="font-semibold text-gray-700 truncate" style={{ fontSize: 10.5 }}>
                        {tl.sections[sec.name as keyof typeof tl.sections] ?? sec.name}
                      </span>
                    </div>
                    {active > 0 && (
                      <span className="px-1 rounded-full bg-emerald-500 text-white shrink-0" style={{ fontSize: 9, fontWeight: 700 }}>{active}</span>
                    )}
                  </div>
                  <div className="relative flex-1 min-w-0" style={{ backgroundColor: "#f1f5f9" }}>
                    {Array.from({ length: qCount }, (_, i) => {
                      const pct = minToPct(START_MIN + i * 15);
                      return (
                        <div key={i} className="absolute top-0 bottom-0" style={{ left: `${pct}%`, width: 1, backgroundColor: i % 4 === 0 ? "#cbd5e1" : "#e2e8f0" }} />
                      )
                    })}
                    {currentPct > 0 && <div className="absolute top-0 bottom-0" style={{ left: `${currentPct}%`, width: 1.5, backgroundColor: "#3b82f6" }} />}
                  </div>
                </div>

                {/* Table rows */}
                {!isColl && sec.tables.map((tableNum, i) => {
                  const rowBks = visibleBookings.filter(b => b.section === sec.name && b.table === tableNum);
                  const isEven = i % 2 === 1;

                  return (
                    <div key={tableNum} className="flex border-b border-gray-100 flex-1 w-full relative transition-all duration-75" style={{ minHeight: rowHeight }}>
                      {/* Label */}
                      <div className="sticky left-0 z-10 flex items-center justify-start border-r border-gray-200 px-3 shrink-0 flex-none"
                        style={{ width: LABEL_W, backgroundColor: isEven ? "#f9fafb" : "#ffffff" }}>
                        <span className="text-gray-600" style={{ fontSize: 11, fontWeight: 500 }}>T.{tableNum}</span>
                      </div>

                      {/* Timeline cell */}
                      <div className="relative flex-1 min-w-0 cursor-crosshair overflow-hidden group"
                        style={{ backgroundColor: isEven ? "#f9fafb" : "#ffffff" }}
                        onClick={e => handleCellClick(e, sec.name, tableNum)}>
                        {/* Grid lines */}
                        {Array.from({ length: qCount }, (_, qi) => {
                          const pct = minToPct(START_MIN + qi * 15);
                          return (
                            <div key={qi} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${pct}%`, width: 1, backgroundColor: qi % 4 === 0 ? "#e5e7eb" : "#f3f4f6" }} />
                          )
                        })}
                        {/* Past wash */}
                        {currentPct > 0 && <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: 0, width: `${currentPct}%`, backgroundColor: "rgba(0,0,0,0.015)" }} />}
                        {/* Current time line */}
                        {currentPct > 0 && <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${currentPct}%`, width: 1.5, backgroundColor: "#3b82f6", zIndex: 4, opacity: 0.7 }} />}
                        
                        {/* Hover Highlight */}
                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.02] pointer-events-none transition-colors" />

                        {/* Booking bars */}
                        {rowBks.map(b => {
                          const sMin = Math.max(timeToMin(b.time), START_MIN);
                          const eMin = Math.min(timeToMin(b.endTime), END_MIN);
                          const startPct = minToPct(sMin);
                          const widthPct = Math.max((eMin - sMin) / totalMins * 100, 2);
                          
                          const color   = barColor(b);
                          const light   = STATUS_LIGHT[b.status] ?? color;
                          const searchOp = getOpacity(b);
                          const hi      = isHighlighted(b);
                          const striped = b.status === "waiting" || b.status === "arrived";
                          
                          const timeState = getBookingTimeState(b, nowMin, day);
                          const isPast    = timeState === "past";
                          const isCurrent = timeState === "current";

                          return (
                            <div key={b.id} className="absolute rounded overflow-hidden"
                              style={{
                                left: `calc(${startPct}% + 1px)`, 
                                width: `calc(${widthPct}% - 2px)`,
                                top: "4px", bottom: "4px",
                                opacity: isPast ? 0.45 : searchOp,
                                filter: isPast ? "saturate(0.3) brightness(1.08)" : undefined,
                                zIndex: isCurrent ? 15 : hi ? 10 : 3,
                                background: striped
                                  ? `repeating-linear-gradient(45deg,${color},${color} 5px,${light} 5px,${light} 10px)`
                                  : color,
                                boxShadow: isCurrent ? `0 0 0 2px white, 0 0 0 3px ${color}` : hi ? `0 0 0 2px white, 0 0 0 3px ${color}` : "none",
                                cursor: "pointer",
                                transition: "opacity 0.15s, filter 0.15s",
                              }}
                              title={`${b.guestName} · ${b.time}–${b.endTime} · ${b.guests} guests${isPast && b.status === "completed" ? ` (Completed)` : ""}`}
                              onClick={e => { e.stopPropagation(); onBookingClick?.(b.id); }}>
                              <div className="flex items-center justify-between w-full h-full px-1.5 gap-0.5 min-w-0">
                                <span className="text-white truncate" style={{ fontSize: period === "All" ? 9.5 : 11, fontWeight: 500, lineHeight: 1, textDecorationLine: isPast && b.status === "completed" ? "line-through" : "none", textDecorationColor: "rgba(255,255,255,0.5)" }}>{b.guestName}</span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {b.hasNote && <MessageSquare size={period === "All" ? 7 : 9} color="rgba(255,255,255,0.85)" />}
                                  {b.hasFile && <FileText size={period === "All" ? 7 : 9} color="rgba(255,255,255,0.85)" />}
                                  <span className="text-white/80" style={{ fontSize: period === "All" ? 8.5 : 10 }}>{b.guests}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* ── Slot popup ── */}
      {popup && (
        <SlotPopup
          slot={popup}
          nowMin={nowMin}
          onNewBooking={slot => onSlotNewBooking?.({ section: slot.section, table: slot.table, timeSlot: slot.time })}
          onWalkIn={slot     => onSlotWalkIn?.({ section: slot.section, table: slot.table, timeSlot: slot.time })}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}