import React, { useState, useMemo } from "react";
import { X, User, Clock, CheckCircle2, Zap, MapPin, Users } from "lucide-react";
import { ALL_BOOKINGS } from "../data/bookings";

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const NOW = "18:00";
const NOW_MIN = timeToMin(NOW);

function isTableFreeNow(section: string, table: number, durationMin: number) {
  const end = NOW_MIN + durationMin;
  return !ALL_BOOKINGS.some(b =>
    b.section === section &&
    b.table === table &&
    timeToMin(b.time) < end &&
    timeToMin(b.endTime) > NOW_MIN
  );
}

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 h",  value: 90 },
];

const SECTIONS = ["Restaurant", "First floor", "Terrace", "Bar"];
const TABLE_RANGES: Record<string, number[]> = {
  "Restaurant":  [1,2,3,4,5,6,7,8,9,10,11],
  "First floor": [1,2,3,4,5,6,7,8,9,10],
  "Terrace":     [1,2,3,4,5],
  "Bar":         [1,2,3,4,5,6,7,8],
};

interface WalkInModalProps {
  open: boolean;
  onClose: () => void;
  initialSlot?: { section?: string; table?: number | null };
}

export function WalkInModal({ open, onClose, initialSlot }: WalkInModalProps) {
  const [guests,   setGuests]   = useState(2);
  const [section,  setSection]  = useState("Restaurant");
  const [table,    setTable]    = useState<number | null>(null);
  const [duration, setDuration] = useState(60);
  const [name,     setName]     = useState("");
  const [seated,   setSeated]   = useState(false);

  // Pre-fill from slot click
  const prevOpen = React.useRef(false);
  React.useEffect(() => {
    if (open && !prevOpen.current && initialSlot) {
      if (initialSlot.section) setSection(initialSlot.section);
      if (initialSlot.table)   setTable(initialSlot.table);
    }
    prevOpen.current = open;
  }, [open]);

  const availableTables = useMemo(() =>
    TABLE_RANGES[section].filter(t => isTableFreeNow(section, t, duration)),
    [section, duration]
  );

  function handleSeat() {
    setSeated(true);
    setTimeout(() => {
      setSeated(false); setGuests(2); setTable(null); setName(""); setSection("Restaurant"); onClose();
    }, 1800);
  }

  function handleClose() {
    setSeated(false);
    onClose();
  }

  const canSeat = table !== null && guests > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 transition-opacity duration-200"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", pointerEvents: open ? "auto" : "none", opacity: open ? 1 : 0 }}
        onClick={handleClose}
      />

      <div
        className="fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: 480, maxHeight: "88vh",
          top: "50%", left: "50%",
          transform: open ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(0.96)",
          opacity: open ? 1 : 0,
          transition: "transform 0.2s cubic-bezier(0.34,1.4,0.64,1), opacity 0.15s",
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#3b82f6" }}>
              <Zap size={16} color="white" />
            </div>
            <div>
              <h2 className="text-blue-900" style={{ fontSize: 16, fontWeight: 700 }}>Walk-in Guest</h2>
              <div className="flex items-center gap-1.5 text-blue-600" style={{ fontSize: 11 }}>
                <Clock size={11} />
                <span>Arrived now · {NOW}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white" style={{ fontSize: 9.5, fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-full hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!seated ? (
            <div className="space-y-5">
              {/* Guest count — BIG */}
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>How many guests?</label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <button
                      key={n}
                      onClick={() => setGuests(n)}
                      className="flex items-center justify-center rounded-xl border-2 transition-all"
                      style={{
                        width: 52, height: 52,
                        fontSize: n <= 9 ? 22 : 16, fontWeight: 700,
                        borderColor: guests === n ? "#3b82f6" : "#e5e7eb",
                        backgroundColor: guests === n ? "#3b82f6" : "white",
                        color: guests === n ? "white" : "#374151",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setGuests(9)}
                    className="flex items-center justify-center rounded-xl border-2 transition-all"
                    style={{
                      width: 52, height: 52, fontSize: 13, fontWeight: 700,
                      borderColor: guests >= 9 ? "#3b82f6" : "#e5e7eb",
                      backgroundColor: guests >= 9 ? "#3b82f6" : "white",
                      color: guests >= 9 ? "white" : "#374151",
                    }}
                  >
                    9+
                  </button>
                </div>
              </div>

              {/* Optional name */}
              <div>
                <label className="block text-gray-600 mb-1" style={{ fontSize: 11, fontWeight: 600 }}>Guest name <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <User size={12} className="absolute text-gray-400" style={{ left: 10, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Leave blank for anonymous walk-in"
                    className="w-full border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-400 text-gray-700"
                    style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 12 }}
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-gray-600 mb-1.5" style={{ fontSize: 11, fontWeight: 600 }}>Expected stay</label>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => { setDuration(d.value); setTable(null); }}
                      className="flex-1 py-2 rounded-lg border-2 transition-all"
                      style={{
                        fontSize: 11, fontWeight: duration === d.value ? 700 : 400,
                        borderColor: duration === d.value ? "#3b82f6" : "#e5e7eb",
                        backgroundColor: duration === d.value ? "#eff6ff" : "white",
                        color: duration === d.value ? "#1d4ed8" : "#374151",
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section */}
              <div>
                <label className="block text-gray-600 mb-1.5" style={{ fontSize: 11, fontWeight: 600 }}>Section</label>
                <div className="flex gap-1.5 flex-wrap">
                  {SECTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => { setSection(s); setTable(null); }}
                      className="px-3 py-1.5 rounded-lg border-2 transition-all"
                      style={{
                        fontSize: 11, fontWeight: section === s ? 700 : 400,
                        borderColor: section === s ? "#3b82f6" : "#e5e7eb",
                        backgroundColor: section === s ? "#eff6ff" : "white",
                        color: section === s ? "#1d4ed8" : "#374151",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available tables — VISUAL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-600" style={{ fontSize: 11, fontWeight: 600 }}>
                    Available tables right now
                  </label>
                  <span className="text-gray-400" style={{ fontSize: 10 }}>
                    {availableTables.length} of {TABLE_RANGES[section].length} free
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {TABLE_RANGES[section].map(t => {
                    const free   = availableTables.includes(t);
                    const active = table === t;
                    return (
                      <button
                        key={t}
                        onClick={() => free && setTable(active ? null : t)}
                        disabled={!free}
                        className="flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all"
                        style={{
                          borderColor: active ? "#3b82f6" : free ? "#bfdbfe" : "#f3f4f6",
                          backgroundColor: active ? "#3b82f6" : free ? "#eff6ff" : "#f9fafb",
                          cursor: free ? "pointer" : "not-allowed",
                          opacity: free ? 1 : 0.4,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, color: active ? "white" : free ? "#1e40af" : "#9ca3af" }}>
                          {t}
                        </span>
                        <span style={{ fontSize: 8.5, color: active ? "rgba(255,255,255,0.8)" : free ? "#3b82f6" : "#9ca3af", marginTop: 1 }}>
                          {active ? "✓" : free ? "free" : "taken"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary strip */}
              {table && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                  <div className="flex-1" style={{ fontSize: 12 }}>
                    <span className="text-blue-800 font-semibold">{name || "Walk-in guest"}</span>
                    <span className="text-blue-600"> · {guests} guests · {section} T.{table} · arriving {NOW} · ~{duration} min</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                <CheckCircle2 size={32} color="white" />
              </div>
              <div className="text-center">
                <div className="text-gray-900 font-bold" style={{ fontSize: 16 }}>Guest seated!</div>
                <div className="text-gray-500 mt-1" style={{ fontSize: 12 }}>
                  {name || "Walk-in"} · {guests} guests · {section} T.{table}
                </div>
                <div className="text-gray-400 mt-0.5" style={{ fontSize: 11 }}>
                  Estimated stay: {duration} min
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!seated && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            <button onClick={handleClose} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" style={{ fontSize: 12 }}>
              Cancel
            </button>
            <button
              onClick={handleSeat}
              disabled={!canSeat}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white transition-all disabled:opacity-40"
              style={{ fontSize: 13, fontWeight: 600, backgroundColor: canSeat ? "#3b82f6" : "#9ca3af" }}
            >
              <Zap size={14} /> Seat guest now
            </button>
          </div>
        )}
      </div>
    </>
  );
}