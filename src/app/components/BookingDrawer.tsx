import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, User, Clock, CheckCircle2, Zap, Calendar as CalendarIcon, Users, MapPin, Phone, Mail, ChevronDown, ChevronRight, Tag, MessageSquare, Plus, Globe, UtensilsCrossed, UploadCloud } from "lucide-react";
import { ALL_BOOKINGS } from "../data/bookings";
import type { SlotInfo } from "./Timeline";
import { useLang } from "../context/LanguageContext";

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToTime(m: number) {
  const h = Math.floor(m / 60);
  const min = Math.floor(m % 60);
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const DURATIONS = [
  { label: "45 min", value: 45 },
  { label: "1 h",    value: 60 },
  { label: "1.5 h",  value: 90 },
  { label: "2 h",    value: 120 },
  { label: "2.5 h",  value: 150 },
];

const SECTIONS = ["Restaurant", "First floor", "Terrace", "Bar"];
const TABLE_RANGES: Record<string, number[]> = {
  "Restaurant":  [1,2,3,4,5,6,7,8,9,10,11],
  "First floor": [1,2,3,4,5,6,7,8,9,10],
  "Terrace":     [1,2,3,4,5],
  "Bar":         [1,2,3,4,5,6,7,8],
};

function isTableFree(section: string, table: number, startMin: number, durationMin: number) {
  const endMin = startMin + durationMin;
  return !ALL_BOOKINGS.some(b =>
    b.section === section &&
    b.table === table &&
    timeToMin(b.time) < endMin &&
    timeToMin(b.endTime) > startMin
  );
}

export interface BookingDrawerProps {
  open: boolean;
  onClose: () => void;
  initialType: "walk-in" | "reservation";
  initialSlot?: SlotInfo;
}

export function BookingDrawer({ open, onClose, initialType, initialSlot }: BookingDrawerProps) {
  const { t } = useLang();

  // ── Types ──
  const [type, setType] = useState<"walk-in" | "reservation">(initialType);

  // ── L1: Essentials ──
  const [date,     setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [time,     setTime]     = useState("18:00");
  const [guests,   setGuests]   = useState(2);
  const [duration, setDuration] = useState(type === "walk-in" ? 90 : 120);
  const [section,  setSection]  = useState("Restaurant");
  const [selectedTables, setSelectedTables] = useState<{section: string; table: number}[]>([]);

  // ── L2: Guest Details & Extras ──
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preorder, setPreorder] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [internalNote, setInternalNote] = useState("");
  const [tags,    setTags]    = useState<string[]>([]);

  // ── Status ──
  const [success, setSuccess] = useState(false);

  // ── Initialization ──
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setType(initialType);
      
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();

      if (initialType === "walk-in") {
        setTime(minToTime(currentMin));
        setDuration(90);
      } else {
        if (initialSlot?.timeSlot) {
          setTime(initialSlot.timeSlot);
        } else {
          // round to next 15/30 min if no slot selected
          setTime(minToTime(Math.ceil(currentMin / 30) * 30));
        }
        setDuration(120);
      }
      
      if (initialSlot?.section) setSection(initialSlot.section);
      if (initialSlot?.table) {
        setSelectedTables([
          { section: initialSlot.section, table: initialSlot.table },
          ...(initialSlot.additionalTables || [])
        ]);
      } else {
        setSelectedTables([]);
      }

      // Reset others
      setGuests(2);
      setName(""); setPhone(""); setEmail("");
      setPreorder(""); setFiles([]);
      setInternalNote(""); setTags([]);
      setSuccess(false);
    }
    prevOpen.current = open;
  }, [open, initialType, initialSlot]);

  // Handle table availability
  const startMin = timeToMin(time);
  const availableTables = useMemo(() =>
    TABLE_RANGES[section].filter(t => isTableFree(section, t, startMin, duration)),
  [section, startMin, duration]);

  useEffect(() => {
    // If table selected is no longer free, clear selection
    if (selectedTables.length > 0) {
      const stillFree = selectedTables.filter(st => isTableFree(st.section, st.table, startMin, duration));
      if (stillFree.length !== selectedTables.length) setSelectedTables(stillFree);
    }
  }, [availableTables, selectedTables, startMin, duration]);

  // Auto-assign logic
  function autoAssign() {
    if (availableTables.length > 0) setSelectedTables([{ section, table: availableTables[0] }]);
  }

  function handleSave() {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1800);
  }

  const canSubmit = selectedTables.length > 0 && guests > 0 && time !== "";

  // ── Form Components ──
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-gray-500 mb-1.5" style={{ fontSize: 11, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
  
  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-emerald-400 bg-white transition-colors";
  
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{ backgroundColor: "rgba(0,0,0,0.4)", pointerEvents: open ? "auto" : "none", opacity: open ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed z-50 bg-white shadow-2xl rounded-2xl flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
        style={{ 
          width: "90vw", maxWidth: 960, maxHeight: "90vh",
          top: "50%", left: "50%",
          transform: open ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -48%) scale(0.96)",
          opacity: open ? 1 : 0, 
          pointerEvents: open ? "auto" : "none" 
        }}>
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
          {/* Type Toggle */}
          <div className="flex bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setType("walk-in")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded disabled:opacity-50 transition-all ${type === "walk-in" ? "bg-white shadow-sm text-blue-600 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
              style={{ fontSize: 13 }}
            >
              <Zap size={13} /> {t.slot.walkIn ?? "Walk-in"}
            </button>
            <button
              onClick={() => setType("reservation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded disabled:opacity-50 transition-all ${type === "reservation" ? "bg-white shadow-sm text-emerald-600 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
              style={{ fontSize: 13 }}
            >
              <CalendarIcon size={13} /> {t.slot.newBooking ?? "Reservation"}
            </button>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 relative">
          {!success ? (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
                {/* ── Left Column: L1 The Essentials ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                    <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex justify-center items-center"><Zap size={11} strokeWidth={3} /></span>
                    <h3 className="text-gray-800 font-bold" style={{ fontSize: 14 }}>The Essentials</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label={type === "walk-in" ? "Arrival Time" : "Arrival Date & Time"}>
                      <div className="flex gap-2 w-full">
                         {type === "reservation" && <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${inputClass} flex-1 min-w-0`} style={{ fontSize: 13, padding: "8px 10px" }} />}
                         <input type="time" value={time} onChange={e => setTime(e.target.value)} className={`${inputClass} flex-1 min-w-0`} style={{ fontSize: 13, padding: "8px 10px" }} />
                      </div>
                    </Field>
                    <Field label="Guests">
                      <div className="flex items-center w-full">
                        <button onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-10 h-10 rounded-l-lg border border-gray-200 border-r-0 flex items-center justify-center text-gray-500 hover:bg-gray-50 shrink-0 bg-white">
                          <span style={{ fontSize: 18, lineHeight: 1 }}>−</span>
                        </button>
                        <input type="number" min={1} value={guests} onChange={e => { const val = parseInt(e.target.value, 10); if (!isNaN(val) && val >= 1) setGuests(val); else if (e.target.value === "") setGuests(0); }}
                          onBlur={() => { if (guests < 1) setGuests(1); }}
                          className={`w-12 min-w-0 flex-1 border border-gray-200 px-2 text-center text-gray-800 focus:outline-none focus:border-emerald-400 focus:z-10 relative bg-white`} 
                          style={{ fontSize: 14, fontWeight: 600, height: 40 }} />
                        <button onClick={() => setGuests(g => g + 1)} className="w-10 h-10 rounded-r-lg border border-gray-200 border-l-0 flex items-center justify-center text-gray-500 hover:bg-gray-50 shrink-0 bg-white">
                          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
                        </button>
                      </div>
                    </Field>
                  </div>

                  <Field label="Duration">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full">
                      {DURATIONS.map(d => (
                        <button key={d.value} onClick={() => setDuration(d.value)}
                          className={`flex-1 min-w-[64px] shrink-0 px-2 py-2 rounded-lg border transition-colors`}
                          style={{ fontSize: 12, fontWeight: duration === d.value ? 600 : 500, borderColor: duration === d.value ? "#3b82f6" : "#e5e7eb", backgroundColor: duration === d.value ? "#eff6ff" : "white", color: duration === d.value ? "#1d4ed8" : "#4b5563" }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Section & Table">
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full">
                        {SECTIONS.map(s => (
                          <button key={s} onClick={() => { setSection(s); }}
                            className={`flex-1 min-w-[80px] shrink-0 px-3 py-2 rounded-lg border transition-colors`}
                            style={{ fontSize: 12, fontWeight: section === s ? 600 : 500, borderColor: section === s ? "#d1d5db" : "transparent", backgroundColor: section === s ? "#f3f4f6" : "transparent", color: section === s ? "#111827" : "#6b7280" }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      
                      {/* Visual Table Grid */}
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-wrap gap-2">
                        <button onClick={autoAssign} className="flex-1 min-w-[70px] flex flex-col items-center justify-center py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-colors group">
                          <span className="text-gray-500 group-hover:text-emerald-600 font-bold" style={{ fontSize: 12 }}>Auto</span>
                          <span className="text-gray-400 group-hover:text-emerald-500" style={{ fontSize: 10 }}>assign</span>
                        </button>
                        {TABLE_RANGES[section].map(t => {
                          const free = availableTables.includes(t);
                          const active = selectedTables.some(st => st.section === section && st.table === t);
                          return (
                            <button key={t} onClick={() => {
                               if (free) {
                                 setSelectedTables(prev => active 
                                   ? prev.filter(st => !(st.section === section && st.table === t))
                                   : [...prev, { section, table: t }]
                                 );
                               }
                            }} disabled={!free}
                              className={`w-[52px] py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${!free ? "opacity-30 cursor-not-allowed bg-gray-100 border-gray-200" : active ? "bg-emerald-500 border-emerald-600 text-white shadow-sm" : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700"}`}
                            >
                              <span style={{ fontSize: 13, fontWeight: 700 }}>T.{t}</span>
                            </button>
                          );
                        })}
                      </div>
                      {selectedTables.length > 0 && (
                        <div className="text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg" style={{ fontSize: 12, fontWeight: 600 }}>
                          {selectedTables.length} table(s) selected: {selectedTables.map(st => `T.${st.table}`).join(", ")}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                {/* ── Right Column: Dynamic Additional Fields ── */}
                <div className="space-y-6">
                  
                  {type === "reservation" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                        <span className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 flex justify-center items-center"><User size={11} strokeWidth={3} /></span>
                        <h3 className="text-gray-800 font-bold" style={{ fontSize: 14 }}>Guest Details</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <Field label="Phone Look-up">
                          <div className="relative">
                            <Phone size={14} className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                            <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} style={{ paddingLeft: 34, fontSize: 13 }} placeholder="+1..." />
                          </div>
                        </Field>
                        <Field label="Full Name">
                          <input value={name} onChange={e => setName(e.target.value)} className={inputClass} style={{ fontSize: 13 }} placeholder="Required for CRM" />
                        </Field>
                        <Field label="Email">
                          <div className="relative">
                            <Mail size={14} className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputClass} style={{ paddingLeft: 34, fontSize: 13 }} placeholder="Guest email address" />
                          </div>
                        </Field>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                      <span className="w-5 h-5 rounded-md bg-orange-50 text-orange-600 flex justify-center items-center"><MessageSquare size={11} strokeWidth={3} /></span>
                      <h3 className="text-gray-800 font-bold" style={{ fontSize: 14 }}>Options & Notes</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {type === "reservation" && (
                        <Field label="Preordering">
                          <div className="relative">
                            <UtensilsCrossed size={14} className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                            <select value={preorder} onChange={e => setPreorder(e.target.value)} className={inputClass} style={{ paddingLeft: 34, fontSize: 13 }}>
                              <option value="">No Pre-order</option>
                              <option value="set-a">Set Menu A</option>
                              <option value="set-b">Set Menu B</option>
                              <option value="custom">A La Carte Custom</option>
                            </select>
                          </div>
                        </Field>
                      )}
                    </div>
                    
                    {type === "reservation" && (
                      <Field label="Files & Attachments">
                        <button className="w-full h-16 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 hover:border-emerald-300 transition-colors">
                          <UploadCloud size={16} />
                          <span style={{ fontSize: 13, fontWeight: 500 }}>Click or drag files to upload</span>
                        </button>
                      </Field>
                    )}

                    <Field label="Internal Note">
                      <textarea value={internalNote} onChange={e => setInternalNote(e.target.value)} className={inputClass} style={{ fontSize: 13, minHeight: 70, resize: "none" }} placeholder="Dietary restrictions, allergies, internal tracking remarks..." />
                    </Field>

                    <Field label="Quick Tags">
                       <div className="flex flex-wrap gap-2">
                          {["VIP", "Window Seat", "Birthday", "Anniversary", "Quiet", "Allergy"].map(tag => {
                            const active = tags.includes(tag);
                            return (
                              <button key={tag} onClick={() => setTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                                className={`px-2.5 py-1.5 rounded-lg border transition-all ${active ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"}`}
                                style={{ fontSize: 11, fontWeight: active ? 600 : 500 }}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                    </Field>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-gray-900 font-bold mb-2" style={{ fontSize: 20 }}>
                {type === "walk-in" ? "Guest Seated!" : "Reservation Confirmed!"}
              </h2>
              <p className="text-gray-500 mb-6" style={{ fontSize: 14, lineHeight: 1.5 }}>
                {name || "Walk-in Guest"} · {guests} guests<br />
                {time} · {duration} min · {selectedTables.length > 0 ? `T.${selectedTables[0].table}` + (selectedTables.length > 1 ? ` (+${selectedTables.length - 1} more)` : "") : "No table"}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!success && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors" style={{ fontSize: 13 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={!canSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ fontSize: 13, backgroundColor: type === "walk-in" ? "#3b82f6" : "#10b981" }}
            >
              {type === "walk-in" ? <Zap size={14} /> : <CheckCircle2 size={14} />}
              {type === "walk-in" ? "Seat Now" : "Create Booking"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
