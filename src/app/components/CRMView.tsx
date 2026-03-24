import React, { useState, useMemo } from "react";
import {
  Search, Plus, Star, TrendingUp, Users, Calendar,
  Phone, Mail, MessageSquare, ChevronDown, ChevronRight,
  Edit3, Tag, Heart, AlertTriangle, Clock,
  FileText, Filter, MoreHorizontal, ArrowUpRight,
} from "lucide-react";

// ── Data ─────────────────────────────────────────────────────

type Segment = "vip" | "regular" | "new" | "atrisk";

interface Visit {
  date: string;
  table: number;
  section: string;
  guests: number;
  spent: number;
  tags?: string[];
}

interface UpcomingBooking {
  date: string;
  time: string;
  table: number;
  section: string;
  guests: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  segment: Segment;
  visits: number;
  totalSpent: number;
  lastVisitDaysAgo: number;
  avgParty: number;
  tags: string[];
  preferences: string[];
  allergies: string[];
  notes: string;
  visitHistory: Visit[];
  upcoming?: UpcomingBooking;
}

const CUSTOMERS: Customer[] = [
  {
    id: 1, name: "Alice Johnson", email: "alice.johnson@email.com", phone: "+45 23 45 67 89",
    segment: "vip", visits: 156, totalSpent: 8420, lastVisitDaysAgo: 5, avgParty: 2.4,
    tags: ["VIP", "Seafood lover", "Anniversary"],
    preferences: ["Window seat", "Quiet area", "Wine pairing"],
    allergies: ["Shellfish"],
    notes: "Long-time loyal guest. Celebrates her anniversary here every November. Always appreciates a personal touch. Prefers table 5 or 7 near the window. Typically orders the tasting menu with paired wines.",
    visitHistory: [
      { date: "Nov 29, 2025", table: 1, section: "Restaurant", guests: 2, spent: 180, tags: ["Evening menu"] },
      { date: "Nov 15, 2025", table: 3, section: "Restaurant", guests: 4, spent: 320 },
      { date: "Oct 28, 2025", table: 1, section: "Restaurant", guests: 2, spent: 165, tags: ["Tasting menu"] },
      { date: "Oct 11, 2025", table: 5, section: "First floor", guests: 2, spent: 215 },
      { date: "Sep 30, 2025", table: 3, section: "Restaurant", guests: 6, spent: 480, tags: ["Anniversary ❤️"] },
    ],
    upcoming: { date: "Dec 11, 2025", time: "19:00", table: 5, section: "First floor", guests: 4 },
  },
  {
    id: 2, name: "Michael Smithson", email: "m.smithson@corp.dk", phone: "+45 31 22 44 66",
    segment: "vip", visits: 89, totalSpent: 4200, lastVisitDaysAgo: 3, avgParty: 3.8,
    tags: ["VIP", "Business", "Corporate"],
    preferences: ["Private area", "Fast service"],
    allergies: [],
    notes: "Frequently brings business clients. Prefers the private dining area or First floor. Often orders set business lunch. Company account — invoices to Smithson Corp.",
    visitHistory: [
      { date: "Dec 1, 2025",  table: 7, section: "First floor", guests: 4, spent: 380, tags: ["Business"] },
      { date: "Nov 20, 2025", table: 10, section: "First floor", guests: 6, spent: 540 },
      { date: "Nov 8, 2025",  table: 7, section: "First floor", guests: 3, spent: 270 },
      { date: "Oct 25, 2025", table: 10, section: "First floor", guests: 8, spent: 720 },
      { date: "Oct 14, 2025", table: 7, section: "First floor", guests: 4, spent: 360 },
    ],
    upcoming: { date: "Dec 9, 2025", time: "12:30", table: 10, section: "First floor", guests: 6 },
  },
  {
    id: 3, name: "Olivia Garcia", email: "olivia.garcia@mail.com", phone: "+45 44 55 66 77",
    segment: "regular", visits: 34, totalSpent: 1680, lastVisitDaysAgo: 12, avgParty: 2.1,
    tags: ["Regular", "Vegetarian"],
    preferences: ["Vegetarian options", "Terrace seating"],
    allergies: ["Dairy"],
    notes: "Always requests vegetarian menu. Loves the terrace in good weather. Celebrates birthdays here — has brought groups of 8–10 guests twice.",
    visitHistory: [
      { date: "Nov 22, 2025", table: 2, section: "Terrace", guests: 2, spent: 120 },
      { date: "Nov 5, 2025",  table: 2, section: "Terrace", guests: 2, spent: 95 },
      { date: "Oct 18, 2025", table: 4, section: "Terrace", guests: 10, spent: 680, tags: ["Birthday 🎂"] },
      { date: "Sep 22, 2025", table: 2, section: "Terrace", guests: 2, spent: 110 },
    ],
  },
  {
    id: 4, name: "James Wilson", email: "j.wilson@outlook.com", phone: "+45 67 89 01 23",
    segment: "regular", visits: 28, totalSpent: 1240, lastVisitDaysAgo: 8, avgParty: 3.2,
    tags: ["Regular", "Four seasons"],
    preferences: ["Four seasons menu", "Center table"],
    allergies: ["Nuts"],
    notes: "Huge fan of the four seasons menu. Always asks for the seasonal recommendation. Comes once or twice a month, often with different groups.",
    visitHistory: [
      { date: "Nov 26, 2025", table: 4, section: "Restaurant", guests: 4, spent: 280, tags: ["Four seasons"] },
      { date: "Nov 10, 2025", table: 6, section: "Restaurant", guests: 2, spent: 165, tags: ["Four seasons"] },
      { date: "Oct 30, 2025", table: 4, section: "Restaurant", guests: 5, spent: 345 },
    ],
  },
  {
    id: 5, name: "Charlotte Harris", email: "charlotte.h@gmail.com", phone: "+45 12 98 76 54",
    segment: "regular", visits: 21, totalSpent: 940, lastVisitDaysAgo: 1, avgParty: 2.0,
    tags: ["Regular", "Wine lover"],
    preferences: ["Wine list recommendations", "Tasting menu"],
    allergies: [],
    notes: "Always interested in the wine selection. Somm should recommend pairings. Comes monthly, usually on Friday evenings.",
    visitHistory: [
      { date: "Dec 3, 2025",  table: 3, section: "Restaurant", guests: 2, spent: 195, tags: ["Wine pairing"] },
      { date: "Nov 7, 2025",  table: 3, section: "Restaurant", guests: 2, spent: 175 },
      { date: "Oct 4, 2025",  table: 5, section: "Restaurant", guests: 2, spent: 160 },
    ],
  },
  {
    id: 6, name: "Benjamin Clark", email: "ben.clark@email.dk", phone: "+45 55 44 33 22",
    segment: "regular", visits: 15, totalSpent: 720, lastVisitDaysAgo: 20, avgParty: 4.1,
    tags: ["Regular", "Family"],
    preferences: ["Family-friendly table", "High chair available"],
    allergies: ["Gluten"],
    notes: "Comes with family including young children. Needs a high chair. Gluten allergy — always confirm with kitchen. Appreciates the kids menu.",
    visitHistory: [
      { date: "Nov 14, 2025", table: 9, section: "Restaurant", guests: 5, spent: 280 },
      { date: "Oct 10, 2025", table: 9, section: "Restaurant", guests: 4, spent: 210 },
    ],
  },
  {
    id: 7, name: "Sophia Williams", email: "sophia.w@hotmail.com", phone: "+45 78 56 34 12",
    segment: "new", visits: 4, totalSpent: 280, lastVisitDaysAgo: 2, avgParty: 2.8,
    tags: ["New guest"],
    preferences: [],
    allergies: [],
    notes: "New guest — discovered us through Instagram. Left a great review online. Seems very engaged with the brand.",
    visitHistory: [
      { date: "Dec 2, 2025",  table: 9, section: "Restaurant", guests: 11, spent: 140 },
      { date: "Nov 18, 2025", table: 6, section: "Restaurant", guests: 2, spent: 90 },
    ],
  },
  {
    id: 8, name: "Ethan Thomas", email: "e.thomas@mail.dk", phone: "+45 90 12 34 56",
    segment: "new", visits: 3, totalSpent: 165, lastVisitDaysAgo: 0, avgParty: 1.7,
    tags: ["New guest", "Solo diner"],
    preferences: ["Bar seating", "Quick service"],
    allergies: [],
    notes: "Usually dines alone or with one other person. Likes the bar area and quick turnaround. New to the restaurant — make a good impression.",
    visitHistory: [
      { date: "Dec 4, 2025",  table: 8, section: "Bar", guests: 1, spent: 65 },
      { date: "Nov 25, 2025", table: 8, section: "Bar", guests: 2, spent: 55 },
    ],
  },
  {
    id: 9, name: "Ava Perez", email: "ava.perez@email.com", phone: "+45 22 33 44 55",
    segment: "atrisk", visits: 12, totalSpent: 540, lastVisitDaysAgo: 75, avgParty: 3.5,
    tags: ["At risk", "Regular"],
    preferences: ["Outdoor seating"],
    allergies: [],
    notes: "Used to come regularly but hasn't visited in over 2 months. Previous positive feedback. Consider reaching out with a welcome-back offer.",
    visitHistory: [
      { date: "Sep 20, 2025", table: 2, section: "Terrace", guests: 4, spent: 195 },
      { date: "Sep 5, 2025",  table: 2, section: "Terrace", guests: 3, spent: 145 },
      { date: "Aug 22, 2025", table: 2, section: "Terrace", guests: 4, spent: 200 },
    ],
  },
  {
    id: 10, name: "Lucas Robinson", email: "lucas.r@corp.dk", phone: "+45 66 55 44 33",
    segment: "atrisk", visits: 8, totalSpent: 320, lastVisitDaysAgo: 91, avgParty: 2.0,
    tags: ["At risk"],
    preferences: [],
    allergies: ["Peanuts"],
    notes: "Has not returned in 3 months. Last visit had a minor service complaint (slow dessert). Consider a re-engagement campaign.",
    visitHistory: [
      { date: "Sep 4, 2025",  table: 5, section: "Restaurant", guests: 2, spent: 110 },
      { date: "Aug 15, 2025", table: 5, section: "Restaurant", guests: 2, spent: 100 },
    ],
  },
  {
    id: 11, name: "Emma Rodriguez", email: "emma.rodriguez@email.com", phone: "+45 11 22 33 44",
    segment: "regular", visits: 19, totalSpent: 880, lastVisitDaysAgo: 15, avgParty: 2.6,
    tags: ["Regular", "Brunch fan"],
    preferences: ["Morning/brunch slot", "Terrace"],
    allergies: [],
    notes: "Loves our brunch offering. Usually books morning slots on weekends. Has recommended us to several friends.",
    visitHistory: [
      { date: "Nov 19, 2025", table: 2, section: "Terrace", guests: 3, spent: 125 },
      { date: "Nov 2, 2025",  table: 2, section: "Terrace", guests: 2, spent: 95 },
    ],
  },
  {
    id: 12, name: "Noah Garcia", email: "noah.g@mail.dk", phone: "+45 99 88 77 66",
    segment: "new", visits: 2, totalSpent: 95, lastVisitDaysAgo: 1, avgParty: 2.0,
    tags: ["New guest"],
    preferences: [],
    allergies: [],
    notes: "Very new guest. Second visit yesterday. Seems to enjoy the experience.",
    visitHistory: [
      { date: "Dec 3, 2025",  table: 4, section: "Restaurant", guests: 2, spent: 55 },
      { date: "Nov 28, 2025", table: 6, section: "Restaurant", guests: 2, spent: 40 },
    ],
  },
];

