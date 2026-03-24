import React, { useState, useMemo } from "react";
import {
  X, ChevronLeft, ChevronRight, Clock, Users, MapPin,
  Check, Info, Calendar, Phone, Mail, User, Globe,
  CheckCircle2, FileText, Plus, Minus, PaperclipIcon,
  StickyNote, MessageSquare, ChevronDown, Star, Utensils,
} from "lucide-react";
import { ALL_BOOKINGS } from "../data/bookings";

// ── Helpers ──────────────────────────────────────────────────
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function isTableFree(section: string, table: number, slot: string, dur: number) {
  const s = timeToMin(slot), e = s + dur;
  return !ALL_BOOKINGS.some(b => b.section === section && b.table === table && timeToMin(b.time) < e && timeToMin(b.endTime) > s);
}

// ── Static data ───────────────────────────────────────────────
const BOOKING_TYPES = [
  { id: "alacarte",  label: "À la carte",       icon: "🍽️" },
  { id: "setmenu2",  label: "Set menu (2 crs.)", icon: "🥗" },
  { id: "setmenu3",  label: "Set menu (3 crs.)", icon: "🍴" },
  { id: "tasting",   label: "Tasting menu",      icon: "👨‍🍳" },
  { id: "business",  label: "Business lunch",    icon: "💼" },
  { id: "event",     label: "Private event",     icon: "🎉" },
  { id: "group",     label: "Group booking",     icon: "👥" },
];

const SECTIONS  = ["Restaurant", "First floor", "Terrace", "Bar"];
const TABLE_MAP: Record<string, number[]> = {
  "Restaurant":  [1,2,3,4,5,6,7,8,9,10,11],
  "First floor": [1,2,3,4,5,6,7,8,9,10],
  "Terrace":     [1,2,3,4,5],
  "Bar":         [1,2,3,4,5,6,7,8],
};

const TIME_SLOTS = [
  { period: "🌅 Morning", color: "#d97706", slots: ["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30"] },
  { period: "☀️ Lunch",   color: "#ea580c", slots: ["12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30"] },
  { period: "🌙 Evening", color: "#0f766e", slots: ["17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30"] },
];

const DURATIONS = [
  { label: "30 min", v: 30 }, { label: "45 min", v: 45 },
  { label: "1 h",    v: 60 }, { label: "1.5 h",   v: 90 },
  { label: "2 h",    v: 120 }, { label: "2.5 h",  v: 150 },
];

const LANGUAGES = [
  { code: "da", flag: "🇩🇰", label: "Danish" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "German" },
  { code: "fr", flag: "🇫🇷", label: "French" },
  { code: "es", flag: "🇪🇸", label: "Spanish" },
  { code: "sv", flag: "🇸🇪", label: "Swedish" },
  { code: "no", flag: "🇳🇴", label: "Norwegian" },
  { code: "it", flag: "🇮🇹", label: "Italian" },
];

const COUNTRY_CODES = [
  { code: "+45", flag: "🇩🇰" }, { code: "+46", flag: "🇸🇪" },
  { code: "+47", flag: "🇳🇴" }, { code: "+49", flag: "🇩🇪" },
  { code: "+44", flag: "🇬🇧" }, { code: "+1",  flag: "🇺🇸" },
  { code: "+33", flag: "🇫🇷" }, { code: "+39", flag: "🇮🇹" },
];

const PREORDER_MENU = [
  { id: "evening",  name: "Evening menu",    desc: "Thực đơn 3 món tối",           price: "1.500.000₫",  icon: "🍽️" },
  { id: "four",     name: "Four Seasons",    desc: "Thực đơn 4 món theo mùa",      price: "1.850.000₫",  icon: "🍂" },
  { id: "tasting",  name: "Chef's tasting",  desc: "Trải nghiệm 7 món của Chef",   price: "2.200.000₫",  icon: "👨‍🍳" },
  { id: "setlunch", name: "Set lunch",       desc: "Set lâu 2 món",                price: "800.000₫",   icon: "☀️" },
  { id: "seafood",  name: "Seafood special", desc: "Today's fresh seafood special", price: "Market",  icon: "🦞" },
  { id: "wine",     name: "Wine pairing",    desc: "Rượu vang theo món",             price: "+800.000₫", icon: "🍷" },
  { id: "veg",      name: "Vegetarian",      desc: "Thực đơn thuần chạy",            price: "1.400.000₫",  icon: "🥗" },
];

