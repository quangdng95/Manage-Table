import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, X, MessageSquare, FileText,
  ChevronDown, ChevronRight, Plus, Zap, Info, Clock,
  Settings, Users, EyeOff, Eye, ChevronLeft, Layers,
} from "lucide-react";
import { ALL_BOOKINGS, STATUS_META, getBookingsForDay, getBookingTimeState, type Booking } from "../data/bookings";
import { useLang } from "../context/LanguageContext";

// ── Unassigned pool threshold ────────────────────────────────
const UNASSIGNED_POOL_THRESHOLD = 5;

// ── Cluster overlap detection ─────────────────────────────────
interface UnassignedCluster {
  bookings: Booking[];
  sMin: number; // earliest start across all bookings in cluster
  eMin: number; // latest end
}

/** Groups unassigned bookings into overlap clusters.
 *  Two bookings overlap if their time spans intersect at all. */
function buildUnassignedClusters(
  bookings: Booking[],
  startMin: number,
  endMin: number,
): UnassignedCluster[] {
  // Pre-compute clamped mins for each booking
  const items = bookings.map(b => ({
    b,
    s: Math.max(timeToMin(b.time),    startMin),
    e: Math.min(timeToMin(b.endTime), endMin),
  }));

  const clusters: UnassignedCluster[] = [];

  for (const item of items) {
    // Try to merge into existing cluster that overlaps with this booking
    const match = clusters.find(c => item.s < c.eMin && item.e > c.sMin);
    if (match) {
      match.bookings.push(item.b);
      match.sMin = Math.min(match.sMin, item.s);
      match.eMin = Math.max(match.eMin, item.e);
    } else {
      clusters.push({ bookings: [item.b], sMin: item.s, eMin: item.e });
    }
  }

  return clusters;
}

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

// ── Booking type helpers ───────────────────────────────────────────────────────
const BANQUET_ICONS: Record<string, string> = {
  "1st Birthday": "🍰",
  "Birthday":     "🎂",
  "Company":      "🏢",
  "Wedding":      "💍",
  "Other":        "✨",
};
function bookingTypeLabel(b: { bookingType?: string; banquetSubtype?: string }, wide: boolean): string | null {
  if (!b.bookingType) return null;
  if (b.bookingType === "dine-in") return wide ? "🍽️ D-in" : "🍽️";
  const icon = b.banquetSubtype ? (BANQUET_ICONS[b.banquetSubtype] ?? "🎊") : "🎊";
  return wide && b.banquetSubtype ? `${icon} ${b.banquetSubtype}` : icon;
}

// ── Status colors — driven from STATUS_META (single source of truth) ─────────
const LATE_COLOR       = "#F44336";  // Red for overdue Reserved/AwaitingConfirm
const LATE_LIGHT       = "#FFCDD2";