const SEGMENT_META: Record<Segment, { label: string; color: string; bg: string; icon: React.ReactNode; description: string }> = {
  vip:     { label: "VIP",      color: "#92400e", bg: "#fef3c7", icon: <Star size={11} />, description: "High-value, loyal guests" },
  regular: { label: "Regular",  color: "#1e40af", bg: "#eff6ff", icon: <Heart size={11} />, description: "Consistent returning guests" },
  new:     { label: "New",      color: "#065f46", bg: "#f0fdf4", icon: <TrendingUp size={11} />, description: "Joined in the last 3 months" },
  atrisk:  { label: "At risk",  color: "#991b1b", bg: "#fef2f2", icon: <AlertTriangle size={11} />, description: "No visit in 60+ days" },
};

// ── Avatar ──────────────────────────────────────────────────

const AVATAR_PALETTE = ["#0f766e","#0369a1","#7c3aed","#b45309","#15803d","#c2410c","#9333ea","#0e7490","#b91c1c","#6d28d9"];
function avatarColor(name: string) {
  const c = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return AVATAR_PALETTE[c % AVATAR_PALETTE.length];
}
function initials(name: string) {
  const p = name.trim().split(" ");
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-white shrink-0"
      style={{ width: size, height: size, backgroundColor: avatarColor(name), fontSize: size * 0.35, fontWeight: 700 }}
    >
      {initials(name)}
    </div>
  );
}

