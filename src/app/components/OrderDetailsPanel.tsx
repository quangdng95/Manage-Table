import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X, Eye, EyeOff, Copy, Check, ChevronDown,
  Users, Utensils, Phone, Hash, Clock, CalendarDays,
  Table2, Wallet, ShoppingBag, MessageSquare,
  QrCode, UtensilsCrossed, Printer, MoreHorizontal,
  UserPlus, ChevronRight, Package,
  ChevronUp, Trash2, UploadCloud, FileText, Image as ImageIcon,
  Plus,
} from "lucide-react";
import { ALL_BOOKINGS, STATUS_META, updateBooking, getPeriodForTime, type Status, type Section } from "../data/bookings";
import { FoodCatalog } from "./FoodCatalog";
import { ErrorBoundary } from "./ErrorBoundary";
import {
  formatVND, KITCHEN_META, ORDER_STATUS_META,
  type CartLine, type OrderBatch, type OrderStatus,
} from "../data/foodMenu";

// ── Time Utilities ────────────────────────────────────────────
function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = Math.floor(m % 60);
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// ── Table Availability ────────────────────────────────────────
const TABLE_RANGES: Record<string, number[]> = {
  "Restaurant":  [1,2,3,4,5,6,7,8,9,10,11],
  "First floor": [1,2,3,4,5,6,7,8,9,10],
  "Terrace":     [1,2,3,4,5],
  "Bar":         [1,2,3,4,5,6,7,8],
};
function isTableFreeForEdit(
  section: string,
  table: number,
  startMin: number,
  duration: number,
  excludeBookingId: number,
): boolean {
  const endMin = startMin + duration;
  return !ALL_BOOKINGS.some(
    b =>
      b.id !== excludeBookingId &&
      b.section === section &&
      b.table === table &&
      timeToMin(b.time) < endMin &&
      timeToMin(b.endTime) > startMin,
  );
}

const QUICK_TAGS = ["VIP", "Window Seat", "Birthday", "Anniversary", "Quiet", "Allergy"] as const;

// ── Edit Draft Type ───────────────────────────────────────────
interface EditDraft {
  guestName: string;
  phone: string;
  guests: number;
  time: string;
  duration: number;
  internalNote: string;
  tags: string[];
  primaryTable: number;
  additionalTables: { section: Section; table: number }[];
}

