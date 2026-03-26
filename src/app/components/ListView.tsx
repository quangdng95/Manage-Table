import React, { useState, useMemo } from "react";
import {
  Search, Settings, MessageSquare, FileText,
  Users, Clock, Calendar, TrendingUp,
  Sun, Moon, Coffee, ChevronDown, ChevronRight,
  Filter, SortAsc, Star, Utensils,
} from "lucide-react";
import { getBookingsForDay, getBookingTimeState, PERIOD_THEMES, STATUS_META, type Booking, type Status } from "../data/bookings";
import { useLang } from "../context/LanguageContext";

export interface ListViewProps {
  period: string;
  day: number;
  onBookingClick?: (id: number) => void;
  onUpdateStatus?: (id: number, status: Status) => void;
  forceRender?: number;
}

const AVATAR_PALETTE = [
  "#0f766e","#0369a1","#7c3aed","#b45309",
  "#15803d","#c2410c","#1d4ed8","#9333ea",
  "#0e7490","#b91c1c","#065f46","#6d28d9",
];
function avatarColor(name: string) {
  const code = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}
function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function PeriodIcon({ period, size = 20 }: { period: string; size?: number }) {
  if (period === "Morning") return <Sun size={size} />;
  if (period === "Lunch")   return <Utensils size={size} />;
  if (period === "Evening") return <Moon size={size} />;
  return <Calendar size={size} />;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5 bg-white/60 rounded-lg border border-white/80 min-w-[90px]">
      <div className="font-bold" style={{ fontSize: 22, color, lineHeight: 1 }}>{value}</div>
      <div className="text-gray-600" style={{ fontSize: 11 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const { t } = useLang();
  const meta = STATUS_META[status];
  const label = t.status[status as keyof typeof t.status] ?? meta.label;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: meta.bg, fontSize: 10.5 }}
    >
      <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: meta.dot, display: "inline-block", flexShrink: 0 }} />
      <span style={{ color: meta.color, fontWeight: 500 }}>{label}</span>
    </span>
  );
}

function Tag({ label, accentColor }: { label: string; accentColor: string }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-white whitespace-nowrap"
      style={{ fontSize: 9.5, backgroundColor: accentColor, opacity: 0.85 }}
    >
      {label}
    </span>
  );
}

