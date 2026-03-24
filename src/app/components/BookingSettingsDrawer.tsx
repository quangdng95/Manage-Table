import React, { useState } from "react";
import {
  X, Sun, Utensils, Moon, ChevronDown, ChevronRight,
  Check, AlertCircle, Bell, Users, Calendar, Clock,
  CreditCard, Info, Shield, Zap,
} from "lucide-react";

interface BookingSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

// ── Shared UI Primitives ────────────────────────────────────

function Toggle({ checked, onChange, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? 32 : 38;
  const h = size === "sm" ? 18 : 22;
  const thumb = size === "sm" ? 12 : 16;
  const travel = size === "sm" ? 13 : 15;
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none"
      style={{ width: w, height: h, backgroundColor: checked ? "#10b981" : "#d1d5db" }}
    >
      <span
        className="inline-block rounded-full bg-white shadow transition-transform duration-200"
        style={{
          width: thumb, height: thumb,
          marginTop: (h - thumb) / 2,
          transform: checked ? `translateX(${travel}px)` : `translateX(${(h - thumb) / 2}px)`,
        }}
      />
    </button>
  );
}

function NumberStepper({ value, onChange, min = 0, max = 999, unit }: { value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border-r border-gray-200 transition-colors select-none"
          style={{ fontSize: 15, lineHeight: 1 }}
        >−</button>
        <span className="w-10 text-center text-gray-800 py-1" style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border-l border-gray-200 transition-colors select-none"
          style={{ fontSize: 15, lineHeight: 1 }}
        >+</button>
      </div>
      {unit && <span className="text-gray-500" style={{ fontSize: 12 }}>{unit}</span>}
    </div>
  );
}