function isBookingOverdue(b: Booking, nowMin: number): boolean {
  if (b.status !== "reserved" && b.status !== "awaitingconfirm") return false;
  const [h, m] = b.time.split(":").map(Number);
  return (h * 60 + m) < nowMin;
}
function barColor(b: Booking, nowMin: number): string {
  if (isBookingOverdue(b, nowMin)) return LATE_COLOR;
  return STATUS_META[b.status]?.dot ?? "#6b7280";
}
function barLight(b: Booking, nowMin: number): string {
  if (isBookingOverdue(b, nowMin)) return LATE_LIGHT;
  // lighter tint of dot color
  return STATUS_META[b.status]?.bg ? STATUS_META[b.status].bg : "#e5e7eb";
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

    const walkInBtn = (
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
    );

    const newBookingBtn = kind !== "past" ? (
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
    ) : null;

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

        {/* Options — context-ordered: future → New booking first; now/past → Walk-in first */}
        <div className="p-2.5 space-y-1.5">
          {kind === "future" ? (
            <>{newBookingBtn}{walkInBtn}</>
          ) : (
            <>{walkInBtn}{newBookingBtn}</>
          )}
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

// ── Unassigned Inline Row (with cluster grouping) ─────────────
interface UnassignedInlineRowProps {
  unassignedBookings: Booking[];
  rowHeight: number;
  qCount: number;
  START_MIN: number;
  END_MIN: number;
  totalMins: number;
  minToPct: (m: number) => number;
  currentPct: number;
  draggableIds: Set<number>;
  startDragTimer: (id: number) => void;
  cancelDragTimer: (id: number) => void;
  onBookingClick?: (id: number) => void;
}

function UnassignedInlineRow({
  unassignedBookings, rowHeight, qCount, START_MIN, END_MIN, totalMins,
  minToPct, currentPct, draggableIds, startDragTimer, cancelDragTimer, onBookingClick,
}: UnassignedInlineRowProps) {
  const [openCluster, setOpenCluster] = useState<{ cluster: UnassignedCluster; rect: DOMRect } | null>(null);

  const clusters = useMemo(
    () => buildUnassignedClusters(unassignedBookings, START_MIN, END_MIN),
    [unassignedBookings, START_MIN, END_MIN],
  );

  return (
    <>
      <div className="flex border-b-2 border-amber-300 w-full relative" style={{ minHeight: rowHeight + 4, backgroundColor: "#fffbeb" }}>
        {/* Row label */}
        <div className="sticky left-0 z-10 flex flex-col items-start justify-center border-r-2 border-amber-300 px-2 shrink-0 flex-none" style={{ width: 90, backgroundColor: "#fef3c7" }}>
          <span className="font-bold text-amber-700" style={{ fontSize: 10, lineHeight: 1 }}>⚠ Unassigned</span>
          <span className="text-amber-500" style={{ fontSize: 8.5 }}>Drag to assign</span>
        </div>

        {/* Bar area */}
        <div
          className="relative flex-1 min-w-0 overflow-hidden"
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
          onDrop={e => { e.preventDefault(); }}
        >
          {/* Grid lines */}
          {Array.from({ length: qCount }, (_, qi) => {
            const pct = minToPct(START_MIN + qi * 15);
            return <div key={qi} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${pct}%`, width: 1, backgroundColor: qi % 4 === 0 ? "#fde68a" : "#fef9c3" }} />;
          })}
          {currentPct > 0 && <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${currentPct}%`, width: 1.5, backgroundColor: "#3b82f6", zIndex: 4, opacity: 0.7 }} />}

          {/* Render each cluster */}
          {clusters.map((cluster, ci) => {
            const sPct = minToPct(cluster.sMin);
            const wPct = Math.max((cluster.eMin - cluster.sMin) / totalMins * 100, 2);
            const isSolo = cluster.bookings.length === 1;

            if (isSolo) {
              // ── Single booking: normal draggable bar ──────────────────
              const b = cluster.bookings[0];
              const color = STATUS_META[b.status]?.dot ?? "#f59e0b";
              const isDraggable = draggableIds.has(b.id);
              return (
                <div key={b.id}
                  className={`absolute rounded overflow-hidden border-2 border-dashed border-amber-400 ${isDraggable ? "scale-105 ring-2 ring-amber-400 shadow-xl" : ""}`}
                  draggable={isDraggable}
                  onPointerDown={() => startDragTimer(b.id)}
                  onPointerUp={() => cancelDragTimer(b.id)}
                  onPointerCancel={() => cancelDragTimer(b.id)}
                  onPointerLeave={() => cancelDragTimer(b.id)}
                  onDragStart={e => {
                    e.dataTransfer.setData("application/booking-move", JSON.stringify({ id: b.id, sourceSec: "__unassigned", sourceTab: 0 }));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => cancelDragTimer(b.id)}
                  onClick={e => { e.stopPropagation(); onBookingClick?.(b.id); }}
                  style={{ left: `calc(${sPct}% + 1px)`, width: `calc(${wPct}% - 2px)`, top: 4, bottom: 4, background: color, cursor: isDraggable ? "grabbing" : "grab", touchAction: "pan-x pan-y" }}
                  title={`${b.guestName} · ${b.time}–${b.endTime} · ${b.guests} guests · UNASSIGNED`}
                >
                  <div className="flex flex-col justify-center w-full h-full px-2 min-w-0 pointer-events-none">
                    <div className="flex items-center gap-0.5 min-w-0">
                      <span className="text-white truncate" style={{ fontSize: 9.5, fontWeight: 700, lineHeight: 1 }}>{b.guestName}</span>
                      <span className="ml-0.5 text-white/90 shrink-0" style={{ fontSize: 9 }}>⚠️</span>
                      <span className="ml-auto text-white/80" style={{ fontSize: 9 }}>{b.guests}</span>
                    </div>
                    {rowHeight >= 36 && b.phone && wPct > 7 && (
                      <span className="text-white/65 truncate" style={{ fontSize: 8.5, lineHeight: 1, marginTop: 2 }}>{b.phone}</span>
                    )}
                  </div>
                </div>
              );
            }

            // ── Cluster block: stacked visual + badge ─────────────────
            const isOpen = openCluster?.cluster === cluster;
            return (
              <div key={`cluster-${ci}`}
                className="absolute cursor-pointer group/cluster"
                style={{ left: `calc(${sPct}% + 1px)`, width: `calc(${wPct}% - 2px)`, top: 4, bottom: 4, zIndex: isOpen ? 20 : 5 }}
                onClick={e => {
                  e.stopPropagation();
                  if (isOpen) { setOpenCluster(null); return; }
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setOpenCluster({ cluster, rect });
                }}
                title={`${cluster.bookings.length} overlapping bookings — click to expand`}
              >
                {/* Stacked shadow layers (decorative) */}
                <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: "#fbbf24", transform: "translateY(4px) scaleX(0.94)", opacity: 0.4, borderRadius: 8 }} />
                <div className="absolute inset-0 rounded-lg" style={{ backgroundColor: "#f59e0b", transform: "translateY(2px) scaleX(0.97)", opacity: 0.6, borderRadius: 8 }} />
                {/* Main block */}
                <div
                  className="absolute inset-0 rounded-lg border-2 border-dashed border-amber-500 flex items-center justify-center gap-1.5 transition-all group-hover/cluster:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    boxShadow: isOpen ? "0 0 0 3px white, 0 0 0 5px #f59e0b" : "none",
                  }}
                >
                  <Layers size={10} className="text-white/90 shrink-0" />
                  <span className="text-white font-bold" style={{ fontSize: 10, lineHeight: 1 }}>
                    {cluster.bookings.length} Pending
                  </span>
                  {/* Count badge */}
                  <span
                    className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0"
                    style={{ fontSize: 8, fontWeight: 800 }}
                  >
                    {cluster.bookings.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cluster popover — position:fixed so it floats above all content without a portal */}
      {openCluster && (
        <ClusterPopover
          cluster={openCluster.cluster}
          anchorRect={openCluster.rect}
          onClose={() => setOpenCluster(null)}
          onBookingClick={onBookingClick}
          draggableIds={draggableIds}
          startDragTimer={startDragTimer}
          cancelDragTimer={cancelDragTimer}
        />
      )}
    </>
  );
}


interface ClusterPopoverProps {
  cluster: UnassignedCluster;
  anchorRect: DOMRect;
  onClose: () => void;
  onBookingClick?: (id: number) => void;
  draggableIds: Set<number>;
  startDragTimer: (id: number) => void;
  cancelDragTimer: (id: number) => void;
}
function ClusterPopover({
  cluster, anchorRect, onClose, onBookingClick, draggableIds, startDragTimer, cancelDragTimer,
}: ClusterPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Position below the anchor block, clamped to viewport
  const [pos, setPos] = useState({ x: anchorRect.left, y: anchorRect.bottom + 6 });
  useEffect(() => {
    if (!ref.current) return;
    const pw = ref.current.offsetWidth;
    const ph = ref.current.offsetHeight;
    let x = anchorRect.left;
    let y = anchorRect.bottom + 6;
    if (x + pw > window.innerWidth - 8) x = window.innerWidth - pw - 8;
    if (y + ph > window.innerHeight - 8) y = anchorRect.top - ph - 6;
    if (x < 8) x = 8;
    setPos({ x, y });
  }, [anchorRect]);

  // Close on outside click — but NOT during a drag (dragover won't fire mousedown)
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    // Delay so the opening click doesn't immediately re-close
    const t = setTimeout(() => document.addEventListener('mousedown', onDown, true), 80);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDown, true); };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[200] bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden"
      style={{
        left: pos.x, top: pos.y,
        minWidth: 220, maxWidth: 300,
        animation: 'clusterPopIn 0.16s cubic-bezier(0.34,1.4,0.64,1)',
      }}
    >
      <style>{`@keyframes clusterPopIn { from{opacity:0;transform:scale(0.92) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-amber-100" style={{ backgroundColor: '#fef3c7' }}>
        <div className="flex items-center gap-1.5">
          <Layers size={12} className="text-amber-700" />
          <span className="font-bold text-amber-800" style={{ fontSize: 11 }}>
            {cluster.bookings.length} Overlapping — Unassigned
          </span>
        </div>
        <button onClick={onClose} className="text-amber-500 hover:text-amber-800 transition-colors">
          <X size={13} />
        </button>
      </div>

      {/* Booking cards */}
      <div className="p-2 space-y-1.5" style={{ backgroundColor: '#fffbeb' }}>
        {cluster.bookings.map(b => {
          const color  = STATUS_META[b.status]?.dot ?? '#f59e0b';
          const meta   = STATUS_META[b.status];
          const isDrag = draggableIds.has(b.id);
          return (
            <div
              key={b.id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData(
                  'application/booking-move',
                  JSON.stringify({ id: b.id, sourceSec: '__unassigned', sourceTab: 0 }),
                );
                e.dataTransfer.effectAllowed = 'move';
                // keep popover open so the ghost image renders, but schedule close
                setTimeout(onClose, 200);
              }}
              onPointerDown={() => startDragTimer(b.id)}
              onPointerUp={() => cancelDragTimer(b.id)}
              onPointerCancel={() => cancelDragTimer(b.id)}
              onDragEnd={() => cancelDragTimer(b.id)}
              onClick={e => { e.stopPropagation(); onClose(); onBookingClick?.(b.id); }}
              className={`flex items-start gap-2 p-2 rounded-xl border-2 border-dashed cursor-grab select-none transition-all ${
                isDrag ? 'scale-105 shadow-xl ring-2 ring-amber-400' : 'hover:shadow-md hover:border-amber-400'
              }`}
              style={{ borderColor: color + '80', backgroundColor: meta?.bg ?? '#fff' }}
              title={`${b.guestName} · ${b.time}–${b.endTime} · Drag to assign`}
            >
              {/* Color dot */}
              <div className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold truncate" style={{ fontSize: 10.5, color: meta?.color ?? '#92400e' }}>
                    {b.guestName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ fontSize: 8, fontWeight: 700, backgroundColor: color }}>
                    {meta?.shortLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5" style={{ fontSize: 9.5, color: '#92400e', opacity: 0.75 }}>
                  <Clock size={8} />
                  <span>{b.time}–{b.endTime}</span>
                  <Users size={8} />
                  <span>{b.guests} pax</span>
                </div>
              </div>
            </div>
          );
        })}
        <p className="text-center text-amber-500 pt-0.5" style={{ fontSize: 9 }}>Drag any card above onto a table row</p>
      </div>
    </div>
  );
}

// ── Unified Legend Modal ──────────────────────────────────────
function UnifiedLegendModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        style={{ fontSize: 11, fontWeight: 600 }}
      >
        <Info size={13} />
        (i) Click to view Legend
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 font-bold text-gray-800" style={{ fontSize: 14 }}>
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Info size={12} strokeWidth={3} /></div> 
                Unified Legend
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center transition-colors"><X size={14}/></button>
            </div>
            
            <div className="p-5 space-y-6 bg-white overflow-y-auto max-h-[70vh]">
              {/* Status Colors */}
              <div>
                <h4 className="text-gray-900 font-bold mb-3" style={{ fontSize: 12 }}>Booking Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  {(["awaitingconfirm","reserved","seated","waitingpayment","completed","noshow","cancelled"] as const).map(s => (
                    <div key={s} className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_META[s].dot }} />
                       <span className="text-gray-600" style={{ fontSize: 11 }}>{STATUS_META[s].label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Icon Legend */}
              <div>
                <h4 className="text-gray-900 font-bold mb-3" style={{ fontSize: 12 }}>Icons</h4>
                <div className="space-y-3">
                  {[
                    { icon: <Settings size={14} className="text-emerald-600" />, label: "Settings", desc: "Open booking editor to modify reservations", bg: "bg-emerald-50" },
                    { icon: <MessageSquare size={14} className="text-blue-600" />, label: "Messages", desc: "Guest or staff notes and requests", bg: "bg-blue-50" },
                    { icon: <FileText size={14} className="text-purple-600" />, label: "Documents", desc: "Attached menus, receipts & forms", bg: "bg-purple-50" },
                    { icon: <Users size={14} className="text-gray-600" />, label: "Guests", desc: "Total number of guests in party", bg: "bg-gray-50" },
                  ].map(row => (
                    <div key={row.label} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <div className={`w-8 h-8 rounded-md ${row.bg} flex items-center justify-center shrink-0`}>{row.icon}</div>
                      <div>
                        <div className="text-gray-900" style={{ fontSize: 12, fontWeight: 700 }}>{row.label}</div>
                        <div className="text-gray-500 mt-0.5" style={{ fontSize: 11, lineHeight: 1.3 }}>{row.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button 
                onClick={() => setOpen(false)}
                className="px-5 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors shadow-sm text-xs"
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

// ── Props ─────────────────────────────────────────────────────
export interface SlotInfo {
  section: string;
  table: number;
  timeSlot: string;
  additionalTables?: { section: string; table: number }[];
}

interface TimelineProps {
  period: string;
  day: number;
  onBookingClick?: (id: number) => void;
  onSlotNewBooking?: (slot: SlotInfo) => void;
  onSlotWalkIn?: (slot: SlotInfo) => void;
  forceRender?: number;
  hideCancelledNoshow?: boolean;
  onHideCancelledNoshowChange?: (v: boolean) => void;
}

// ── Main component ────────────────────────────────────────────
export function Timeline({ period, day, onBookingClick, onSlotNewBooking, onSlotWalkIn, forceRender, hideCancelledNoshow = false, onHideCancelledNoshowChange }: TimelineProps) {
  const { t } = useLang();
  const tl = t.timeline;
  const ts = t.slot;
  const [search,         setSearch]         = useState("");
  const [collapsed,      setCollapsed]      = useState<Set<string>>(new Set());
  const [popup,          setPopup]          = useState<SlotPopupData | null>(null);
  const [zoom,           setZoom]           = useState(1);
  const [rowHeight,      setRowHeight]      = useState(28);
  const [,               setTick]           = useState(0);
  const [hoveredId,      setHoveredId]      = useState<number|null>(null);
  const [poolOpen,       setPoolOpen]       = useState(false);
  const scrollRef                           = useRef<HTMLDivElement>(null);
  const gridRef                             = useRef<HTMLDivElement>(null);

  // Tablet Long Press Drag state
  const [draggableIds, setDraggableIds] = useState<Set<number>>(new Set());
  const dragTimers = useRef<Record<number, number>>({});

  const startDragTimer = (id: number) => {
    dragTimers.current[id] = window.setTimeout(() => {
      setDraggableIds(prev => new Set(prev).add(id));
    }, 300);
  };
  const cancelDragTimer = (id: number) => {
    if (dragTimers.current[id]) {
      window.clearTimeout(dragTimers.current[id]);
      delete dragTimers.current[id];
    }
    setDraggableIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Drag to resize state
  const [dragState, setDragState] = useState<{ id: number; field: "time"|"endTime"; originalMins: number; startX: number; pointerId: number } | null>(null);
  const [dragDelta, setDragDelta] = useState(0);

  function handleHandlePointerDown(e: React.PointerEvent, id: number, field: "time"|"endTime", startMins: number) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragState({ id, field, originalMins: startMins, startX: e.clientX, pointerId: e.pointerId });
    setDragDelta(0);
  }
  function handleHandlePointerMove(e: React.PointerEvent) {
    if (!dragState || !gridRef.current) return;
    const gridW = gridRef.current.getBoundingClientRect().width;
    const pxDelta = e.clientX - dragState.startX;
    const minsDeltaRaw = (pxDelta / gridW) * totalMins;
    setDragDelta(Math.round(minsDeltaRaw / 15) * 15);
  }
  function handleHandlePointerUp(e: React.PointerEvent) {
    if (!dragState) return;
    e.currentTarget.releasePointerCapture(dragState.pointerId);
    const b = ALL_BOOKINGS.find(x => x.id === dragState.id);
    if (b && dragDelta !== 0) {
      const newMins = dragState.originalMins + dragDelta;
      const h = Math.floor(Math.max(0, newMins) / 60);
      const m = Math.max(0, newMins) % 60;
      b[dragState.field] = `${String(Math.min(23, h)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      if (b.status === "completed" && dragDelta > 0) {
        b.status = "seated";
      }
      setTick(v => v + 1);
    }
    setDragState(null);
    setDragDelta(0);
  }

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
  const CANCELLED_NOSHOW_STATUSES = new Set(["cancelled", "noshow"]);
  const visibleBookings = dayBookings.filter(b => {
    if (b.table === 0) return false; // handled by Unassigned row
    if (hideCancelledNoshow && CANCELLED_NOSHOW_STATUSES.has(b.status)) return false;
    if (period === "All") return true;
    return timeToMin(b.time) < END_MIN && timeToMin(b.endTime) > START_MIN;
  });

  // Unassigned / waitlist bookings (table === 0)
  const unassignedBookings = dayBookings.filter(b => {
    if (b.table !== 0) return false;
    if (hideCancelledNoshow && CANCELLED_NOSHOW_STATUSES.has(b.status)) return false;
    if (period === "All") return true;
    return timeToMin(b.time) < END_MIN && timeToMin(b.endTime) > START_MIN;
  });

  // Pool mode: activate when more than threshold unassigned bookings
  const usePool = unassignedBookings.length > UNASSIGNED_POOL_THRESHOLD;

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

  // Click on an empty cell in a row — shows context-aware popup
  function handleCellClick(e: React.MouseEvent<HTMLDivElement>, section: string, table: number) {
    if (e.target !== e.currentTarget) return; // ignore bubbled events from child elements
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

      {/* ── Secondary controls row (Row, Zoom, Now, Legend) ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        
        {/* Left side: Search context */}
        {matchIds !== null && search && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white"
            style={{ fontSize: 11, fontWeight: 600, backgroundColor: matchCount! > 0 ? "#0d9488" : "#ef4444" }}>
            {matchCount! > 0 ? `${matchCount} ${matchCount !== 1 ? tl.matchSuffixPlural : tl.matchSuffix}` : tl.noResults}
          </div>
        )}

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2 text-gray-400" style={{ fontSize: 10.5 }}>
          <div className="flex items-center gap-2 px-2 border-r border-gray-200">
            <span className="text-gray-400">Row</span>
            <input type="range" min={28} max={64} step={4} value={rowHeight} onChange={(e) => setRowHeight(parseInt(e.target.value))} className="w-20 accent-emerald-500 cursor-pointer" />
          </div>
          <div className="flex items-center gap-2 px-2 border-r border-gray-200">
            <span className="text-gray-400">Zoom</span>
            <input type="range" min={1} max={5} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-20 accent-emerald-500 cursor-pointer" />
          </div>

          {/* ── Hide Cancel/No-show toggle ── */}
          <button
            id="hide-cancelled-noshow-toggle"
            onClick={() => onHideCancelledNoshowChange?.(!hideCancelledNoshow)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all"
            style={{
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: hideCancelledNoshow ? "#fee2e2" : "#f9fafb",
              borderColor:     hideCancelledNoshow ? "#fca5a5" : "#e5e7eb",
              color:           hideCancelledNoshow ? "#b91c1c" : "#6b7280",
            }}
            title={hideCancelledNoshow ? "Show Cancelled & No-show" : "Hide Cancelled & No-show"}
          >
            {hideCancelledNoshow ? <EyeOff size={11} /> : <Eye size={11} />}
            Hide Cancel/No-show
          </button>

          <div className="w-px h-4 bg-gray-200" />

          <button onClick={scrollToNow} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors cursor-pointer" style={{ fontWeight: 600 }}>
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            {tl.nowLabel} · {minToTimeStr(nowMin)}
          </button>
          
          {/* View Legend button */}
          <UnifiedLegendModal />
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
        <div className="flex-1 flex flex-col" ref={gridRef}>

          {/* ── Unassigned / Waitlist: inline row (≤ threshold), with cluster grouping ── */}
          {unassignedBookings.length > 0 && !usePool && (
            <UnassignedInlineRow
              unassignedBookings={unassignedBookings}
              rowHeight={rowHeight}
              qCount={qCount}
              START_MIN={START_MIN}
              END_MIN={END_MIN}
              totalMins={totalMins}
              minToPct={minToPct}
              currentPct={currentPct}
              draggableIds={draggableIds}
              startDragTimer={startDragTimer}
              cancelDragTimer={cancelDragTimer}
              onBookingClick={onBookingClick}
            />
          )}

          {/* ── Waiting Pool badge + drawer (> threshold unassigned) ── */}
          {usePool && (
            <>
              {/* Sticky badge row */}
              <div className="flex border-b-2 border-amber-400 w-full shrink-0" style={{ minHeight: 32, backgroundColor: "#fffbeb" }}>
                <div className="sticky left-0 z-10 flex items-center gap-2 border-r-2 border-amber-400 px-2 shrink-0 flex-none" style={{ width: LABEL_W, backgroundColor: "#fef3c7" }}>
                  <span className="font-bold text-amber-700" style={{ fontSize: 10 }}>⚠ Pool</span>
                </div>
                <div className="flex items-center gap-2 px-3">
                  <button
                    id="waiting-pool-toggle"
                    onClick={() => setPoolOpen(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-amber-400 transition-all hover:bg-amber-100"
                    style={{ fontSize: 11, fontWeight: 700, color: "#92400e", backgroundColor: poolOpen ? "#fde68a" : "#fef9c3" }}
                  >
                    {poolOpen ? <ChevronLeft size={12} /> : null}
                    <span className="inline-flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center" style={{ fontSize: 9, fontWeight: 800 }}>{unassignedBookings.length}</span>
                      Pending Assign
                    </span>
                    <span style={{ fontSize: 9, opacity: 0.7 }}>· {poolOpen ? "Close" : "Open"} Pool</span>
                  </button>
                  <span className="text-amber-500" style={{ fontSize: 10 }}>Drag cards onto a table row to assign</span>
                </div>
              </div>

              {/* Slide-in Waiting Pool Drawer */}
              {poolOpen && (
                <div
                  className="absolute z-[50] flex flex-col bg-white border-r-2 border-amber-400 shadow-2xl overflow-hidden"
                  style={{
                    left: LABEL_W,
                    top: 0,
                    bottom: 0,
                    width: 260,
                    animation: "poolSlideIn 0.22s cubic-bezier(0.34,1.2,0.64,1)",
                  }}
                >
                  <style>{`@keyframes poolSlideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }`}</style>
                  {/* Drawer header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-amber-200" style={{ backgroundColor: "#fef3c7" }}>
                    <div>
                      <div className="font-bold text-amber-800" style={{ fontSize: 11 }}>⚠ Waiting Pool</div>
                      <div className="text-amber-600" style={{ fontSize: 9.5 }}>Drag a card → drop onto a table row</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center" style={{ fontSize: 10, fontWeight: 800 }}>{unassignedBookings.length}</span>
                      <button onClick={() => setPoolOpen(false)} className="text-amber-500 hover:text-amber-800 transition-colors"><X size={14} /></button>
                    </div>
                  </div>
                  {/* Scrollable card list */}
                  <div className="overflow-y-auto flex-1 p-2 space-y-2" style={{ backgroundColor: "#fffbeb" }}>
                    {unassignedBookings.map(b => {
                      const color  = STATUS_META[b.status]?.dot ?? "#f59e0b";
                      const meta   = STATUS_META[b.status];
                      const isDrag = draggableIds.has(b.id);
                      return (
                        <div
                          key={b.id}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData("application/booking-move", JSON.stringify({ id: b.id, sourceSec: "__unassigned", sourceTab: 0 }));
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onPointerDown={() => startDragTimer(b.id)}
                          onPointerUp={() => cancelDragTimer(b.id)}
                          onPointerCancel={() => cancelDragTimer(b.id)}
                          onDragEnd={() => cancelDragTimer(b.id)}
                          onClick={e => { e.stopPropagation(); onBookingClick?.(b.id); }}
                          className={`rounded-xl border-2 border-dashed p-2.5 cursor-grab select-none transition-all ${isDrag ? "scale-105 shadow-xl ring-2 ring-amber-400" : "hover:shadow-md hover:border-amber-500"}`}
                          style={{ borderColor: color + "80", backgroundColor: meta?.bg ?? "#fff" }}
                          title={`${b.guestName} · ${b.time}–${b.endTime} · Drag to assign`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="font-bold truncate" style={{ fontSize: 10.5, color: meta?.color ?? "#92400e" }}>{b.guestName}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ fontSize: 8.5, fontWeight: 700, backgroundColor: color }}>{meta?.shortLabel}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5" style={{ fontSize: 9.5, color: "#92400e", opacity: 0.8 }}>
                            <Clock size={9} />
                            <span>{b.time}–{b.endTime}</span>
                            <Users size={9} />
                            <span>{b.guests} pax</span>
                          </div>
                          {b.phone && (
                            <div className="mt-1 truncate" style={{ fontSize: 9, color: "#b45309" }}>{b.phone}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          {SECTIONS.map(sec => {
            const isColl  = collapsed.has(sec.name);
            const secBks  = ALL_BOOKINGS.filter(b => b.section === sec.name);
            const active  = secBks.filter(b => b.status === "seated" || b.status === "reserved").length;

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
                  const rowBks = visibleBookings.filter(b => 
                    (b.section === sec.name && b.table === tableNum) ||
                    b.additionalTables?.some(t => t.section === sec.name && t.table === tableNum)
                  );
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
                        onClick={e => handleCellClick(e, sec.name, tableNum)}
                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                        onDrop={e => {
                          e.preventDefault();
                          const rawData = e.dataTransfer.getData("application/booking-move");
                          if (rawData) {
                            try {
                              const data = JSON.parse(rawData);
                              const { id, sourceSec, sourceTab } = data;
                              const b = ALL_BOOKINGS.find(x => x.id === id);
                              if (b) {
                                if (sourceSec === "__unassigned") {
                                  // Assign from waitlist to this table
                                  b.section = sec.name as any;
                                  b.table = tableNum;
                                } else if (b.section === sourceSec && b.table === sourceTab) {
                                  b.section = sec.name as any;
                                  b.table = tableNum;
                                } else if (b.additionalTables) {
                                  const idx = b.additionalTables.findIndex(t => t.section === sourceSec && t.table === sourceTab);
                                  if (idx >= 0) {
                                    b.additionalTables[idx] = { section: sec.name as any, table: tableNum };
                                  }
                                }
                                setTick(v => v + 1);
                              }
                            } catch (err) {}
                          }
                        }}>
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
                          const baseSMin = timeToMin(b.time);
                          const baseEMin = timeToMin(b.endTime);
                          
                          let effectiveSMin = Math.max(baseSMin, START_MIN);
                          let effectiveEMin = Math.min(baseEMin, END_MIN);
                          
                          if (dragState && dragState.id === b.id) {
                            if (dragState.field === "time") effectiveSMin = Math.max(baseSMin + dragDelta, START_MIN);
                            if (dragState.field === "endTime") effectiveEMin = Math.min(baseEMin + dragDelta, END_MIN);
                          }

                          const startPct = minToPct(effectiveSMin);
                          const widthPct = Math.max((effectiveEMin - effectiveSMin) / totalMins * 100, 2);
                          
                          const color   = barColor(b, nowMin);
                          const light   = barLight(b, nowMin);
                          const searchOp = getOpacity(b);
                          const hi      = isHighlighted(b);
                          
                          const timeState = getBookingTimeState(b, nowMin, day);
                          const isPast    = timeState === "past";
                          const isCurrent = timeState === "current";

                          const isLinkedGroup = b.additionalTables && b.additionalTables.length > 0;
                          const isHoveredLinked = hoveredId === b.id && isLinkedGroup;

                          // ── Split-color: seated but arrived late ──
                          const seatedLate = b.status === "seated" && !!b.actualSeatedTime &&
                            timeToMin(b.actualSeatedTime) > timeToMin(b.time);
                          const lostPct = seatedLate
                            ? ((timeToMin(b.actualSeatedTime!) - timeToMin(b.time)) / (timeToMin(b.endTime) - timeToMin(b.time))) * 100
                            : 0;
                          // Red stripe for lost time, solid cyan for active time
                          const LATE_C = "#F44336";
                          const LATE_L = "#FFCDD2";
                          const CYAN   = STATUS_META.seated.dot; // #00BCD4
                          const splitBg = seatedLate
                            ? `repeating-linear-gradient(45deg,${LATE_C},${LATE_C} 4px,${LATE_L} 4px,${LATE_L} 8px) 0 0 / ${lostPct}% 100% no-repeat, ${CYAN}`
                            : color;

                          const isDraggableContext = draggableIds.has(b.id);
                          return (
                            <div key={`${b.id}-${sec.name}-${tableNum}`} className={`absolute rounded overflow-hidden group/booking ${isDraggableContext ? "scale-105 ring-2 ring-blue-400 shadow-xl" : ""}`}
                              draggable={isDraggableContext}
                              onDragStart={e => {
                                if (dragState) {
                                  e.preventDefault();
                                  return;
                                }
                                e.dataTransfer.setData("application/booking-move", JSON.stringify({ id: b.id, sourceSec: sec.name, sourceTab: tableNum }));
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => cancelDragTimer(b.id)}
                              onPointerDown={() => startDragTimer(b.id)}
                              onPointerUp={() => cancelDragTimer(b.id)}
                              onPointerCancel={() => cancelDragTimer(b.id)}
                              onPointerLeave={() => { setHoveredId(null); cancelDragTimer(b.id); }}
                              onPointerEnter={() => setHoveredId(b.id)}
                              style={{
                                left: `calc(${startPct}% + 1px)`, 
                                width: `calc(${widthPct}% - 2px)`,
                                top: "4px", bottom: "4px",
                                opacity: isPast ? 0.5 : (CANCELLED_NOSHOW_STATUSES.has(b.status) ? 0.38 : searchOp),
                                filter: undefined,
                                zIndex: isCurrent || isHoveredLinked || isDraggableContext ? 15 : hi ? 10 : 3,
                                background: splitBg,
                                boxShadow: isCurrent ? `0 0 0 2px white, 0 0 0 3px ${color}` : (hi || isHoveredLinked) ? `0 0 0 2px white, 0 0 0 3px ${color}` : "none",
                                cursor: isDraggableContext ? "grabbing" : "grab",
                                touchAction: "pan-x pan-y",
                                transition: dragState?.id === b.id ? "none" : "left 0.1s, width 0.1s, opacity 0.15s, background-color 0.15s, box-shadow 0.15s, transform 0.15s",
                              }}
                              title={`${b.guestName} · ${b.time}${seatedLate ? `→${b.actualSeatedTime}` : ""}–${b.endTime} · ${b.guests} guests${isLinkedGroup ? ` · Merged Tables` : ""}${isPast && b.status === "completed" ? ` (Completed)` : ""}${seatedLate ? ` · Late arrival (${b.actualSeatedTime})` : ""}`}
                              onClick={e => { e.stopPropagation(); onBookingClick?.(b.id); }}>
                              
                              {/* Left Resize Handle */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/booking:opacity-100 [@media(hover:none)]:opacity-100 hover:bg-white/30 z-20 flex items-center justify-center transition-opacity"
                                onPointerDown={(e) => { e.stopPropagation(); cancelDragTimer(b.id); handleHandlePointerDown(e, b.id, "time", timeToMin(b.time)); }}
                                onPointerMove={handleHandlePointerMove}
                                onPointerUp={handleHandlePointerUp}
                              >
                                <div className="w-[3px] h-4 bg-white/90 rounded-full shadow-sm" />
                              </div>

                              {/* Content */}
                              <div className="flex flex-col justify-center w-full h-full px-2.5 min-w-0 pointer-events-none">
                                {/* Row 1: guest name + linked icon + meta icons */}
                                <div className="flex items-center gap-0.5 min-w-0">
                                  <span className="text-white truncate" style={{ fontSize: period === "All" ? 9.5 : 11, fontWeight: 600, lineHeight: 1, textDecorationLine: (isPast && b.status === "completed") || CANCELLED_NOSHOW_STATUSES.has(b.status) ? "line-through" : "none", textDecorationColor: "rgba(255,255,255,0.6)" }}>{b.guestName}</span>
                                  {isLinkedGroup && (
                                    <span className="ml-0.5 text-white/90 shrink-0" style={{ fontSize: period === "All" ? 9 : 10 }}>🔗</span>
                                  )}
                                  <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                                    {b.hasNote && <MessageSquare size={period === "All" ? 7 : 9} color="rgba(255,255,255,0.85)" />}
                                    {b.hasFile && <FileText size={period === "All" ? 7 : 9} color="rgba(255,255,255,0.85)" />}
                                    <span className="text-white/80 ml-0.5" style={{ fontSize: period === "All" ? 8.5 : 10 }}>{b.guests}</span>
                                  </div>
                                </div>
                                {/* Row 2: phone (masked) + type tag — only shown if bar height >= 36px */}
                                {rowHeight >= 36 && (
                                  <div className="flex items-center gap-1 min-w-0 mt-0.5">
                                    {b.phone && widthPct > 7 && (
                                      <span className="text-white/65 truncate" style={{ fontSize: 8.5, lineHeight: 1 }}>{b.phone}</span>
                                    )}
                                    {bookingTypeLabel(b, widthPct > 10) && (
                                      <span className="ml-auto shrink-0 px-1 rounded bg-white/20 text-white" style={{ fontSize: 8, fontWeight: 700, lineHeight: 1.3 }}>
                                        {bookingTypeLabel(b, widthPct > 10)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Right Resize Handle */}
                              <div
                                className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/booking:opacity-100 [@media(hover:none)]:opacity-100 hover:bg-white/30 z-20 flex items-center justify-center transition-opacity"
                                onPointerDown={(e) => { e.stopPropagation(); cancelDragTimer(b.id); handleHandlePointerDown(e, b.id, "endTime", timeToMin(b.endTime)); }}
                                onPointerMove={handleHandlePointerMove}
                                onPointerUp={handleHandlePointerUp}
                                onPointerLeave={handleHandlePointerUp}
                              >
                                <div className="w-[3px] h-4 bg-white/90 rounded-full shadow-sm" />
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
        </div>   {/* end: flex-1 sections container */}
        </div>   {/* end: zoom wrapper */}
      </div>     {/* end: scrollRef scrollable area */}


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