function duration(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function BookingRow({ booking, accentColor, onBookingClick, onUpdateStatus, nowMin, day }: { booking: Booking; accentColor: string; onBookingClick?: (id: number) => void; onUpdateStatus?: (id: number, status: Status) => void; nowMin: number; day: number }) {
  const [hovered, setHovered] = useState(false);
  const { t } = useLang();
  const tl = t.list;
  const dur = duration(booking.time, booking.endTime);
  const statusMeta = STATUS_META[booking.status];
  const color = avatarColor(booking.guestName);
  const timeState = getBookingTimeState(booking, nowMin, day);
  const done = timeState === "past";

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 transition-all"
      style={{
        backgroundColor: hovered ? "#f8fafc" : "white",
        cursor: "pointer",
        opacity: done ? 0.52 : 1,
        filter: done ? "saturate(0.45)" : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onBookingClick?.(booking.id)}
    >
      {/* Status stripe */}
      <div style={{ width: 3, height: 38, borderRadius: 2, backgroundColor: statusMeta.dot, flexShrink: 0, opacity: done ? 0.5 : 1 }} />

      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full text-white shrink-0"
        style={{ width: 34, height: 34, backgroundColor: color, fontSize: 12, fontWeight: 700 }}
      >
        {initials(booking.guestName)}
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div
            className="text-gray-800 truncate hover:text-emerald-700 transition-colors"
            style={{ fontSize: 13, fontWeight: 500, textDecorationLine: done ? "line-through" : "none", textDecorationColor: "#9ca3af" }}
          >
            {booking.guestName}
          </div>
          {done && <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 shrink-0" style={{ fontSize: 9.5, fontWeight: 600 }}>{tl.doneBadge}</span>}
        </div>
        {booking.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            {booking.tags.map((tag) => <Tag key={tag} label={tag} accentColor={accentColor} />)}
          </div>
        )}
      </div>

      {/* Section · Table */}
      <div className="text-center shrink-0 hidden sm:block" style={{ minWidth: 100 }}>
        <div className="text-gray-700" style={{ fontSize: 11, fontWeight: 500 }}>{booking.section}</div>
        <div className="text-gray-400" style={{ fontSize: 10 }}>{tl.tableLabel} {booking.table}</div>
      </div>

      {/* Time range */}
      <div className="text-center shrink-0 hidden md:block" style={{ minWidth: 90 }}>
        <div className="text-gray-700" style={{ fontSize: 11, fontWeight: 500 }}>{booking.time} → {booking.endTime}</div>
        <div className="text-gray-400" style={{ fontSize: 10 }}>{dur} {tl.minSuffix}</div>
      </div>

      {/* Guests */}
      <div className="flex items-center gap-1 shrink-0" style={{ minWidth: 36 }}>
        <Users size={11} className="text-gray-400" />
        <span className="text-gray-700" style={{ fontSize: 13, fontWeight: 500 }}>{booking.guests}</span>
      </div>

      {/* Status badge */}
      <div className="shrink-0 hidden lg:block"><StatusBadge status={booking.status} /></div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 relative w-[110px] justify-end">
        {hovered && !done ? (
          <div className="flex gap-1 animate-in fade-in slide-in-from-right-2 bg-white/90 pl-2">
            {booking.status === "awaitingconfirm" && (
              <>
                <button className="px-2 py-1 rounded bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors shadow-sm" style={{ fontSize: 10, fontWeight: 700 }} onClick={e => { e.stopPropagation(); onUpdateStatus?.(booking.id, "reserved"); }}>Arrive</button>
                <button className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm" style={{ fontSize: 10, fontWeight: 700 }} onClick={e => { e.stopPropagation(); onUpdateStatus?.(booking.id, "noshow"); }}>No-show</button>
              </>
            )}
            {(booking.status === "reserved" || booking.status === "waitingpayment") && (
              <>
                <button className="px-2 py-1 rounded bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors shadow-sm" style={{ fontSize: 10, fontWeight: 700 }} onClick={e => { e.stopPropagation(); onUpdateStatus?.(booking.id, "seated"); }}>Seat</button>
                <button className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm" style={{ fontSize: 10, fontWeight: 700 }} onClick={e => { e.stopPropagation(); onUpdateStatus?.(booking.id, "noshow"); }}>No-show</button>
              </>
            )}
            {booking.status === "seated" && (
              <button className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm" style={{ fontSize: 10, fontWeight: 700 }} onClick={e => { e.stopPropagation(); onUpdateStatus?.(booking.id, "completed"); }}>Complete</button>
            )}
          </div>
        ) : (
          <>
            <button className="text-gray-400 hover:text-gray-600 transition-colors p-0.5" onClick={e => { e.stopPropagation(); onBookingClick?.(booking.id); }}><Settings size={12} /></button>
            {booking.hasNote && <button className="hover:text-blue-500 transition-colors p-0.5" style={{ color: "#93c5fd" }} onClick={e => { e.stopPropagation(); onBookingClick?.(booking.id); }}><MessageSquare size={12} /></button>}
            {booking.hasFile && <button className="hover:text-purple-500 transition-colors p-0.5" style={{ color: "#c4b5fd" }} onClick={e => { e.stopPropagation(); onBookingClick?.(booking.id); }}><FileText size={12} /></button>}
          </>
        )}
      </div>
    </div>
  );
}

function TimeGroup({
  timeKey, bookings, accentColor, accentLight, accentMid, textDark, onBookingClick, onUpdateStatus, nowMin, day, collapseTrigger, expandTrigger, setUpcomingRef, isFirstUpcoming,
}: {
  timeKey: string; bookings: Booking[]; accentColor: string; accentLight: string;
  accentMid: string; textDark: string; onBookingClick?: (id: number) => void; onUpdateStatus?: (id: number, status: Status) => void;
  nowMin: number; day: number; collapseTrigger: number; expandTrigger: number;
  setUpcomingRef?: (el: HTMLDivElement | null) => void; isFirstUpcoming?: boolean;
}) {
  const isGroupPast = useMemo(() => {
    const [h, m] = timeKey.split(":").map(Number);
    const groupMin = h * 60 + m;
    const currentDay = new Date().getDate();
    if (day < currentDay) return true;
    if (day > currentDay) return false;
    return groupMin < nowMin;
  }, [timeKey, nowMin, day]);

  const [open, setOpen] = useState(!isGroupPast);

  React.useEffect(() => {
    if (collapseTrigger > 0 && isGroupPast) {
      setOpen(false);
    }
  }, [collapseTrigger, isGroupPast]);

  React.useEffect(() => {
    if (expandTrigger > 0) {
      setOpen(true);
    }
  }, [expandTrigger]);

  const { t } = useLang();
  const totalGuests = bookings.reduce((s, b) => s + b.guests, 0);

  return (
    <div ref={isFirstUpcoming ? setUpcomingRef : undefined}>
      {/* Group header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2 border-b border-gray-200 hover:opacity-80 transition-opacity text-left sticky top-[28px] z-10 shadow-sm"
        style={{ backgroundColor: accentMid, minHeight: 36 }}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown size={13} style={{ color: accentColor }} />
        ) : (
          <ChevronRight size={13} style={{ color: accentColor }} />
        )}
        <span className="font-bold" style={{ fontSize: 13, color: textDark, fontVariantNumeric: "tabular-nums" }}>
          {timeKey}
          {isGroupPast && <span className="font-normal opacity-70 ml-1">(Past)</span>}
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-white"
          style={{ fontSize: 10, backgroundColor: accentColor }}
        >
          {bookings.length}
        </span>
        <span className="text-gray-500 ml-1" style={{ fontSize: 11 }}>
          · {totalGuests} {t.list.guestSuffix}
        </span>
        <div className="ml-auto flex gap-1">
          {bookings.map((b) => (
            <span
              key={b.id}
              className="rounded-full"
              style={{
                width: 7,
                height: 7,
                backgroundColor: STATUS_META[b.status].dot,
                display: "inline-block",
              }}
              title={t.status[b.status as keyof typeof t.status] ?? STATUS_META[b.status].label}
            />
          ))}
        </div>
      </button>

      {/* Booking rows */}
      {open && (
        <div className="relative z-0">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} accentColor={accentColor} onBookingClick={onBookingClick} onUpdateStatus={onUpdateStatus} nowMin={nowMin} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ListView({ period, day, onBookingClick, onUpdateStatus, forceRender }: ListViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sectionFilter, setSectionFilter] = useState<string>("All");
  const [collapseTrigger, setCollapseTrigger] = useState(0);
  const [expandTrigger, setExpandTrigger] = useState(0);
  const upcomingRef = React.useRef<HTMLDivElement | null>(null);
  
  const { t } = useLang();
  const tl = t.list;

  // Live "now" for done-detection
  const [nowMin, setNowMin] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  React.useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()); }, 60_000);
    return () => clearInterval(id);
  }, []);

  const theme = PERIOD_THEMES[period as keyof typeof PERIOD_THEMES] ?? PERIOD_THEMES.All;

  // Filter by day then by period
  const dayBookings = getBookingsForDay(day);
  const periodKey = period.toLowerCase() as "morning" | "lunch" | "evening";
  const source = period === "All" ? dayBookings : dayBookings.filter((b) => b.period === periodKey);

  // Use translated status options for filtering, map back to English value
  const statusOptionKeys = ["All", "seated", "reserved", "awaitingconfirm", "waitingpayment", "noshow", "cancelled", "completed"] as const;
  const statusOptionLabels = [
    tl.statusOptions[0] ?? "All",
    ...statusOptionKeys.slice(1).map(k => STATUS_META[k as keyof typeof STATUS_META]?.label ?? k),
  ];

  const sectionOptionKeys: Array<"All" | "Restaurant" | "First floor" | "Terrace" | "Bar"> = ["All", "Restaurant", "First floor", "Terrace", "Bar"];
  const sectionOptionLabels = tl.sectionOptions;

  const filtered = useMemo(() => {
    return source.filter((b) => {
      const matchSearch =
        !search ||
        b.guestName.toLowerCase().includes(search.toLowerCase()) ||
        b.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      // statusFilter is stored as the English key
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      const matchSection = sectionFilter === "All" || b.section === sectionFilter;
      return matchSearch && matchStatus && matchSection;
    });
  }, [source, search, statusFilter, sectionFilter]);

  // Group by time
  const groups = useMemo(() => {
    const map = new Map<string, Booking[]>();
    filtered.forEach((b) => {
      const key = b.time;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Identify first upcoming group hook
  const firstUpcomingIndex = useMemo(() => {
    const currentDay = new Date().getDate();
    return groups.findIndex(([timeKey]) => {
      if (day < currentDay) return false;
      if (day > currentDay) return true;
      const [h, m] = timeKey.split(":").map(Number);
      return (h * 60 + m) >= nowMin;
    });
  }, [groups, nowMin, day]);

  const handleScrollToUpcoming = () => {
    if (upcomingRef.current) {
      upcomingRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Stats
  const totalGuests = source.reduce((s, b) => s + b.guests, 0);
  const avgParty = source.length > 0 ? (totalGuests / source.length).toFixed(1) : "0";
  const noShows = source.filter((b) => b.status === "noshow").length;

  const periodLabel    = tl.periodLabel[period as keyof typeof tl.periodLabel]    ?? theme.label;
  const periodSublabel = tl.periodSublabel[period as keyof typeof tl.periodSublabel] ?? theme.sublabel;

  return (
    <div className="flex-1 overflow-auto" style={{ backgroundColor: "#f8fafc" }}>
      {/* ── Period Banner ── */}
      <div
        className="px-6 py-4 border-b border-white/60"
        style={{ background: theme.gradient }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-white"
              style={{ backgroundColor: theme.accent, color: "#FFFFFF" }}
            >
              <PeriodIcon period={period} size={18} />
            </div>
            <div>
              <h2 className="font-bold" style={{ fontSize: 16, color: theme.textDark }}>
                {periodLabel}
              </h2>
              <p style={{ fontSize: 11, color: theme.textMid }}>{periodSublabel}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-2 flex-wrap">
            <StatCard label={tl.statBookings} value={source.length} color={theme.accent} />
            <StatCard label={tl.statGuests}   value={totalGuests}   sub={`${tl.avgSuffix} ${avgParty}${tl.perTable}`} color={theme.accent} />
            <StatCard label={tl.statNoShows}  value={noShows} sub={`${((noShows / Math.max(source.length, 1)) * 100).toFixed(0)}${tl.rateLabel}`} color={noShows > 0 ? "#ef4444" : theme.accent} />
            <StatCard
              label={tl.statSections}
              value={[...new Set(source.map((b) => b.section))].length}
              color={theme.accent}
            />
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-white flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="absolute text-gray-400 pointer-events-none" style={{ left: 9, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tl.searchPlaceholder}
            className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-gray-700 focus:outline-none focus:border-gray-400 bg-gray-50"
            style={{ fontSize: 12 }}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            className="border border-gray-200 rounded-lg px-2 py-1.5 pr-6 text-gray-600 bg-gray-50 focus:outline-none appearance-none cursor-pointer"
            style={{ fontSize: 11 }}
            value={statusFilter}
            onChange={(e) => {
              const idx = statusOptionLabels.indexOf(e.target.value);
              setStatusFilter(idx > 0 ? statusOptionKeys[idx] : "All");
            }}
          >
            {statusOptionLabels.map((label, i) => <option key={i} value={label}>{label}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Section Filter */}
        <div className="relative">
          <select
            className="border border-gray-200 rounded-lg px-2 py-1.5 pr-6 text-gray-600 bg-gray-50 focus:outline-none appearance-none cursor-pointer"
            style={{ fontSize: 11 }}
            value={sectionFilter}
            onChange={(e) => {
              const idx = (sectionOptionLabels as readonly string[]).indexOf(e.target.value);
              setSectionFilter(idx > 0 ? (sectionOptionKeys[idx] as "All" | "Restaurant" | "First floor" | "Terrace" | "Bar") : "All");
            }}
          >
            {sectionOptionLabels.map((label, i) => <option key={i} value={label}>{label}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setCollapseTrigger(v => v + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            style={{ fontSize: 11, fontWeight: 500 }}
          >
            Collapse Past
          </button>
          <button
            onClick={() => setExpandTrigger(v => v + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            style={{ fontSize: 11, fontWeight: 500 }}
          >
            Expand All
          </button>
          <button
            onClick={handleScrollToUpcoming}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            style={{ fontSize: 11, fontWeight: 500 }}
          >
            <SortAsc size={13} className="text-emerald-500" />
            Jump to Now
          </button>
        </div>

        {/* Result count */}
        <span className="text-gray-400 ml-2" style={{ fontSize: 11 }}>
          {filtered.length} {tl.statBookings.toLowerCase()}
        </span>
      </div>

      {/* ── Table Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-1.5 border-b border-gray-200 sticky top-0 z-20"
        style={{ backgroundColor: "#f1f5f9", minHeight: 28 }}
      >
        <div style={{ width: 3, flexShrink: 0 }} />
        <div style={{ width: 34, flexShrink: 0 }} />
        <div className="flex-1 text-gray-500" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tl.colGuest}</div>
        <div className="text-gray-500 hidden sm:block" style={{ minWidth: 100, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tl.colSection}</div>
        <div className="text-gray-500 hidden md:block" style={{ minWidth: 90, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tl.colTime}</div>
        <div className="text-gray-500" style={{ minWidth: 36, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tl.colPax}</div>
        <div className="text-gray-500 hidden lg:block" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 80 }}>{tl.colStatus}</div>
        <div className="text-gray-500" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 52 }}>{tl.colActions}</div>
      </div>

      {/* ── Booking Groups ── */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
          <Calendar size={36} className="text-gray-300" />
          <p style={{ fontSize: 14 }}>{tl.noBookings}</p>
          <p style={{ fontSize: 12 }}>{tl.noBookingsSub}</p>
        </div>
      ) : (
        <div className="bg-white">
          {groups.map(([timeKey, bks], index) => (
            <TimeGroup
              key={timeKey} timeKey={timeKey} bookings={bks}
              accentColor={theme.accent} accentLight={theme.accentLight}
              accentMid={theme.accentMid} textDark={theme.textDark}
              onBookingClick={onBookingClick}
              onUpdateStatus={onUpdateStatus}
              nowMin={nowMin} day={day} collapseTrigger={collapseTrigger} expandTrigger={expandTrigger}
              isFirstUpcoming={index === firstUpcomingIndex}
              setUpcomingRef={(el) => { if (index === firstUpcomingIndex) upcomingRef.current = el; }}
            />
          ))}
        </div>
      )}

      {/* ── Summary Footer ── */}
      <div
        className="flex items-center justify-between px-6 py-3 border-t border-gray-200"
        style={{ backgroundColor: theme.accentLight }}
      >
        <div className="flex items-center gap-4">
          {(["seated", "reserved", "awaitingconfirm", "waitingpayment", "noshow"] as Status[]).map((s) => {
            const count = source.filter((b) => b.status === s).length;
            if (!count) return null;
            const meta = STATUS_META[s];
            const label = t.status[s as keyof typeof t.status] ?? meta.label;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: meta.dot, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: meta.color, fontWeight: 500 }}>{label}: {count}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11 }} className="text-gray-500">
          {source.length} {tl.statBookings.toLowerCase()} · {totalGuests} {tl.statGuests.toLowerCase()}
        </div>
      </div>
    </div>
  );
}