// ── Table Multi-Select ────────────────────────────────────────
interface TableMultiSelectProps {
  section: string;
  primaryTable: number;
  additionalTables: { section: Section; table: number }[];
  startMin: number;
  duration: number;
  bookingId: number;
  onRemoveAdditional: (table: number) => void;
  onAddTable: (table: number) => void;
}
function TableMultiSelect({
  section, primaryTable, additionalTables, startMin, duration, bookingId, onRemoveAdditional, onAddTable,
}: TableMultiSelectProps) {
  const [gridOpen, setGridOpen] = useState(false);
  const tables = TABLE_RANGES[section] ?? [];
  const additionalSet = new Set(additionalTables.map(t => t.table));

  return (
    <div className="space-y-2">
      {/* Chips row */}
      <div className="flex flex-wrap gap-1.5">
        {/* Primary chip — not removable */}
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}
        >
          <Table2 size={10} />
          {section[0]}·{primaryTable}
          <span className="ml-0.5 text-blue-300" title="Primary table">●</span>
        </span>

        {/* Additional chips — removable */}
        {additionalTables.map(t => (
          <span
            key={t.table}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: "#ede9fe", color: "#6d28d9" }}
          >
            <Table2 size={10} />
            {t.section[0]}·{t.table}
            <button
              onClick={() => onRemoveAdditional(t.table)}
              className="ml-0.5 hover:text-red-500 transition-colors"
            >
              ×
            </button>
          </span>
        ))}

        {/* Add button */}
        <button
          onClick={() => setGridOpen(v => !v)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 border-dashed transition-colors"
          style={{
            borderColor: gridOpen ? "#0d9488" : "#d1d5db",
            color: gridOpen ? "#0d9488" : "#6b7280",
            backgroundColor: gridOpen ? "#f0fdf4" : "transparent",
          }}
        >
          <Plus size={10} />
          Add Table
        </button>
      </div>

      {/* Inline table grid */}
      {gridOpen && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p className="text-gray-400 mb-2" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {section} — select an available table
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tables.map(t => {
              if (t === primaryTable) return null; // skip primary
              const alreadyAdded = additionalSet.has(t);
              const free = isTableFreeForEdit(section, t, startMin, duration, bookingId);
              const canAdd = free && !alreadyAdded;
              return (
                <button
                  key={t}
                  disabled={!canAdd}
                  onClick={() => { if (canAdd) { onAddTable(t); setGridOpen(false); } }}
                  className="w-[46px] py-2 rounded-xl border flex flex-col items-center justify-center transition-all"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: alreadyAdded ? "#ede9fe" : canAdd ? "#ffffff" : "#f9fafb",
                    borderColor: alreadyAdded ? "#a78bfa" : canAdd ? "#d1d5db" : "#f3f4f6",
                    color: alreadyAdded ? "#6d28d9" : canAdd ? "#374151" : "#d1d5db",
                    cursor: canAdd ? "pointer" : "not-allowed",
                    opacity: canAdd || alreadyAdded ? 1 : 0.45,
                  }}
                  title={!free ? "Occupied" : alreadyAdded ? "Already added" : "Click to add"}
                >
                  {section[0]}·{t}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit Form (left panel, edit mode) ─────────────────────────
interface EditFormProps {
  draft: EditDraft;
  booking: NonNullable<ReturnType<typeof ALL_BOOKINGS.find>>;
  onDraftChange: <K extends keyof EditDraft>(key: K, value: EditDraft[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}
function EditForm({ draft, booking, onDraftChange, onSave, onCancel }: EditFormProps) {
  const section = booking.section;
  const startMin = timeToMin(draft.time);
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-xs focus:outline-none focus:border-teal-400 bg-white transition-colors";
  const cardCls  = "bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-3";
  const labelCls = "block text-gray-500 mb-1" as const;

  const endTime = minToTime(startMin + draft.duration);

  const DURATIONS = [
    { label: "45m", value: 45 },
    { label: "1h",  value: 60 },
    { label: "1.5h", value: 90 },
    { label: "2h",  value: 120 },
    { label: "2.5h", value: 150 },
    { label: "3h",  value: 180 },
  ];

  return (
    <div className="p-4 space-y-3 pb-8">
      <style>{`
        .edit-label { font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 4px; display: block; }
      `}</style>

      {/* ── Guest Info ── */}
      <div className={cardCls}>
        <div>
          <label className="edit-label">Full Name</label>
          <input
            className={inputCls}
            value={draft.guestName}
            onChange={e => onDraftChange("guestName", e.target.value)}
            placeholder="Guest name"
          />
        </div>
        <div>
          <label className="edit-label">Phone</label>
          <input
            className={inputCls}
            type="tel"
            value={draft.phone}
            onChange={e => onDraftChange("phone", e.target.value)}
            placeholder="+84..."
          />
        </div>
        <div>
          <label className="edit-label">Pax (Guests)</label>
          <div className="flex items-center gap-0">
            <button
              onClick={() => onDraftChange("guests", Math.max(1, draft.guests - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-l-lg border border-gray-200 border-r-0 bg-gray-50 hover:bg-gray-100 text-gray-600 shrink-0"
              style={{ fontSize: 18 }}
            >−</button>
            <input
              type="number"
              min={1}
              value={draft.guests}
              onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1) onDraftChange("guests", v); }}
              className="w-12 h-9 border border-gray-200 text-center text-gray-800 focus:outline-none focus:border-teal-400 bg-white"
              style={{ fontSize: 13, fontWeight: 600 }}
            />
            <button
              onClick={() => onDraftChange("guests", draft.guests + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-r-lg border border-gray-200 border-l-0 bg-gray-50 hover:bg-gray-100 text-gray-600 shrink-0"
              style={{ fontSize: 18 }}
            >+</button>
          </div>
        </div>
      </div>

      {/* ── Logistics ── */}
      <div className={cardCls}>
        <div>
          <label className="edit-label">Arrival Time</label>
          <input
            className={inputCls}
            type="time"
            value={draft.time}
            onChange={e => onDraftChange("time", e.target.value)}
          />
        </div>
        <div>
          <label className="edit-label">Duration → ends at {endTime}</label>
          <div className="flex gap-1.5 flex-wrap">
            {DURATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => onDraftChange("duration", d.value)}
                className="flex-1 min-w-[44px] px-2 py-1.5 rounded-lg border transition-colors"
                style={{
                  fontSize: 11, fontWeight: draft.duration === d.value ? 700 : 500,
                  borderColor: draft.duration === d.value ? "#0d9488" : "#e5e7eb",
                  backgroundColor: draft.duration === d.value ? "#f0fdfa" : "#fff",
                  color: draft.duration === d.value ? "#0d9488" : "#4b5563",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table Assignment ── */}
      <div className={cardCls}>
        <label className="edit-label">Tables ({section})</label>
        <TableMultiSelect
          section={section}
          primaryTable={draft.primaryTable}
          additionalTables={draft.additionalTables}
          startMin={startMin}
          duration={draft.duration}
          bookingId={booking.id}
          onRemoveAdditional={tableNum =>
            onDraftChange("additionalTables", draft.additionalTables.filter(t => t.table !== tableNum))
          }
          onAddTable={tableNum =>
            onDraftChange("additionalTables", [
              ...draft.additionalTables,
              { section: section as Section, table: tableNum },
            ])
          }
        />
      </div>

      {/* ── Notes & Tags ── */}
      <div className={cardCls}>
        <div>
          <label className="edit-label">Internal Note</label>
          <textarea
            className={inputCls}
            value={draft.internalNote}
            onChange={e => onDraftChange("internalNote", e.target.value)}
            placeholder="Dietary restrictions, preferences…"
            style={{ minHeight: 72, resize: "none" }}
          />
        </div>
        <div>
          <label className="edit-label">Quick Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map(tag => {
              const active = draft.tags.includes(tag);
              const s = tagStyle(tag);
              return (
                <button
                  key={tag}
                  onClick={() =>
                    onDraftChange(
                      "tags",
                      active ? draft.tags.filter(t => t !== tag) : [...draft.tags, tag],
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    fontSize: 11, fontWeight: active ? 700 : 500,
                    backgroundColor: active ? s.bg : "transparent",
                    borderColor: active ? s.color + "60" : "#e5e7eb",
                    color: active ? s.color : "#6b7280",
                  }}
                >
                  {s.emoji && <span>{s.emoji}</span>}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Save / Cancel footer inside scroll area ── */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm"
          style={{ fontSize: 13, backgroundColor: "#0d9488" }}
        >
          <Check size={14} />
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          style={{ fontSize: 13 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
const AVATAR_PALETTE = ["#0f766e","#0369a1","#7c3aed","#b45309","#15803d","#c2410c","#9333ea","#0e7490","#b91c1c","#6d28d9"];
function avatarColor(name: string) {
  const c = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return AVATAR_PALETTE[c % AVATAR_PALETTE.length];
}
function initials(name: string) {
  const p = name.trim().split(" ");
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
}
function maskPhone(phone: string) {
  // Returns "*** *** 1182" style masked version
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 4) {
    return `*** *** ${digits.slice(-4)}`;
  }
  return "*** *** ****";
}
function generateBookingId(id: number) {
  // Generate a realistic ID like 50EKXL1J4A using a simple hash
  const upper  = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "0123456789";
  const all    = upper + digits;
  let h = id * 2654435761;
  const out: string[] = [];
  for (let i = 0; i < 10; i++) {
    h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0);
    if (i === 0 || i === 5) {
      out.push(digits[(h >>> 4) % digits.length]);
    } else {
      out.push(all[h % all.length]);
    }
  }
  return out.join("");
}

// ── Status Dropdown ───────────────────────────────────────────
interface StatusDropdownProps {
  currentStatus: Status;
  onStatusChange: (s: Status) => void;
}
function StatusDropdown({ currentStatus, onStatusChange }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = STATUS_META[currentStatus];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);

  const statuses: Status[] = ["awaitingconfirm", "reserved", "seated", "waitingpayment", "completed", "noshow", "cancelled"];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all hover:brightness-95 active:scale-95"
        style={{
          backgroundColor: meta.bg,
          borderColor: meta.dot + "60",
          color: meta.color,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.dot }} />
        {meta.label}
        <ChevronDown size={12} style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-[300] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
          style={{ minWidth: 180, animation: "odp-dropdown 0.14s cubic-bezier(0.34,1.4,0.64,1)" }}
        >
          <style>{`@keyframes odp-dropdown { from{opacity:0;transform:scale(0.94) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
          {statuses.map(s => {
            const m = STATUS_META[s];
            const isActive = s === currentStatus;
            return (
              <button
                key={s}
                onClick={() => { onStatusChange(s); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.dot }} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? m.color : "#374151" }}>
                  {m.label}
                </span>
                {isActive && <Check size={12} className="ml-auto" style={{ color: m.dot }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── More Menu ─────────────────────────────────────────────────
function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);

  const items = [
    "Cancel Booking",
    "Mark as No Show",
    "Duplicate Booking",
    "Send Confirmation",
    "Export PDF",
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-[300] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
          style={{ minWidth: 180, animation: "odp-dropdown 0.14s cubic-bezier(0.34,1.4,0.64,1)" }}
        >
          {items.map(item => (
            <button
              key={item}
              onClick={() => setOpen(false)}
              className="w-full flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors text-left text-gray-700"
              style={{ fontSize: 12 }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Phone Row with mask/reveal ────────────────────────────────
function PhoneRow({ phone }: { phone: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayPhone = revealed ? phone : maskPhone(phone);

  function handleCopy() {
    navigator.clipboard.writeText(phone).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-gray-500" style={{ fontSize: 12 }}>Phone</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-gray-800" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em" }}>
          {displayPhone}
        </span>
        <button
          onClick={() => setRevealed(v => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title={revealed ? "Hide" : "Reveal"}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-emerald-600 transition-colors"
          title="Copy"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-gray-500" style={{ fontSize: 12 }}>{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

// ── Pill badge ────────────────────────────────────────────────
function Pill({ children, color = "#374151", bg = "#f3f4f6", icon }: { children: React.ReactNode; color?: string; bg?: string; icon?: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
      style={{ fontSize: 11, fontWeight: 600, color, backgroundColor: bg }}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// ── Tag Color Map ─────────────────────────────────────────────
const TAG_COLORS: Record<string, { color: string; bg: string; emoji?: string }> = {
  "VIP":         { color: "#92400e", bg: "#fef3c7", emoji: "⭐️" },
  "Window Seat": { color: "#1e40af", bg: "#dbeafe", emoji: "🪟" },
  "Birthday":    { color: "#9d174d", bg: "#fce7f3", emoji: "🎂" },
  "Anniversary": { color: "#6d28d9", bg: "#ede9fe", emoji: "💍" },
  "Quiet":       { color: "#065f46", bg: "#d1fae5", emoji: "🤫" },
  "Allergy":     { color: "#b91c1c", bg: "#fee2e2", emoji: "⚠️" },
};
function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? { color: "#374151", bg: "#f3f4f6" };
}

// ── Segmented Control ─────────────────────────────────────────
interface SegmentedControlProps<T extends string> {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  fullWidth?: boolean;
}
function SegmentedControl<T extends string>({ tabs, active, onChange, fullWidth = false }: SegmentedControlProps<T>) {
  return (
    <div
      className="flex items-center rounded-lg p-1 shrink-0"
      style={{
        backgroundColor: "#f0f0f0",
        gap: 2,
        width: fullWidth ? "100%" : undefined,
      }}
    >
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: fullWidth ? 1 : undefined,
              fontSize: 12,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#111827" : "#6b7280",
              backgroundColor: isActive ? "#ffffff" : "transparent",
              borderRadius: 6,
              padding: "5px 12px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.18s cubic-bezier(0.34,1.2,0.64,1)",
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Left Panel: Overview Tab ──────────────────────────────────
interface OverviewTabProps {
  booking: NonNullable<ReturnType<typeof ALL_BOOKINGS.find>>;
  currentStatus: Status;
  onStatusChange: (s: Status) => void;
  onOpenEdit: () => void;
}
function OverviewTab({ booking, currentStatus, onOpenEdit }: OverviewTabProps) {
  const statusMeta = STATUS_META[currentStatus];
  const bookingId  = generateBookingId(booking.id);
  const [idCopied, setIdCopied] = useState(false);
  const phone = booking.phone || "+84 97 123 1182";
  const tableLabel = booking.table > 0 ? `A${booking.table}` : "Unassigned";
  const salesChannels = ["Offline", "Walk-in"] as const;

  // Date/time display
  const now = new Date();
  const dateStr = `${booking.time} ${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
  // "X mins ago" placeholder
  const minsAgo = Math.floor(Math.random() * 10) + 1;

  function copyId() {
    navigator.clipboard.writeText(bookingId).catch(() => {});
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 1500);
  }

  const infoCardCls = "bg-white border border-gray-100 rounded-xl px-4 py-2 space-y-0.5";

  return (
    <div className="p-4 space-y-3 pb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-gray-900 font-bold" style={{ fontSize: 14 }}>Overview</h3>
        <button
          onClick={onOpenEdit}
          className="flex items-center gap-1 text-teal-600 hover:text-teal-700 active:scale-95 transition-all"
          style={{ fontSize: 12 }}
        >
          <span style={{ fontSize: 13 }}>✏️</span> Edit
        </button>
      </div>

      {/* Guest Info Card */}
      <div className={infoCardCls}>
        <InfoRow label="Fullname">
          <span className="text-gray-800 font-semibold" style={{ fontSize: 12 }}>{booking.guestName}</span>
        </InfoRow>
        <PhoneRow phone={phone} />
        <InfoRow label="Type">
          <Pill icon={<Utensils size={10} />} color="#065f46" bg="#d1fae5">Dine-in</Pill>
        </InfoRow>
      </div>

      {/* Booking Details Card */}
      <div className={infoCardCls}>
        <InfoRow label="Booking ID">
          <span className="font-mono text-gray-800 font-semibold" style={{ fontSize: 12 }}>{bookingId}</span>
          <button onClick={copyId} className="text-gray-400 hover:text-emerald-600 transition-colors ml-1">
            {idCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </InfoRow>
        <InfoRow label="Status">
          <span
            className="px-2.5 py-0.5 rounded-full font-semibold"
            style={{ fontSize: 11, color: statusMeta.color, backgroundColor: statusMeta.bg }}
          >
            {statusMeta.label}
          </span>
        </InfoRow>
        <InfoRow label="Invoice Number">
          <span className="text-gray-400" style={{ fontSize: 12 }}>—</span>
        </InfoRow>
        <InfoRow label="Receipt No.">
          <span className="text-gray-400" style={{ fontSize: 12 }}>—</span>
        </InfoRow>
      </div>

      {/* Time & Table Card */}
      <div className={infoCardCls}>
        <InfoRow label="Date/Time">
          <span className="text-gray-800" style={{ fontSize: 12 }}>
            {dateStr}
            <span className="text-gray-400 ml-1.5" style={{ fontSize: 11 }}>{minsAgo} mins ago</span>
          </span>
        </InfoRow>
        <InfoRow label="Table">
          <Pill icon={<Table2 size={10} />} color="#1e40af" bg="#dbeafe">{tableLabel}</Pill>
        </InfoRow>
        <InfoRow label="Pax">
          <Pill icon={<Users size={10} />} color="#374151" bg="#f3f4f6">{booking.guests}</Pill>
        </InfoRow>
        <InfoRow label="Deposit">
          <span className="text-gray-800" style={{ fontSize: 12 }}>0 đ</span>
        </InfoRow>
        <InfoRow label="Est Revenue">
          <span className="text-gray-800" style={{ fontSize: 12 }}>0 đ</span>
        </InfoRow>
      </div>

      {/* Sales Channel Card */}
      <div className={infoCardCls}>
        <InfoRow label="Sales Channel">
          <div className="flex items-center gap-1.5">
            {salesChannels.map((ch, i) => (
              <React.Fragment key={ch}>
                <Pill icon={<Users size={10} />} color="#374151" bg="#f3f4f6">{ch}</Pill>
                {i < salesChannels.length - 1 && <span className="text-gray-300" style={{ fontSize: 10 }}>/</span>}
              </React.Fragment>
            ))}
          </div>
        </InfoRow>
      </div>

      {/* Notes Card */}
      <div className={infoCardCls}>
        <div className="py-1">
          <div className="text-gray-500 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>Internal Note</div>
          {booking.hasNote ? (
            <>
              <p className="text-gray-700 mb-3" style={{ fontSize: 12, lineHeight: 1.65 }}>
                Khách hàng muốn chọn bàn trong nhà hàng, ưu tiên góc yên tĩnh gần cửa sổ.
              </p>
              {/* Quick tag pills rendered from booking.tags */}
              {booking.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {booking.tags.map((tag: string) => {
                    const s = tagStyle(tag);
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                        style={{ fontSize: 11, fontWeight: 600, color: s.color, backgroundColor: s.bg }}
                      >
                        {s.emoji && <span>{s.emoji}</span>}
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Fallback demo pills when booking has no tags array yet */}
              {booking.tags.length === 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(["VIP", "Anniversary", "Allergy"] as const).map(tag => {
                    const s = tagStyle(tag);
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                        style={{ fontSize: 11, fontWeight: 600, color: s.color, backgroundColor: s.bg }}
                      >
                        {s.emoji && <span>{s.emoji}</span>}
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400 italic" style={{ fontSize: 12 }}>No notes</span>
          )}
        </div>
      </div>

      {/* Assignee Section */}
      <div>
        <h4 className="text-gray-900 font-bold mb-2" style={{ fontSize: 13 }}>Assignee</h4>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm"
          style={{ fontSize: 12, backgroundColor: "#0d9488" }}
        >
          <UserPlus size={14} />
          Add Assignee
        </button>
      </div>
    </div>
  );
}

// ── Empty Cart Illustration ───────────────────────────────────
function EmptyCartIllustration() {
  return (
    <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Box body */}
      <rect x="20" y="35" width="60" height="38" rx="3" fill="#e5e7eb" />
      <rect x="20" y="35" width="60" height="10" rx="3" fill="#d1d5db" />
      {/* Box lid - open */}
      <path d="M 16 35 Q 18 15 50 20 Q 82 15 84 35" stroke="#9ca3af" strokeWidth="2" fill="#e5e7eb" />
      {/* Lid shadow */}
      <path d="M 20 35 Q 22 18 50 22 Q 78 18 80 35" stroke="#d1d5db" strokeWidth="1" fill="none" />
      {/* Box lines */}
      <line x1="50" y1="35" x2="50" y2="73" stroke="#d1d5db" strokeWidth="1.5" />
    </svg>
  );
}

// ── Right Panel: Cart Tab ─────────────────────────────────────
// ── Cart Filter Status ────────────────────────────────────────
type CartFilterStatus = "all" | OrderStatus;

const CART_FILTERS: { id: CartFilterStatus; label: string }[] = [
  { id: "all",         label: "All"         },
  { id: "new",         label: "New"         },
  { id: "sent",        label: "Sent"        },
  { id: "in_progress", label: "In Progress" },
  { id: "completed",   label: "Completed"   },
  { id: "void",        label: "Void"        },
];

// ── Cart Tab ──────────────────────────────────────────────────
interface CartTabProps {
  orderBatches: OrderBatch[];
  cartFilter: CartFilterStatus;
  setCartFilter: (f: CartFilterStatus) => void;
  onOpenCatalog: () => void;
}
function CartTab({ orderBatches, cartFilter, setCartFilter, onOpenCatalog }: CartTabProps) {
  // ── Empty state ──
  if (orderBatches.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 py-8">
        <EmptyCartIllustration />
        <p className="text-gray-700 font-semibold" style={{ fontSize: 14 }}>No Items to Display</p>
        <button
          onClick={onOpenCatalog}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md"
          style={{ fontSize: 13, backgroundColor: "#0d9488", boxShadow: "0 4px 14px rgba(13,148,136,0.35)" }}
        >
          <UtensilsCrossed size={15} />
          Add Food Now
        </button>
        <span className="text-gray-400" style={{ fontSize: 12 }}>Or</span>
        <button
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
          style={{ fontSize: 13 }}
        >
          <QrCode size={15} />
          Display QR Code
        </button>
      </div>
    );
  }

  // ── Populated state ──
  const filtered = cartFilter === "all"
    ? orderBatches
    : orderBatches.filter(b => b.status === cartFilter);

  const totalRevenue = orderBatches.reduce(
    (sum, batch) => sum + batch.lines.reduce((s, l) => s + l.item.price * l.qty, 0), 0
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filter pills */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
        {CART_FILTERS.map(f => {
          const isActive = cartFilter === f.id;
          const meta = f.id === "all" ? null : ORDER_STATUS_META[f.id as OrderStatus];
          return (
            <button
              key={f.id}
              onClick={() => setCartFilter(f.id)}
              className="px-2.5 py-1 rounded-full shrink-0 font-medium transition-all"
              style={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? (meta?.bg ?? "#111827") : "#f3f4f6",
                color: isActive ? (meta?.color ?? "#fff") : "#6b7280",
                border: isActive ? `1.5px solid ${meta?.color ?? "#374151"}40` : "1.5px solid transparent",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Order batch list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Package size={32} className="text-gray-200" />
            <p style={{ fontSize: 13 }}>No orders match this filter</p>
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {filtered.map(batch => {
              const sm = ORDER_STATUS_META[batch.status];
              // Group batch lines by kitchen
              const byKitchen: Record<string, CartLine[]> = {};
              batch.lines.forEach(line => {
                if (!byKitchen[line.item.kitchen]) byKitchen[line.item.kitchen] = [];
                byKitchen[line.item.kitchen].push(line);
              });
              const batchTotal = batch.lines.reduce((s, l) => s + l.item.price * l.qty, 0);

              return (
                <div key={batch.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  {/* Batch header */}
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100"
                    style={{ backgroundColor: "#fafafa" }}
                  >
                    <span className="text-gray-500" style={{ fontSize: 11 }}>🕐 {batch.timestamp}</span>
                    <span className="font-semibold text-gray-700" style={{ fontSize: 11 }}>· {batch.staffName}</span>
                    <span
                      className="ml-auto px-2 py-0.5 rounded-full font-semibold"
                      style={{ fontSize: 10, backgroundColor: sm.bg, color: sm.color }}
                    >
                      {sm.label}
                    </span>
                  </div>

                  {/* Kitchen groups */}
                  <div className="px-3 py-3 space-y-3">
                    {Object.entries(byKitchen).map(([kitchen, lines]) => {
                      const km = KITCHEN_META[kitchen] ?? { bg: "#f9fafb", text: "#374151", border: "#e5e7eb", dot: "#9ca3af" };
                      return (
                        <div key={kitchen}>
                          {/* Kitchen sub-header */}
                          <div
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md mb-2"
                            style={{ backgroundColor: km.bg, border: `1px solid ${km.border}` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: km.dot }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: km.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {kitchen}
                            </span>
                          </div>

                          {/* Line items */}
                          {lines.map(line => (
                            <div key={line.lineId || line.item.id} className="flex flex-col gap-1 py-1.5">
                              {/* Main Line */}
                              <div className="flex items-start gap-2">
                                {/* Qty bubble */}
                                <div
                                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold"
                                  style={{ backgroundColor: "#8b5cf6", color: "#fff", fontSize: 12 }}
                                >
                                  {line.qty}
                                </div>

                                {/* Name + modifiers + note */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-800 font-semibold" style={{ fontSize: 12 }}>
                                    {line.item.name}
                                  </p>
                                  {line.modifiers?.map((mod, mi) => (
                                    <p key={mi} className="text-gray-500 ml-1" style={{ fontSize: 11 }}>
                                      • {mod}
                                    </p>
                                  ))}
                                  {line.note && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <MessageSquare size={10} className="text-gray-400 shrink-0" />
                                      <span className="text-gray-500 italic" style={{ fontSize: 11 }}>
                                        {line.note}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Price */}
                                <span className="shrink-0 font-semibold" style={{ fontSize: 12, color: "#0d9488" }}>
                                  {formatVND(line.item.price * line.qty)}
                                </span>
                              </div>

                              {/* Nested Combo Items */}
                              {line.item.type === "combo" && (
                                <div className="ml-9 space-y-1 mt-1 border-l-2 border-gray-100 pl-2">
                                  {line.item.includedItems.map((child, ci) => {
                                    const childSel = line.comboSelections?.find(s => s.itemId === child.item.id);
                                    return (
                                      <div key={child.item.id + ci} className="flex flex-col">
                                        <div className="flex items-start justify-between">
                                          <p className="text-gray-600 font-medium" style={{ fontSize: 11 }}>
                                            <span className="text-gray-400 mr-1">↪</span>
                                            {child.fixedQuantity * line.qty} x {child.item.name}
                                          </p>
                                          {/* Price for combo child is 0 or hidden */}
                                        </div>
                                        {childSel?.modifiers?.map((mod, mi) => (
                                          <p key={mi} className="text-gray-400 ml-4" style={{ fontSize: 10 }}>
                                            • {mod}
                                          </p>
                                        ))}
                                        {childSel?.note && (
                                          <div className="flex items-center gap-1 mt-0.5 ml-4">
                                            <MessageSquare size={9} className="text-gray-400 shrink-0" />
                                            <span className="text-gray-400 italic" style={{ fontSize: 10 }}>
                                              {childSel.note}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    {/* Batch subtotal */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-400" style={{ fontSize: 11 }}>
                        {batch.lines.reduce((s, l) => s + l.qty, 0)} items
                      </span>
                      <span className="font-bold" style={{ fontSize: 13, color: "#374151" }}>
                        {formatVND(batchTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Attachments Tab (Right) ───────────────────────────────────
const MOCK_FILES = [
  { id: 1, name: "Deposit_Transfer.pdf", size: "1.2 MB", type: "pdf" },
  { id: 2, name: "Birthday_Setup.jpg",   size: "2.4 MB", type: "image" },
];

function AttachmentsTab() {
  const [files, setFiles] = useState(MOCK_FILES);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    // In a real app, upload the dropped files here
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Upload Dropzone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all"
        style={{
          borderColor: dragging ? "#0d9488" : "#d1d5db",
          backgroundColor: dragging ? "#f0fdf4" : "#f9fafb",
        }}
        onClick={() => document.getElementById("attachment-file-input")?.click()}
      >
        <input id="attachment-file-input" type="file" className="hidden" multiple />
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: dragging ? "#ccfbf1" : "#e5e7eb" }}
        >
          <UploadCloud size={22} style={{ color: dragging ? "#0d9488" : "#9ca3af" }} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700" style={{ fontSize: 13 }}>
            Click or drag files to upload
          </p>
          <p className="text-gray-400 mt-1" style={{ fontSize: 12 }}>
            Deposit receipts, layouts, and other documents
          </p>
        </div>
      </div>

      {/* Existing File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 font-semibold" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Uploaded Files
          </p>
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors"
            >
              {/* File Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: file.type === "pdf" ? "#fef3c7" : "#dbeafe" }}
              >
                {file.type === "pdf"
                  ? <FileText size={16} style={{ color: "#d97706" }} />
                  : <ImageIcon size={16} style={{ color: "#3b82f6" }} />}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-semibold truncate" style={{ fontSize: 12 }}>
                  {file.name}
                </p>
                <p className="text-gray-400" style={{ fontSize: 11 }}>{file.size}</p>
              </div>

              {/* Delete */}
              <button
                onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── More Info Tab (Left) ──────────────────────────────────────
function MoreInfoTab({ booking }: { booking: NonNullable<ReturnType<typeof ALL_BOOKINGS.find>> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-2">
        <InfoRow label="Booking Type">
          <span className="text-gray-700" style={{ fontSize: 12 }}>{booking.bookingType ?? "Dine-in"}</span>
        </InfoRow>
        <InfoRow label="Period">
          <span className="text-gray-700" style={{ fontSize: 12 }}>{booking.period}</span>
        </InfoRow>
        <InfoRow label="Duration">
          <span className="text-gray-700" style={{ fontSize: 12 }}>{booking.time} – {booking.endTime}</span>
        </InfoRow>
        {booking.tags.length > 0 && (
          <div className="py-1.5">
            <span className="text-gray-500 block mb-1.5" style={{ fontSize: 12 }}>Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {booking.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600" style={{ fontSize: 11 }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Invoice Tab (Left) ────────────────────────────────────────
function InvoiceTab() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 py-12 text-gray-400">
      <Wallet size={40} className="text-gray-200" />
      <p className="font-semibold" style={{ fontSize: 13 }}>No Invoice Yet</p>
      <p style={{ fontSize: 12 }}>Invoice will appear once order is confirmed.</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export interface OrderDetailsPanelProps {
  bookingId: number | null;
  selectedDay: number;
  onClose: () => void;
  onStatusChange?: (id: number, status: Status) => void;
  onBookingUpdated?: () => void;
}

type LeftTab  = "overview" | "moreinfo" | "invoice";
type RightTab = "cart" | "attachments";

export function OrderDetailsPanel({ bookingId, selectedDay: _selectedDay, onClose, onStatusChange, onBookingUpdated }: OrderDetailsPanelProps) {
  const [leftTab,   setLeftTab]   = useState<LeftTab>("overview");
  const [rightTab,  setRightTab]  = useState<RightTab>("cart");
  const [status,    setStatus]    = useState<Status | null>(null);
  const [openOther, setOpenOther] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft,     setDraft]     = useState<EditDraft | null>(null);
  const [catalogOpen,   setCatalogOpen]   = useState(false);
  const [orderBatches,  setOrderBatches]  = useState<OrderBatch[]>([]);
  const [cartFilter,    setCartFilter]    = useState<CartFilterStatus>("all");
  const [paymentOpen,   setPaymentOpen]   = useState(false);

  const isOpen  = bookingId !== null;
  const booking = ALL_BOOKINGS.find(b => b.id === bookingId);

  // Reset state when new booking is selected
  useEffect(() => {
    if (bookingId !== null) {
      setLeftTab("overview");
      setRightTab("cart");
      setStatus(null);
      setIsEditing(false);
      setDraft(null);
      setCatalogOpen(false);
      setOrderBatches([]);
      setCartFilter("all");
    }
  }, [bookingId]);

  if (!booking) return null;

  const currentStatus = status ?? booking.status;
  const color         = avatarColor(booking.guestName);

  function handleStatusChange(s: Status) {
    setStatus(s);
    onStatusChange?.(booking!.id, s);
  }

  function openEdit() {
    setDraft({
      guestName:        booking!.guestName,
      phone:            booking!.phone ?? "",
      guests:           booking!.guests,
      time:             booking!.time,
      duration:         timeToMin(booking!.endTime) - timeToMin(booking!.time),
      internalNote:     "",
      tags:             [...booking!.tags],
      primaryTable:     booking!.table,
      additionalTables: [...(booking!.additionalTables ?? [])],
    });
    setIsEditing(true);
    setLeftTab("overview"); // ensure we're on the overview tab
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraft(null);
  }

  function saveEdit() {
    if (!draft || !booking) return;
    const endTime = minToTime(timeToMin(draft.time) + draft.duration);
    updateBooking(booking.id, {
      guestName:        draft.guestName.trim() || booking.guestName,
      phone:            draft.phone.trim() || undefined,
      guests:           draft.guests,
      time:             draft.time,
      endTime,
      tags:             draft.tags,
      table:            draft.primaryTable,
      additionalTables: draft.additionalTables.length > 0 ? draft.additionalTables : undefined,
      period:           getPeriodForTime(draft.time),
      hasNote:          draft.internalNote.trim().length > 0 || booking.hasNote,
    });
    onBookingUpdated?.();
    setIsEditing(false);
    setDraft(null);
    setStatus(null); // let the saved status show
  }

  function handleDraftChange<K extends keyof EditDraft>(key: K, value: EditDraft[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev);
  }

  // ── Food catalog handlers ─────────────────────────────────
  function openCatalog() {
    setCatalogOpen(true);
  }

  function handleSaveOnly(lines: CartLine[]) {
    if (lines.length === 0) return;
    const batch: OrderBatch = {
      id:        Date.now().toString(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      staffName: "QuangNguyên",
      lines,
      status:    "new",
    };
    setOrderBatches(prev => [...prev, batch]);
    setCatalogOpen(false);
    setRightTab("cart");
  }

  function handleSaveAndSend(lines: CartLine[]) {
    if (lines.length === 0) return;
    const batch: OrderBatch = {
      id:        Date.now().toString(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      staffName: "QuangNguyên",
      lines,
      status:    "sent",
    };
    setOrderBatches(prev => [...prev, batch]);
    setCatalogOpen(false);
    setRightTab("cart");
  }

  const LEFT_TABS: { id: LeftTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "moreinfo", label: "More Info" },
    { id: "invoice",  label: "Invoice"  },
  ];

  const RIGHT_TABS: { id: RightTab; label: string }[] = [
    { id: "cart",        label: "Cart"        },
    { id: "attachments", label: "Attachments" },
  ];

  const ghostBtn = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors text-xs font-medium";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-200"
        style={{
          backgroundColor: "rgba(0,0,0,0.45)",
          pointerEvents: isOpen ? "auto" : "none",
          opacity: isOpen ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Full-screen Panel */}
      <div
        className="fixed inset-0 z-[70] flex flex-col bg-white transition-transform duration-300"
        style={{
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ═══════════════════════════════════════════════════════
            TOP ACTION BAR
        ═══════════════════════════════════════════════════════ */}
        <header
          className="shrink-0 flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4"
          style={{ height: 52 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors font-medium shrink-0"
            style={{ fontSize: 13 }}
          >
            <X size={14} />
            Close
          </button>

          <div style={{ flex: 1 }} />

          {/* Right action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button className={ghostBtn} onClick={openCatalog}>
              <UtensilsCrossed size={13} />
              Adjust Food
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ fontSize: 12, backgroundColor: "#0d9488" }}
            >
              <Check size={13} />
              Confirm Order
            </button>
            <StatusDropdown currentStatus={currentStatus} onStatusChange={handleStatusChange} />
            <button className={ghostBtn}>
              <ShoppingBag size={13} />
              Send to Kitchen
            </button>
            <button className={ghostBtn}>
              <Printer size={13} />
              Print
            </button>
            <MoreMenu />
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════
            SPLIT BODY
        ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ──────────────────────────────────────────────────────
              LEFT COLUMN   (~40%)
          ────────────────────────────────────────────────────── */}
          <div
            className="flex flex-col border-r border-gray-200 overflow-hidden relative"
            style={{ width: "40%", minWidth: 320, maxWidth: 480 }}
          >
            {/* Left Segmented Control / Edit Mode Banner */}
            {isEditing ? (
              <div
                className="flex items-center gap-2 bg-teal-50 shrink-0 px-4 py-2.5 border-b border-teal-100"
                style={{ minHeight: 48 }}
              >
                <span className="text-teal-700 font-semibold" style={{ fontSize: 13 }}>
                  ✏️ Editing Booking
                </span>
                <span className="ml-auto text-teal-500" style={{ fontSize: 11 }}>
                  Changes are not saved yet
                </span>
              </div>
            ) : (
              <div className="flex items-center bg-white shrink-0 px-3 py-2.5 border-b border-gray-100">
                <SegmentedControl
                  tabs={LEFT_TABS}
                  active={leftTab}
                  onChange={setLeftTab}
                  fullWidth
                />
              </div>
            )}

            {/* Left Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {isEditing && draft ? (
                <EditForm
                  draft={draft}
                  booking={booking}
                  onDraftChange={handleDraftChange}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                />
              ) : (
                <>
                  {leftTab === "overview" && (
                    <OverviewTab
                      booking={booking}
                      currentStatus={currentStatus}
                      onStatusChange={handleStatusChange}
                      onOpenEdit={openEdit}
                    />
                  )}
                  {leftTab === "moreinfo" && <MoreInfoTab booking={booking} />}
                  {leftTab === "invoice"  && <InvoiceTab />}
                </>
              )}
            </div>

            {/* ── Collapsible Left Action Drawer ──
                Floats above the scroll area via absolute positioning
            ──────────────────────────────────────── */}
            <div
              className="absolute left-0 right-0 bg-white border-t border-gray-200 overflow-hidden"
              style={{
                bottom: 44,
                maxHeight: openOther ? 260 : 0,
                transition: "max-height 0.3s cubic-bezier(0.16,1,0.3,1)",
                boxShadow: openOther ? "0 -4px 24px rgba(0,0,0,0.12)" : "none",
                zIndex: 10,
              }}
            >
              <div className="p-3 space-y-2">
                <p
                  className="text-gray-400 px-1"
                  style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}
                >
                  Actions
                </p>
                {/* Action grid — 2 columns */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Print Bill",       emoji: "🖨️", bg: "#f3f4f6", color: "#374151" },
                    { label: "No Show",          emoji: "🚫", bg: "#fff7ed", color: "#c2410c" },
                    { label: "Cancel Booking",   emoji: "❌", bg: "#fee2e2", color: "#991b1b" },
                    { label: "Duplicate",        emoji: "📋", bg: "#f0fdf4", color: "#15803d" },
                    { label: "Add Tips",         emoji: "💰", bg: "#fef9c3", color: "#854d0e" },
                    { label: "Combine Bill",     emoji: "🔗", bg: "#eff6ff", color: "#1d4ed8" },
                    { label: "Split Bill",       emoji: "✂️", bg: "#faf5ff", color: "#6d28d9" },
                    { label: "Send Confirm",     emoji: "📧", bg: "#f0fdf4", color: "#0d9488" },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left font-medium transition-all hover:opacity-90 active:scale-[0.97]"
                      style={{ backgroundColor: btn.bg, color: btn.color, fontSize: 12 }}
                    >
                      <span style={{ fontSize: 15 }}>{btn.emoji}</span>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle strip — always sticky at bottom */}
            <div
              className="shrink-0 border-t border-gray-200 flex items-center justify-between px-4 cursor-pointer hover:bg-gray-100 transition-colors"
              style={{ height: 44, backgroundColor: openOther ? "#f9fafb" : "#f3f4f6" }}
              onClick={() => setOpenOther(v => !v)}
            >
              <span className="text-gray-600 font-semibold" style={{ fontSize: 12 }}>
                {openOther ? "Close Actions" : "Open Action Menu"}
              </span>
              <span
                className="transition-transform duration-300"
                style={{ display: "flex", transform: openOther ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <ChevronUp size={15} className="text-gray-400" />
              </span>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────
              RIGHT COLUMN  (~60%)
          ────────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white relative">

            {/* Right Segmented Control */}
            <div className="flex items-center bg-white shrink-0 px-3 py-2.5 border-b border-gray-100">
              <SegmentedControl
                tabs={RIGHT_TABS}
                active={rightTab}
                onChange={setRightTab}
                fullWidth
              />
            </div>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {rightTab === "cart" && (
                <CartTab
                  orderBatches={orderBatches}
                  cartFilter={cartFilter}
                  setCartFilter={setCartFilter}
                  onOpenCatalog={openCatalog}
                />
              )}
              {rightTab === "attachments" && <AttachmentsTab />}
            </div>

            {/* ── Collapsible Payment Breakdown ──
                Floats above the scroll area, anchored to the strip
            ──────────────────────────────────────── */}
            <div
              className="absolute left-0 right-0 bg-white border-t border-gray-200 overflow-hidden"
              style={{
                bottom: 48,
                maxHeight: paymentOpen ? 320 : 0,
                transition: "max-height 0.3s cubic-bezier(0.16,1,0.3,1)",
                boxShadow: paymentOpen ? "0 -4px 24px rgba(0,0,0,0.12)" : "none",
                zIndex: 10,
              }}
            >
              <div className="p-4 space-y-3">
                {/* Cost breakdown rows */}
                <div className="space-y-2">
                  {[
                    { label: "Sub Total",        value: "1.616.612 đ",  color: "#374151" },
                    { label: "Discount",         value: "0 đ",           color: "#374151" },
                    { label: "VAT (10%)",        value: "161.661 đ",    color: "#374151" },
                    { label: "Service (5%)",     value: "80.831 đ",     color: "#374151" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-gray-500" style={{ fontSize: 12 }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: row.color, fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-800" style={{ fontSize: 13 }}>Total</span>
                    <span className="font-extrabold" style={{ fontSize: 15, color: "#ef4444" }}>1.859.104 đ</span>
                  </div>
                </div>

                {/* Payment action buttons — 2 rows of 3 */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { label: "Extra Charge", bg: "linear-gradient(135deg,#f97316,#fb923c)", shadow: "rgba(249,115,22,0.35)" },
                    { label: "Commission",   bg: "linear-gradient(135deg,#64748b,#94a3b8)", shadow: "rgba(100,116,139,0.3)"  },
                    { label: "Discount",     bg: "linear-gradient(135deg,#3b82f6,#60a5fa)", shadow: "rgba(59,130,246,0.35)" },
                    { label: "Voucher",      bg: "linear-gradient(135deg,#8b5cf6,#a78bfa)", shadow: "rgba(139,92,246,0.35)" },
                    { label: "Recv. Payment",bg: "linear-gradient(135deg,#10b981,#34d399)", shadow: "rgba(16,185,129,0.4)"  },
                    { label: "Complete",     bg: "linear-gradient(135deg,#0d9488,#14b8a6)", shadow: "rgba(13,148,136,0.4)"  },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      className="py-2.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                      style={{
                        fontSize: 11,
                        background: btn.bg,
                        boxShadow: `0 3px 10px ${btn.shadow}`,
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Total Payment strip — always visible, click to expand */}
            <div
              className="shrink-0 border-t border-gray-200 bg-white flex items-center justify-between px-5 cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ height: 48 }}
              onClick={() => setPaymentOpen(v => !v)}
            >
              <div className="flex items-center gap-1 text-gray-500">
                <span
                  className="transition-transform duration-300"
                  style={{ display: "flex", transform: paymentOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                >
                  <ChevronRight size={14} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Total Payment</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>1.859.104 đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Food Catalog Overlay ─────────────────────────────── */}
      <ErrorBoundary>
        <FoodCatalog
          open={catalogOpen}
          bookingRef={generateBookingId(booking.id)}
          bookingName={booking.guestName}
          initialCart={[]}
          onBack={() => setCatalogOpen(false)}
          onSaveOnly={handleSaveOnly}
          onSaveAndSend={handleSaveAndSend}
        />
      </ErrorBoundary>
    </>
  );
}