function SegmentBadge({ segment }: { segment: Segment }) {
  const m = SEGMENT_META[segment];
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: m.bg, fontSize: 10.5 }}>
      <span style={{ color: m.color }}>{m.icon}</span>
      <span style={{ color: m.color, fontWeight: 600 }}>{m.label}</span>
    </span>
  );
}

// ── Customer List Item ───────────────────────────────────────

function CustomerListItem({ customer, selected, onClick }: { customer: Customer; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-b border-gray-100 transition-colors"
      style={{ backgroundColor: selected ? "#f0fdfa" : "white" }}
    >
      <Avatar name={customer.name} size={34} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-800 truncate" style={{ fontSize: 12.5, fontWeight: 500 }}>{customer.name}</span>
          <SegmentBadge segment={customer.segment} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-gray-500" style={{ fontSize: 11 }}>{customer.visits} visits</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-500" style={{ fontSize: 11 }}>{customer.totalSpent.toLocaleString("vi-VN")}₫</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400" style={{ fontSize: 10 }}>
            {customer.lastVisitDaysAgo === 0 ? "Today" : customer.lastVisitDaysAgo === 1 ? "Yesterday" : `${customer.lastVisitDaysAgo}d ago`}
          </span>
        </div>
      </div>
      {selected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
    </div>
  );
}

// ── Customer Detail ──────────────────────────────────────────

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2.5 text-center border border-gray-100">
      <div className="font-bold text-gray-900" style={{ fontSize: 18, lineHeight: 1 }}>{value}</div>
      <div className="text-gray-500 mt-0.5" style={{ fontSize: 10.5 }}>{label}</div>
      {sub && <div className="text-gray-400" style={{ fontSize: 10 }}>{sub}</div>}
    </div>
  );
}