const OCCASION_TAGS = [
  { label: "Birthday 🎂",    color: "#b45309" },
  { label: "Anniversary ❤️", color: "#be185d" },
  { label: "Business",       color: "#1d4ed8" },
  { label: "VIP ⭐",         color: "#92400e" },
  { label: "Team event",     color: "#065f46" },
  { label: "Date night",     color: "#9333ea" },
  { label: "Allergen: nuts", color: "#7f1d1d" },
  { label: "Allergen: gluten",color:"#7f1d1d" },
  { label: "Wheelchair",     color: "#0c4a6e" },
];

// ── Form type ─────────────────────────────────────────────────
interface Form {
  // Step 1 – Booking
  place: string;        // section / area
  type: string;         // booking type
  date: string;
  timeSlot: string;
  duration: number;
  // Step 2 – Guests & Table
  adults: number;
  children: number;
  table: number | null;
  // Step 3 – Guest contact
  name: string;
  countryCode: string;
  mobile: string;
  email: string;
  language: string;
  another: string;       // alternative contact
  // Step 4 – Preferences & notes
  preorders: string[];   // menu item ids
  tags: string[];
  internalNote: string;  // staff only, not shown to guest
  guestText: string;     // text included in confirmation to guest
  files: string[];       // mock filenames
}

// ── Sub-components ────────────────────────────────────────────
function SectionLabel({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <span className="text-gray-800" style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
      {sub && <span className="text-gray-400" style={{ fontSize: 10.5 }}>{sub}</span>}
    </div>
  );
}