function Section({ icon, title, subtitle, children, defaultOpen = true }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-gray-800" style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
          {subtitle && <div className="text-gray-500" style={{ fontSize: 11 }}>{subtitle}</div>}
        </div>
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <div className="text-gray-700" style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
        {hint && <div className="text-gray-400" style={{ fontSize: 11 }}>{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SelectBox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 pr-7 text-gray-700 bg-white focus:outline-none focus:border-emerald-400 appearance-none cursor-pointer"
        style={{ fontSize: 12 }}
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

interface PeriodConfig { enabled: boolean; from: string; to: string; capacity: number; }

interface Settings {
  bookingOpen: boolean;
  closedUntil: string;
  periods: { morning: PeriodConfig; lunch: PeriodConfig; evening: PeriodConfig };
  minParty: number;
  maxParty: number;
  slotDuration: number;
  bookingWindowDays: number;
  minNoticeHours: number;
  autoConfirm: boolean;
  requirePhone: boolean;
  requireDeposit: boolean;
  depositAmount: number;
  depositType: string;
  sendConfirmation: boolean;
  reminderEnabled: boolean;
  reminderHours: number;
  noShowAlert: boolean;
  waitlistEnabled: boolean;
}

export function BookingSettingsDrawer({ open, onClose }: BookingSettingsDrawerProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    bookingOpen: true,
    closedUntil: "Dec 25, 2025",
    periods: {
      morning: { enabled: true,  from: "07:00", to: "12:00", capacity: 20 },
      lunch:   { enabled: true,  from: "12:00", to: "16:00", capacity: 30 },
      evening: { enabled: true,  from: "17:00", to: "22:00", capacity: 40 },
    },
    minParty: 1,
    maxParty: 20,
    slotDuration: 15,
    bookingWindowDays: 90,
    minNoticeHours: 2,
    autoConfirm: true,
    requirePhone: true,
    requireDeposit: false,
    depositAmount: 50,
    depositType: "Per person",
    sendConfirmation: true,
    reminderEnabled: true,
    reminderHours: 24,
    noShowAlert: true,
    waitlistEnabled: true,
  });

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setSettings(s => ({ ...s, [key]: val }));
  }
  function setPeriod(p: "morning" | "lunch" | "evening", key: keyof PeriodConfig, val: any) {
    setSettings(s => ({ ...s, periods: { ...s.periods, [p]: { ...s.periods[p], [key]: val } } }));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 900); }, 1200);
  }

  const PERIOD_META = [
    { key: "morning" as const, label: "Morning",  Icon: Sun,      color: "#b45309", bg: "#fffbeb" },
    { key: "lunch"   as const, label: "Lunch",    Icon: Utensils, color: "#c2410c", bg: "#fff7ed" },
    { key: "evening" as const, label: "Evening",  Icon: Moon,     color: "#0f766e", bg: "#f0fdfa" },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ backgroundColor: open ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)", pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 bg-white shadow-2xl flex flex-col"
        style={{
          width: 420,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: 15, fontWeight: 700 }}>Booking Settings</h2>
            <p className="text-gray-500" style={{ fontSize: 11 }}>Pasta Mia · Configure availability &amp; rules</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500">
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ① Status */}
          <Section icon={<Zap size={14} className="text-emerald-600" />} title="Booking status" subtitle="Control online availability">
            <div
              className="flex items-center justify-between p-3 rounded-xl border-2 transition-all"
              style={{ borderColor: settings.bookingOpen ? "#10b981" : "#f87171", backgroundColor: settings.bookingOpen ? "#f0fdf4" : "#fef2f2" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: settings.bookingOpen ? "#10b981" : "#ef4444" }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: settings.bookingOpen ? "#065f46" : "#991b1b" }}>
                    {settings.bookingOpen ? "Booking åben" : "Booking lukket"}
                  </div>
                  <div style={{ fontSize: 11, color: settings.bookingOpen ? "#047857" : "#b91c1c" }}>
                    {settings.bookingOpen ? "Guests can book online right now" : "No new online bookings accepted"}
                  </div>
                </div>
              </div>
              <Toggle checked={settings.bookingOpen} onChange={v => set("bookingOpen", v)} />
            </div>
            {!settings.bookingOpen && (
              <Row label="Reopen automatically on" hint="Leave empty to reopen manually">
                <SelectBox value={settings.closedUntil} onChange={v => set("closedUntil", v)}
                  options={["Manually", "Dec 25, 2025", "Jan 1, 2026", "Jan 8, 2026"]} />
              </Row>
            )}
            <Row label="Waitlist when full" hint="Accept guests on a waitlist">
              <Toggle checked={settings.waitlistEnabled} onChange={v => set("waitlistEnabled", v)} size="sm" />
            </Row>
          </Section>

          {/* ② Service periods */}
          <Section icon={<Clock size={14} className="text-blue-500" />} title="Service periods" subtitle="Set open hours per meal period">
            {PERIOD_META.map(({ key, label, Icon, color, bg }) => {
              const p = settings.periods[key];
              return (
                <div key={key} className="rounded-xl border border-gray-100 overflow-hidden" style={{ backgroundColor: p.enabled ? bg : "#f9fafb" }}>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Icon size={13} style={{ color: p.enabled ? color : "#9ca3af" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: p.enabled ? color : "#9ca3af" }}>{label}</span>
                    </div>
                    <Toggle checked={p.enabled} onChange={v => setPeriod(key, "enabled", v)} size="sm" />
                  </div>
                  {p.enabled && (
                    <div className="px-3 pb-3 space-y-2 border-t border-white/60">
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="time"
                          value={p.from}
                          onChange={e => setPeriod(key, "from", e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none"
                          style={{ fontSize: 12, width: 88 }}
                        />
                        <span className="text-gray-400" style={{ fontSize: 11 }}>to</span>
                        <input
                          type="time"
                          value={p.to}
                          onChange={e => setPeriod(key, "to", e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none"
                          style={{ fontSize: 12, width: 88 }}
                        />
                      </div>
                      <Row label="Max guests per slot" >
                        <NumberStepper value={p.capacity} onChange={v => setPeriod(key, "capacity", v)} min={1} max={200} />
                      </Row>
                    </div>
                  )}
                </div>
              );
            })}
          </Section>

          {/* ③ Booking rules */}
          <Section icon={<Users size={14} className="text-purple-500" />} title="Party &amp; booking rules" subtitle="Party sizes and advance booking">
            <Row label="Min. party size">
              <NumberStepper value={settings.minParty} onChange={v => set("minParty", v)} min={1} max={50} unit="guests" />
            </Row>
            <Row label="Max. party size">
              <NumberStepper value={settings.maxParty} onChange={v => set("maxParty", v)} min={1} max={200} unit="guests" />
            </Row>
            <Row label="Slot duration">
              <SelectBox value={`${settings.slotDuration} min`} onChange={v => set("slotDuration", parseInt(v))}
                options={["15 min", "30 min", "60 min"]} />
            </Row>
            <Row label="Book up to" hint="How far in advance guests can book">
              <SelectBox value={`${settings.bookingWindowDays} days`} onChange={v => set("bookingWindowDays", parseInt(v))}
                options={["30 days", "60 days", "90 days", "180 days", "365 days"]} />
            </Row>
            <Row label="Min. notice required" hint="Cut-off before booking start">
              <SelectBox value={`${settings.minNoticeHours} hours`} onChange={v => set("minNoticeHours", parseInt(v))}
                options={["1 hour", "2 hours", "4 hours", "24 hours", "48 hours"]} />
            </Row>
          </Section>

          {/* ④ Confirmation & payment */}
          <Section icon={<CreditCard size={14} className="text-amber-500" />} title="Confirmation &amp; deposit" subtitle="Auto-confirm and payment rules" defaultOpen={false}>
            <Row label="Auto-confirm bookings" hint="Skip manual approval">
              <Toggle checked={settings.autoConfirm} onChange={v => set("autoConfirm", v)} size="sm" />
            </Row>
            <Row label="Require phone number">
              <Toggle checked={settings.requirePhone} onChange={v => set("requirePhone", v)} size="sm" />
            </Row>
            <Row label="Require deposit">
              <Toggle checked={settings.requireDeposit} onChange={v => set("requireDeposit", v)} size="sm" />
            </Row>
            {settings.requireDeposit && (
              <>
                <Row label="Deposit amount">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500" style={{ fontSize: 12 }}>₫</span>
                    <NumberStepper value={settings.depositAmount} onChange={v => set("depositAmount", v)} min={50000} max={5000000} unit="" />
                  </div>
                </Row>
                <Row label="Deposit per">
                  <SelectBox value={settings.depositType} onChange={v => set("depositType", v)}
                    options={["Per person", "Per booking", "Fixed amount"]} />
                </Row>
              </>
            )}
          </Section>

          {/* ⑤ Notifications */}
          <Section icon={<Bell size={14} className="text-rose-500" />} title="Notifications &amp; reminders" subtitle="Automated guest communication" defaultOpen={false}>
            <Row label="Send confirmation email">
              <Toggle checked={settings.sendConfirmation} onChange={v => set("sendConfirmation", v)} size="sm" />
            </Row>
            <Row label="Reminder before visit">
              <Toggle checked={settings.reminderEnabled} onChange={v => set("reminderEnabled", v)} size="sm" />
            </Row>
            {settings.reminderEnabled && (
              <Row label="Remind guests" hint="before their booking time">
                <SelectBox value={`${settings.reminderHours} hours`} onChange={v => set("reminderHours", parseInt(v))}
                  options={["2 hours", "4 hours", "12 hours", "24 hours", "48 hours"]} />
              </Row>
            )}
            <Row label="No-show alerts" hint="Get notified if guests don't arrive">
              <Toggle checked={settings.noShowAlert} onChange={v => set("noShowAlert", v)} size="sm" />
            </Row>
          </Section>

          {/* Info note */}
          <div className="mx-5 my-4 flex gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-blue-700" style={{ fontSize: 11, lineHeight: 1.5 }}>
              Changes apply to all new bookings. Existing confirmed bookings are not affected. Guests already on the waitlist will be notified if availability opens.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center gap-1.5 text-gray-500" style={{ fontSize: 11 }}>
            <Shield size={12} />
            Changes save instantly
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              style={{ fontSize: 12 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-white transition-all"
              style={{ fontSize: 12, backgroundColor: saved ? "#059669" : "#10b981", minWidth: 110 }}
            >
              {saved ? (
                <><Check size={13} /> Saved!</>
              ) : saving ? (
                <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Saving…</>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