function CustomerDetail({ customer }: { customer: Customer }) {
  const [activeTab, setActiveTab] = useState<"overview" | "visits" | "notes">("overview");

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Hero */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={customer.name} size={52} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-gray-900" style={{ fontSize: 18, fontWeight: 700 }}>{customer.name}</h2>
                <SegmentBadge segment={customer.segment} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors">
                  <Mail size={12} /><span style={{ fontSize: 12 }}>{customer.email}</span>
                </a>
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors">
                  <Phone size={12} /><span style={{ fontSize: 12 }}>{customer.phone}</span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontSize: 12 }}>
              <MessageSquare size={13} /> Message
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 rounded-lg text-white hover:bg-emerald-600 transition-colors" style={{ fontSize: 12 }}>
              <Plus size={13} /> New booking
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mt-4">
          <StatCard value={String(customer.visits)} label="Total visits" />
          <StatCard value={`${customer.totalSpent.toLocaleString("vi-VN")}₫`} label="Tổng chi tiêu" sub={`${(customer.totalSpent / Math.max(customer.visits, 1)).toFixed(0)}₫/lượt`} />
          <StatCard value={customer.avgParty.toFixed(1)} label="Avg. party" sub="guests" />
          <StatCard
            value={customer.lastVisitDaysAgo === 0 ? "Today" : customer.lastVisitDaysAgo === 1 ? "Yest." : `${customer.lastVisitDaysAgo}d`}
            label="Last visit"
            sub={customer.lastVisitDaysAgo > 60 ? "⚠ Long time" : undefined}
          />
        </div>
      </div>

      {/* Upcoming booking */}
      {customer.upcoming && (
        <div className="mx-6 mt-4 flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <Calendar size={13} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#065f46" }}>Upcoming booking</div>
              <div style={{ fontSize: 11, color: "#047857" }}>
                {customer.upcoming.date} · {customer.upcoming.time} · {customer.upcoming.section} T.{customer.upcoming.table} · {customer.upcoming.guests} guests
              </div>
            </div>
          </div>
          <button className="text-emerald-600 hover:text-emerald-800 transition-colors">
            <ArrowUpRight size={15} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mx-6 mt-4">
        {(["overview", "visits", "notes"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 capitalize transition-colors relative ${activeTab === tab ? "text-emerald-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
            style={{ fontSize: 12 }}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
          </button>
        ))}
      </div>

      <div className="px-6 py-4 space-y-5">
        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <>
            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700" style={{ fontSize: 12 }}>Tags</span>
                <button className="text-emerald-500 hover:text-emerald-700 transition-colors"><Plus size={13} /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {customer.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200" style={{ fontSize: 11 }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Preferences */}
            {customer.preferences.length > 0 && (
              <div>
                <div className="font-semibold text-gray-700 mb-2" style={{ fontSize: 12 }}>Preferences</div>
                <div className="flex flex-wrap gap-1.5">
                  {customer.preferences.map(p => (
                    <span key={p} className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100" style={{ fontSize: 11 }}>✓ {p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {customer.allergies.length > 0 && (
              <div>
                <div className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5" style={{ fontSize: 12 }}>
                  <AlertTriangle size={12} className="text-amber-500" /> Allergies / Dietary
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {customer.allergies.map(a => (
                    <span key={a} className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200" style={{ fontSize: 11 }}>⚠ {a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <div className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5" style={{ fontSize: 12 }}>
                <FileText size={12} className="text-gray-400" /> Staff notes
              </div>
              <p className="text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100" style={{ fontSize: 12 }}>
                {customer.notes}
              </p>
            </div>
          </>
        )}

        {/* ── Visits Tab ── */}
        {activeTab === "visits" && (
          <div>
            <div className="font-semibold text-gray-700 mb-3" style={{ fontSize: 12 }}>
              Visit history <span className="text-gray-400 font-normal">({customer.visitHistory.length} shown)</span>
            </div>
            <div className="space-y-2">
              {customer.visitHistory.map((v, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors bg-white">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: avatarColor(customer.name) + "22" }}
                  >
                    <Calendar size={13} style={{ color: avatarColor(customer.name) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-800" style={{ fontSize: 12, fontWeight: 500 }}>{v.date}</span>
                      {v.tags?.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600" style={{ fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                    <div className="text-gray-500 mt-0.5" style={{ fontSize: 11 }}>
                      {v.section} · T.{v.table} · {v.guests} guests
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-gray-800 font-medium" style={{ fontSize: 13 }}>{v.spent.toLocaleString("vi-VN")}₫</div>
                    <div className="text-gray-400" style={{ fontSize: 10 }}>{(v.spent / v.guests).toFixed(0)}₫/kh</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Notes Tab ── */}
        {activeTab === "notes" && (
          <div>
            <div className="font-semibold text-gray-700 mb-3 flex items-center justify-between" style={{ fontSize: 12 }}>
              Staff notes
              <button className="flex items-center gap-1 text-emerald-500 hover:text-emerald-700 transition-colors" style={{ fontSize: 11 }}>
                <Edit3 size={12} /> Edit
              </button>
            </div>
            <textarea
              defaultValue={customer.notes}
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:border-emerald-400 resize-none bg-gray-50"
              style={{ fontSize: 12, lineHeight: 1.6 }}
              rows={6}
            />
            <div className="mt-4 flex gap-2">
              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors" style={{ fontSize: 12 }}>Save notes</button>
              <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontSize: 12 }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main CRM View ────────────────────────────────────────────

export function CRMView() {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<Segment | "all">("all");
  const [selectedId, setSelectedId] = useState<number>(1);

  const filtered = useMemo(() => {
    return CUSTOMERS.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchSeg = segmentFilter === "all" || c.segment === segmentFilter;
      return matchSearch && matchSeg;
    });
  }, [search, segmentFilter]);

  const selected = CUSTOMERS.find(c => c.id === selectedId) ?? CUSTOMERS[0];

  const totalSpent   = CUSTOMERS.reduce((s, c) => s + c.totalSpent, 0);
  const avgSpend     = (totalSpent / CUSTOMERS.length).toFixed(0);
  const activeCount  = CUSTOMERS.filter(c => c.lastVisitDaysAgo <= 30).length;
  const atRiskCount  = CUSTOMERS.filter(c => c.segment === "atrisk").length;

  const SEGMENT_COUNTS = {
    vip:     CUSTOMERS.filter(c => c.segment === "vip").length,
    regular: CUSTOMERS.filter(c => c.segment === "regular").length,
    new:     CUSTOMERS.filter(c => c.segment === "new").length,
    atrisk:  CUSTOMERS.filter(c => c.segment === "atrisk").length,
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">

      {/* ── CRM Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: 18, fontWeight: 700 }}>Customer Relationships</h1>
          <p className="text-gray-500" style={{ fontSize: 12 }}>Pasta Mia · {CUSTOMERS.length} guests in database</p>
        </div>
        {/* Top-level stats */}
        <div className="flex items-center gap-4">
          {[
            { label: "Total guests",   value: CUSTOMERS.length, color: "#374151" },
            { label: "Active (30d)",   value: activeCount,      color: "#0f766e" },
            { label: "Chi tiêu TB",     value: `${avgSpend}₫`,   color: "#1d4ed8" },
            { label: "At risk",        value: atRiskCount,      color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="text-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <div className="font-bold" style={{ fontSize: 17, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div className="text-gray-500" style={{ fontSize: 10 }}>{s.label}</div>
            </div>
          ))}
          <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors" style={{ fontSize: 12 }}>
            <Plus size={14} /> Add guest
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Customer List ── */}
        <div className="flex flex-col bg-white border-r border-gray-200 overflow-hidden" style={{ width: 300, flexShrink: 0 }}>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute text-gray-400 pointer-events-none" style={{ left: 9, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search guests…"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-gray-700 focus:outline-none focus:border-emerald-400 bg-gray-50"
                style={{ fontSize: 12 }}
              />
            </div>
          </div>

          {/* Segment filters */}
          <div className="flex gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto">
            <button
              onClick={() => setSegmentFilter("all")}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${segmentFilter === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={{ fontSize: 11 }}
            >
              All ({CUSTOMERS.length})
            </button>
            {(Object.entries(SEGMENT_COUNTS) as [Segment, number][]).map(([seg, count]) => {
              const m = SEGMENT_META[seg];
              return (
                <button
                  key={seg}
                  onClick={() => setSegmentFilter(seg === segmentFilter ? "all" : seg)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
                  style={{
                    fontSize: 11,
                    backgroundColor: segmentFilter === seg ? m.color : m.bg,
                    color: segmentFilter === seg ? "white" : m.color,
                  }}
                >
                  {m.label} {count}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <Users size={28} className="text-gray-300" />
                <p style={{ fontSize: 12 }}>No guests found</p>
              </div>
            ) : (
              filtered.map(c => (
                <CustomerListItem
                  key={c.id}
                  customer={c}
                  selected={c.id === selectedId}
                  onClick={() => setSelectedId(c.id)}
                />
              ))
            )}
          </div>

          {/* List footer */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
            <span className="text-gray-400" style={{ fontSize: 11 }}>{filtered.length} of {CUSTOMERS.length} guests</span>
          </div>
        </div>

        {/* ── Right: Customer Detail ── */}
        {selected ? (
          <CustomerDetail key={selected.id} customer={selected} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
            <div className="text-center">
              <Users size={40} className="mx-auto mb-2 text-gray-300" />
              <p style={{ fontSize: 14 }}>Select a guest to view their profile</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