function FieldWrap({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="flex items-center gap-1 mb-1" style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>
        {label}{required && <span className="text-red-400">*</span>}
        {hint && (
          <span className="group relative cursor-help ml-1">
            <Info size={10} className="text-gray-400" />
            <div className="absolute bottom-5 left-0 hidden group-hover:block bg-gray-800 text-white rounded px-2 py-1 whitespace-nowrap z-50" style={{ fontSize: 10 }}>{hint}</div>
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function NumberStepper({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-emerald-400 transition-colors select-none text-base">−</button>
      <span className="text-gray-900 min-w-[24px] text-center" style={{ fontSize: 16, fontWeight: 700 }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-emerald-400 transition-colors select-none text-base">+</button>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="relative inline-flex rounded-full transition-colors shrink-0" style={{ width: 36, height: 20, backgroundColor: checked ? "#10b981" : "#d1d5db" }}>
      <span className="inline-block rounded-full bg-white shadow transition-transform" style={{ width: 14, height: 14, marginTop: 3, transform: checked ? "translateX(19px)" : "translateX(3px)" }} />
    </button>
  );
}

function StepDot({ step, current, total }: { step: number; current: number; total: number }) {
  const state = step < current ? "done" : step === current ? "active" : "todo";
  return (
    <div className="flex items-center gap-1">
      <div className="rounded-full flex items-center justify-center transition-all"
        style={{
          width: state === "active" ? 22 : 18,
          height: state === "active" ? 22 : 18,
          backgroundColor: state === "done" ? "#10b981" : state === "active" ? "#10b981" : "#e5e7eb",
          fontSize: 10, fontWeight: 700, color: state === "todo" ? "#9ca3af" : "white",
        }}>
        {state === "done" ? <Check size={10} /> : step + 1}
      </div>
      {step < total - 1 && <div style={{ width: 16, height: 2, backgroundColor: step < current ? "#10b981" : "#e5e7eb" }} />}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────
const STEPS = ["Booking", "Guests & Table", "Contact", "Preferences", "Confirm"];

interface NewBookingModalProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
  initialSlot?: { section?: string; table?: number | null; timeSlot?: string };
}

export function NewBookingModal({ open, onClose, initialDate = "Monday, December 4, 2025", initialSlot }: NewBookingModalProps) {
  const [step,   setStep]   = useState(0);
  const [booked, setBooked] = useState(false);
  const [form,   setForm]   = useState<Form>({
    place: "Restaurant", type: "alacarte", date: initialDate,
    timeSlot: "", duration: 60,
    adults: 2, children: 0, table: null,
    name: "", countryCode: "+45", mobile: "", email: "",
    language: "da", another: "",
    preorders: [], tags: [], internalNote: "", guestText: "", files: [],
  });

  const prevOpen = React.useRef(false);
  React.useEffect(() => {
    if (open && !prevOpen.current && initialSlot) {
      setForm(f => ({
        ...f,
        place:    initialSlot.section  ?? f.place,
        table:    initialSlot.table    ?? f.table,
        timeSlot: initialSlot.timeSlot ?? f.timeSlot,
      }));
      if (initialSlot.timeSlot && initialSlot.table) setStep(2);
      else if (initialSlot.timeSlot) setStep(1);
    }
    prevOpen.current = open;
  }, [open]);

  function set<K extends keyof Form>(k: K, v: Form[K]) { setForm(f => ({ ...f, [k]: v })); }
  function toggle<K extends keyof Form>(k: K, val: string) {
    setForm(f => {
      const arr = f[k] as string[];
      return { ...f, [k]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }
  function toggleFile() {
    const names = ["Booking-confirmation.pdf", "Special-menu.pdf", "Deposit-receipt.pdf", "Group-contract.pdf"];
    const next = names[form.files.length % names.length];
    setForm(f => ({ ...f, files: [...f.files, next] }));
  }

  const availTables = useMemo(() =>
    form.timeSlot ? TABLE_MAP[form.place].filter(t => isTableFree(form.place, t, form.timeSlot, form.duration)) : [],
    [form.place, form.timeSlot, form.duration]
  );

  const stepValid = [
    !!form.timeSlot,
    form.table !== null && form.adults > 0,
    form.name.trim() !== "" && form.mobile.trim() !== "",
    true, true,
  ];

  function handleConfirm() {
    setBooked(true);
    setTimeout(() => { setBooked(false); setStep(0); setForm(f => ({ ...f, timeSlot: "", table: null, name: "", mobile: "", email: "", preorders: [], tags: [], internalNote: "", guestText: "", files: [] })); onClose(); }, 2200);
  }
  function handleClose() { setStep(0); setBooked(false); onClose(); }

  const typeMeta = BOOKING_TYPES.find(t => t.id === form.type);
  const langMeta = LANGUAGES.find(l => l.code === form.language);

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(0,0,0,0.5)", pointerEvents: open ? "auto" : "none", opacity: open ? 1 : 0, transition: "opacity 0.2s" }} onClick={handleClose} />

      <div className="fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: 580, maxHeight: "94vh",
          top: "50%", left: "50%",
          transform: open ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(0.96)",
          opacity: open ? 1 : 0,
          transition: "transform 0.2s cubic-bezier(0.34,1.4,0.64,1), opacity 0.15s",
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-gray-900" style={{ fontSize: 16, fontWeight: 700 }}>New Booking</h2>
              <p className="text-gray-500 mt-0.5" style={{ fontSize: 11 }}>{form.date}</p>
            </div>
            <button onClick={handleClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors mt-0.5"><X size={15} /></button>
          </div>
          {/* Step indicators */}
          {!booked && (
            <div className="flex items-center mt-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => i < step && setStep(i)}
                    className="flex items-center gap-1.5 transition-opacity"
                    style={{ opacity: i > step ? 0.4 : 1, cursor: i < step ? "pointer" : "default" }}
                  >
                    <StepDot step={i} current={step} total={STEPS.length} />
                    <span style={{ fontSize: 10.5, fontWeight: i === step ? 700 : 400, color: i === step ? "#065f46" : i < step ? "#10b981" : "#9ca3af" }}>
                      {s}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && <div className="w-3 h-px bg-gray-200 mx-1" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!booked ? (
            <div className="p-5">

              {/* ═══ STEP 0: BOOKING ═══ */}
              {step === 0 && (
                <div className="space-y-5">
                  {/* Place & Type */}
                  <div>
                    <SectionLabel label="Booking details" />
                    <div className="grid grid-cols-2 gap-3">
                      <FieldWrap label="Place" hint="Restaurant section or area">
                        <div className="relative">
                          <MapPin size={12} className="absolute text-gray-400 pointer-events-none" style={{ left: 10, top: "50%", transform: "translateY(-50%)" }} />
                          <select value={form.place} onChange={e => { set("place", e.target.value); set("table", null); }}
                            className="w-full border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-emerald-400 text-gray-700 appearance-none"
                            style={{ paddingLeft: 28, paddingRight: 28, paddingTop: 7, paddingBottom: 7, fontSize: 12 }}>
                            {SECTIONS.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <ChevronDown size={11} className="absolute text-gray-400 pointer-events-none" style={{ right: 9, top: "50%", transform: "translateY(-50%)" }} />
                        </div>
                      </FieldWrap>
                      <FieldWrap label="Type" hint="Type of dining occasion">
                        <div className="relative">
                          <select value={form.type} onChange={e => set("type", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-emerald-400 text-gray-700 appearance-none"
                            style={{ paddingLeft: 10, paddingRight: 28, paddingTop: 7, paddingBottom: 7, fontSize: 12 }}>
                            {BOOKING_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                          </select>
                          <ChevronDown size={11} className="absolute text-gray-400 pointer-events-none" style={{ right: 9, top: "50%", transform: "translateY(-50%)" }} />
                        </div>
                      </FieldWrap>
                    </div>
                  </div>

                  {/* Arrival date */}
                  <FieldWrap label="Arrival" required>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50">
                      <Calendar size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-gray-700" style={{ fontSize: 13, fontWeight: 500 }}>{form.date}</span>
                      <div className="ml-auto flex gap-1">
                        <button className="w-6 h-6 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><ChevronLeft size={13} /></button>
                        <button className="w-6 h-6 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><ChevronRight size={13} /></button>
                      </div>
                    </div>
                  </FieldWrap>

                  {/* Time slots */}
                  <FieldWrap label="Time" required hint="Select the guest's arrival time">
                    {form.timeSlot && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock size={11} className="text-emerald-500" />
                        <span className="text-emerald-700" style={{ fontSize: 11, fontWeight: 600 }}>Selected: {form.timeSlot}</span>
                        <button onClick={() => set("timeSlot", "")} className="text-gray-400 hover:text-gray-600 ml-1"><X size={10} /></button>
                      </div>
                    )}
                    <div className="space-y-2.5">
                      {TIME_SLOTS.map(per => (
                        <div key={per.period}>
                          <div className="text-gray-500 mb-1.5" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{per.period}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {per.slots.map(slot => {
                              const active = form.timeSlot === slot;
                              return (
                                <button key={slot} onClick={() => set("timeSlot", slot)}
                                  className="px-2.5 py-1.5 rounded-lg border-2 transition-all"
                                  style={{ fontSize: 11, fontWeight: active ? 700 : 400, borderColor: active ? per.color : "#e5e7eb", backgroundColor: active ? per.color : "white", color: active ? "white" : "#374151" }}>
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </FieldWrap>

                  {/* Duration */}
                  <FieldWrap label="Duration">
                    <div className="flex flex-wrap gap-1.5">
                      {DURATIONS.map(d => (
                        <button key={d.v} onClick={() => set("duration", d.v)}
                          className="px-3 py-1.5 rounded-lg border-2 transition-all"
                          style={{ fontSize: 11, fontWeight: form.duration === d.v ? 700 : 400, borderColor: form.duration === d.v ? "#10b981" : "#e5e7eb", backgroundColor: form.duration === d.v ? "#f0fdf4" : "white", color: form.duration === d.v ? "#065f46" : "#374151" }}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </FieldWrap>
                </div>
              )}

              {/* ═══ STEP 1: GUESTS & TABLE ═══ */}
              {step === 1 && (
                <div className="space-y-5">
                  <SectionLabel label="Guests & Table" />

                  {/* Guest counts */}
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrap label="Adults" required>
                      <NumberStepper value={form.adults} onChange={v => set("adults", v)} min={1} />
                    </FieldWrap>
                    <FieldWrap label="Children" hint="Children under 12">
                      <NumberStepper value={form.children} onChange={v => set("children", v)} min={0} />
                    </FieldWrap>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100" style={{ fontSize: 12 }}>
                    <span className="text-emerald-700 font-semibold">Total covers: {form.adults + form.children}</span>
                    <span className="text-emerald-600"> ({form.adults} adult{form.adults !== 1 ? "s" : ""}{form.children > 0 ? `, ${form.children} child${form.children !== 1 ? "ren" : ""}` : ""})</span>
                  </div>

                  {/* Table availability info */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldWrap label={`Tables in ${form.place}`} required hint="Tables free at the selected time">
                        <span />
                      </FieldWrap>
                    </div>
                    {!form.timeSlot ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <Info size={13} className="text-amber-500 shrink-0" />
                        <span className="text-amber-700" style={{ fontSize: 11 }}>Select a time slot first to see available tables</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-gray-500 mb-2" style={{ fontSize: 11 }}>
                          {availTables.length} of {TABLE_MAP[form.place].length} tables free at <strong>{form.timeSlot}</strong> for {form.duration} min
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {TABLE_MAP[form.place].map(t => {
                            const free   = availTables.includes(t);
                            const active = form.table === t;
                            return (
                              <button key={t} onClick={() => free && set("table", t)} disabled={!free}
                                className="flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all"
                                style={{ borderColor: active ? "#10b981" : free ? "#d1fae5" : "#f3f4f6", backgroundColor: active ? "#10b981" : free ? "#f0fdf4" : "#f9fafb", cursor: free ? "pointer" : "not-allowed", opacity: free ? 1 : 0.4 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: active ? "white" : free ? "#065f46" : "#9ca3af" }}>T.{t}</span>
                                <span style={{ fontSize: 8.5, color: active ? "rgba(255,255,255,0.8)" : free ? "#059669" : "#9ca3af", marginTop: 2 }}>{active ? "✓ Selected" : free ? "Free" : "Taken"}</span>
                              </button>
                            );
                          })}
                        </div>
                        {form.table && (
                          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-emerald-700" style={{ fontSize: 12, fontWeight: 500 }}>
                              Table {form.table} · {form.place} · {form.timeSlot} for {form.duration} min
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ STEP 2: CONTACT ═══ */}
              {step === 2 && (
                <div className="space-y-4">
                  <SectionLabel label="Guest contact information" />

                  {/* Name */}
                  <FieldWrap label="Name" required>
                    <div className="relative">
                      <User size={12} className="absolute text-gray-400 pointer-events-none" style={{ left: 10, top: "50%", transform: "translateY(-50%)" }} />
                      <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full name"
                        className="w-full border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-emerald-400 text-gray-700"
                        style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13 }} />
                    </div>
                  </FieldWrap>

                  {/* Mobile */}
                  <FieldWrap label="Mobile" required hint="Used for booking confirmation SMS">
                    <div className="flex gap-2">
                      <div className="relative shrink-0" style={{ width: 90 }}>
                        <select value={form.countryCode} onChange={e => set("countryCode", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-emerald-400 text-gray-700 appearance-none"
                          style={{ paddingLeft: 8, paddingRight: 20, paddingTop: 8, paddingBottom: 8, fontSize: 12 }}>
                          {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute text-gray-400 pointer-events-none" style={{ right: 6, top: "50%", transform: "translateY(-50%)" }} />
                      </div>
                      <div className="relative flex-1">
                        <Phone size={12} className="absolute text-gray-400 pointer-events-none" style={{ left: 10, top: "50%", transform: "translateY(-50%)" }} />
                        <input type="tel" value={form.mobile} onChange={e => set("mobile", e.target.value)} placeholder="Phone number"
                          className="w-full border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-emerald-400 text-gray-700"
                          style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 12 }} />
                      </div>
                    </div>
                  </FieldWrap>

                  {/* E-mail */}
                  <FieldWrap label="E-mail" hint="For confirmation email and booking reminder">
                    <div className="relative">
                      <Mail size={12} className="absolute text-gray-400 pointer-events-none" style={{ left: 10, top: "50%", transform: "translateY(-50%)" }} />
                      <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com"
                        className="w-full border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-emerald-400 text-gray-700"
                        style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 12 }} />
                    </div>
                  </FieldWrap>

                  {/* Language */}
                  <FieldWrap label="Language" hint="Guest's preferred language for confirmation messages">
                    <div className="flex flex-wrap gap-1.5">
                      {LANGUAGES.map(l => (
                        <button key={l.code} onClick={() => set("language", l.code)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 transition-all"
                          style={{ fontSize: 11, fontWeight: form.language === l.code ? 700 : 400, borderColor: form.language === l.code ? "#10b981" : "#e5e7eb", backgroundColor: form.language === l.code ? "#f0fdf4" : "white", color: form.language === l.code ? "#065f46" : "#374151" }}>
                          {l.flag} {l.label}
                        </button>
                      ))}
                    </div>
                  </FieldWrap>

                  {/* Another – alternative contact */}
                  <FieldWrap label="Alternative contact" hint="A backup contact person if the primary guest is unreachable (name + phone/email)">
                    <div className="relative">
                      <Users size={12} className="absolute text-gray-400 pointer-events-none" style={{ left: 10, top: "50%", transform: "translateY(-50%)" }} />
                      <input value={form.another} onChange={e => set("another", e.target.value)}
                        placeholder="e.g. Emma Jensen +45 22 33 44 55"
                        className="w-full border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-emerald-400 text-gray-700"
                        style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 12 }} />
                    </div>
                    <p className="text-gray-400 mt-1" style={{ fontSize: 10 }}>Optional — staff will call this person if the primary guest doesn't answer</p>
                  </FieldWrap>
                </div>
              )}

              {/* ═══ STEP 3: PREFERENCES ═══ */}
              {step === 3 && (
                <div className="space-y-5">

                  {/* Preordering */}
                  <div>
                    <SectionLabel label="Preordering" sub="Select which menu or package the guest has pre-booked" />
                    <div className="space-y-1.5">
                      {PREORDER_MENU.map(m => {
                        const active = form.preorders.includes(m.id);
                        return (
                          <button key={m.id} onClick={() => toggle("preorders", m.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                            style={{ borderColor: active ? "#10b981" : "#f3f4f6", backgroundColor: active ? "#f0fdf4" : "white" }}>
                            <span className="text-lg shrink-0">{m.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-800" style={{ fontSize: 12, fontWeight: active ? 700 : 500 }}>{m.name}</span>
                                <span className="text-gray-500" style={{ fontSize: 10.5 }}>{m.desc}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-gray-500" style={{ fontSize: 11, fontWeight: 600 }}>{m.price}</span>
                              {active ? <Check size={14} className="text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <SectionLabel label="Tags" sub="Occasions, dietary needs, guest preferences" />
                    <div className="flex flex-wrap gap-1.5">
                      {OCCASION_TAGS.map(tag => {
                        const active = form.tags.includes(tag.label);
                        return (
                          <button key={tag.label} onClick={() => toggle("tags", tag.label)}
                            className="px-2.5 py-1.5 rounded-full border-2 transition-all"
                            style={{ fontSize: 11, borderColor: active ? tag.color : "#e5e7eb", backgroundColor: active ? tag.color : "white", color: active ? "white" : "#374151" }}>
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Internal note */}
                  <FieldWrap label="Internal note" hint="Staff-only note — NOT sent to the guest">
                    <div className="relative">
                      <StickyNote size={12} className="absolute text-amber-400 pointer-events-none" style={{ left: 10, top: 10 }} />
                      <textarea value={form.internalNote} onChange={e => set("internalNote", e.target.value)}
                        placeholder="Staff notes, kitchen alerts, prep instructions…"
                        className="w-full border border-amber-200 rounded-xl bg-amber-50 focus:outline-none focus:border-amber-400 text-gray-700 resize-none"
                        style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 9, paddingBottom: 9, fontSize: 12, lineHeight: 1.5 }}
                        rows={2} />
                    </div>
                    <p className="text-amber-600 mt-0.5" style={{ fontSize: 10 }}>🔒 Visible to staff only</p>
                  </FieldWrap>

                  {/* Text — guest confirmation message */}
                  <FieldWrap label="Text to guest" hint="This message is included in the booking confirmation sent to the guest">
                    <div className="relative">
                      <MessageSquare size={12} className="absolute text-blue-400 pointer-events-none" style={{ left: 10, top: 10 }} />
                      <textarea value={form.guestText} onChange={e => set("guestText", e.target.value)}
                        placeholder="e.g. 'We look forward to welcoming you. Please let us know of any dietary needs on arrival.'"
                        className="w-full border border-blue-200 rounded-xl bg-blue-50 focus:outline-none focus:border-blue-400 text-gray-700 resize-none"
                        style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 9, paddingBottom: 9, fontSize: 12, lineHeight: 1.5 }}
                        rows={2} />
                    </div>
                    <p className="text-blue-600 mt-0.5" style={{ fontSize: 10 }}>✉️ Included in confirmation email/SMS to guest</p>
                  </FieldWrap>

                  {/* Files */}
                  <div>
                    <SectionLabel label="Files" sub="Menus, deposit receipts, contracts, pre-order forms" />
                    {form.files.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {form.files.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
                            <FileText size={11} className="text-gray-500" />
                            <span className="text-gray-700" style={{ fontSize: 11 }}>{f}</span>
                            <button onClick={() => setForm(prev => ({ ...prev, files: prev.files.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500 ml-1"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={toggleFile}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors"
                      style={{ fontSize: 12 }}>
                      <PaperclipIcon size={14} /> Attach file
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 4: CONFIRM ═══ */}
              {step === 4 && (
                <div className="space-y-3">
                  {/* Summary card */}
                  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 overflow-hidden">
                    {/* Guest name banner */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center" style={{ fontSize: 14, fontWeight: 800, color: "#065f46" }}>
                        {form.name ? form.name.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase() : "?"}
                      </div>
                      <div>
                        <div className="text-white font-bold" style={{ fontSize: 15 }}>{form.name || "—"}</div>
                        <div className="text-emerald-100" style={{ fontSize: 11 }}>
                          {form.countryCode} {form.mobile}{form.email ? ` · ${form.email}` : ""}
                        </div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-white" style={{ fontSize: 11 }}>{langMeta?.flag} {langMeta?.label}</div>
                        {form.another && <div className="text-emerald-200" style={{ fontSize: 10 }}>Alt: {form.another}</div>}
                      </div>
                    </div>
                    {/* Details */}
                    <div className="px-4 py-3 space-y-2">
                      {[
                        { icon: <Calendar size={13} />, label: "Date",    val: form.date },
                        { icon: <Clock size={13} />,    label: "Time",    val: `${form.timeSlot} · ${form.duration} min` },
                        { icon: <MapPin size={13} />,   label: "Table",   val: `${form.place} · Table ${form.table}` },
                        { icon: <Users size={13} />,    label: "Guests",  val: `${form.adults + form.children} total (${form.adults} adult${form.adults !== 1?"s":""}${form.children>0?`, ${form.children} child${form.children!==1?"ren":""}`:""})` },
                        { icon: <Star size={13} />,     label: "Type",    val: `${typeMeta?.icon} ${typeMeta?.label}` },
                      ].map(r => (
                        <div key={r.label} className="flex items-center gap-3">
                          <span className="text-emerald-600 shrink-0">{r.icon}</span>
                          <span className="text-emerald-700 shrink-0" style={{ fontSize: 11, minWidth: 48 }}>{r.label}</span>
                          <span className="text-emerald-900 font-medium" style={{ fontSize: 12 }}>{r.val}</span>
                        </div>
                      ))}
                      {/* Preorders */}
                      {form.preorders.length > 0 && (
                        <div className="flex items-start gap-3 pt-1 border-t border-emerald-200">
                          <span className="text-emerald-600 shrink-0 mt-0.5"><Utensils size={13} /></span>
                          <span className="text-emerald-700 shrink-0" style={{ fontSize: 11, minWidth: 48 }}>Pre-order</span>
                          <div className="flex flex-wrap gap-1">
                            {form.preorders.map(id => {
                              const m = PREORDER_MENU.find(x => x.id === id);
                              return <span key={id} className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800" style={{ fontSize: 10 }}>{m?.icon} {m?.name}</span>;
                            })}
                          </div>
                        </div>
                      )}
                      {/* Tags */}
                      {form.tags.length > 0 && (
                        <div className="flex items-start gap-3 pt-1 border-t border-emerald-200">
                          <span className="text-emerald-600 shrink-0 mt-0.5"><Star size={13} /></span>
                          <span className="text-emerald-700 shrink-0" style={{ fontSize: 11, minWidth: 48 }}>Tags</span>
                          <div className="flex flex-wrap gap-1">
                            {form.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800" style={{ fontSize: 10 }}>{t}</span>)}
                          </div>
                        </div>
                      )}
                      {/* Notes */}
                      {(form.internalNote || form.guestText) && (
                        <div className="pt-1 border-t border-emerald-200 space-y-1">
                          {form.internalNote && <p className="text-amber-700 italic" style={{ fontSize: 10.5 }}>🔒 Staff: "{form.internalNote}"</p>}
                          {form.guestText    && <p className="text-blue-700 italic"  style={{ fontSize: 10.5 }}>✉️ Guest: "{form.guestText}"</p>}
                        </div>
                      )}
                      {/* Files */}
                      {form.files.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-emerald-200">
                          <FileText size={11} className="text-emerald-600" />
                          <span className="text-emerald-700" style={{ fontSize: 10.5 }}>{form.files.length} file{form.files.length !== 1?"s":""} attached</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Send confirmation */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <input type="checkbox" id="send-c" defaultChecked className="accent-emerald-500 w-3.5 h-3.5" />
                    <label htmlFor="send-c" className="text-gray-600 cursor-pointer" style={{ fontSize: 12 }}>
                      Send booking confirmation to guest via {form.email ? "email + SMS" : "SMS"}
                    </label>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Success */
            <div className="flex flex-col items-center justify-center py-14 gap-4 px-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 size={32} color="white" />
              </div>
              <div className="text-center">
                <div className="text-gray-900 font-bold" style={{ fontSize: 17 }}>Booking confirmed! 🎉</div>
                <div className="text-gray-500 mt-1" style={{ fontSize: 13 }}>{form.name} · {form.timeSlot} · {form.place} T.{form.table}</div>
                <div className="text-gray-400 mt-0.5" style={{ fontSize: 11 }}>{form.adults + form.children} guests · {form.duration} min</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!booked && (
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-100 bg-gray-50 shrink-0">
            <button onClick={() => step > 0 ? setStep(s => s - 1) : handleClose()}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              style={{ fontSize: 12 }}>
              <ChevronLeft size={13} /> {step === 0 ? "Cancel" : "Back"}
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!stepValid[step]}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-white transition-all disabled:opacity-35"
                style={{ fontSize: 12, backgroundColor: "#10b981" }}>
                Next <ChevronRight size={13} />
              </button>
            ) : (
              <button onClick={handleConfirm}
                className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-white hover:opacity-90 transition-all"
                style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#10b981" }}>
                <Check size={13} /> Confirm booking
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}