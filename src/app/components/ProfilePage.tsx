import React, { useState } from "react";
import {
  LayoutGrid, Building2, Clock, Grid3x3, CalendarDays, Tag,
  Layers, User, SlidersHorizontal, Mail, Smartphone, MessageCircle,
  Calendar, CreditCard, ShoppingCart, Code2, Link2, Package,
  ChevronDown, ChevronUp, ChevronLeft, Check, Eye, EyeOff,
} from "lucide-react";

interface ProfilePageProps {
  onBack: () => void;
}

/* ── Left-sidebar nav ── */
interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  expandable?: boolean;
  expanded?: boolean;
  indent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "general",        icon: LayoutGrid,       label: "General",              expandable: true, expanded: false },
  { id: "place",          icon: Building2,         label: "The place" },
  { id: "hours",          icon: Clock,             label: "Opening hours",        expandable: true, expanded: true  },
  { id: "tables",         icon: Grid3x3,           label: "Tables and rooms",     expandable: true, expanded: true  },
  { id: "bsettings",      icon: CalendarDays,      label: "Booking settings" },
  { id: "tags",           icon: Tag,               label: "Tags" },
  { id: "btypes",         icon: Layers,            label: "Booking types" },
  { id: "logins",         icon: User,              label: "Logins" },              // ← active
  { id: "advanced",       icon: SlidersHorizontal, label: "Advanced",             expandable: true, expanded: true  },
  { id: "email-notif",    icon: Mail,              label: "E-mail notifications", indent: true },
  { id: "sms-notif",      icon: Smartphone,        label: "SMS notifications",    indent: true },
  { id: "feedback",       icon: MessageCircle,     label: "Feedback questions",   indent: true },
  { id: "events",         icon: Calendar,          label: "Events",               indent: true },
  { id: "guestpay",       icon: CreditCard,        label: "Guest payment",        indent: true, expandable: true, expanded: false },
  { id: "preordering",    icon: ShoppingCart,      label: "Preordering",          indent: true, expandable: true, expanded: false },
  { id: "implementation", icon: Code2,             label: "Implementation",       indent: true, expandable: true, expanded: false },
  { id: "integrations",   icon: Link2,             label: "Integrations",         indent: true, expandable: true, expanded: false },
  { id: "subscription",   icon: Package,           label: "Subscription",         indent: true },
];

/* ── Language options ── */
const LANGUAGES = ["Dansk", "English", "Norsk", "Svenska", "Deutsch", "Français", "Tiếng Việt"];

export function ProfilePage({ onBack }: ProfilePageProps) {
  const [activeNav, setActiveNav]           = useState("logins");
  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("quangnguyen@norra.ai");
  const [phone, setPhone]                   = useState("");
  const [language, setLanguage]             = useState("Dansk");
  const [managerCode, setManagerCode]       = useState(false);
  const [twoFactor, setTwoFactor]           = useState(false);
  const [showPassForm, setShowPassForm]     = useState(false);
  const [currentPass, setCurrentPass]       = useState("");
  const [newPass, setNewPass]               = useState("");
  const [confirmPass, setConfirmPass]       = useState("");
  const [showCurrent, setShowCurrent]       = useState(false);
  const [showNew, setShowNew]               = useState(false);
  const [saved, setSaved]                   = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div
      className="flex flex-1 overflow-hidden"
      style={{ backgroundColor: "#f0f2f5" }}
    >
      {/* ════════════════════════════════
          LEFT NAV SIDEBAR
      ════════════════════════════════ */}
      <div
        className="shrink-0 overflow-y-auto"
        style={{ width: 230, padding: "14px 10px" }}
      >
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          {NAV_ITEMS.map((item) => {
            const Icon    = item.icon;
            const isActive = item.id === activeNav;
            const ChevronIcon = item.expanded ? ChevronUp : ChevronDown;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left border-b border-gray-50 last:border-0 hover:bg-gray-50"
                style={{
                  paddingLeft: item.indent ? 28 : 12,
                  backgroundColor: isActive ? "#f0fdf9" : undefined,
                }}
              >
                <Icon
                  size={14}
                  style={{ color: isActive ? "#0f9a87" : "#94a3b8", flexShrink: 0 }}
                />
                <span
                  className="flex-1 truncate"
                  style={{
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#0f9a87" : "#374151",
                  }}
                >
                  {item.label}
                </span>
                {item.expandable && (
                  <ChevronIcon
                    size={12}
                    style={{ color: "#cbd5e1", flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════
          MAIN PROFILE FORM
      ════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="bg-white rounded-xl"
          style={{ maxWidth: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          {/* Header */}
          <div className="px-8 pt-7 pb-4 border-b border-gray-100">
            <h1 className="text-gray-900" style={{ fontSize: 22, fontWeight: 600 }}>Profile</h1>
            <button
              onClick={onBack}
              className="flex items-center gap-1 mt-1 transition-colors hover:text-emerald-700"
              style={{ fontSize: 12.5, color: "#10b981" }}
            >
              <ChevronLeft size={13} />
              Back
            </button>
          </div>

          {/* Form */}
          <div className="px-8 py-6 space-y-5">

            {/* Name */}
            <FormRow label="Name:">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none transition focus:border-emerald-400 focus:bg-white"
                style={{ fontSize: 13, color: "#1e293b" }}
              />
            </FormRow>

            {/* E-mail */}
            <FormRow label="E-mail:">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none transition focus:border-emerald-400 focus:bg-white"
                style={{ fontSize: 13, color: "#1e293b" }}
              />
            </FormRow>

            {/* Mobile */}
            <FormRow label="Mobile:">
              <div className="flex items-center gap-0 rounded-md border border-gray-200 bg-gray-50 overflow-hidden focus-within:border-emerald-400 focus-within:bg-white transition">
                {/* Flag + code */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-r border-gray-200 shrink-0 select-none" style={{ backgroundColor: "#f8fafc" }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>🇻🇳</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>+84</span>
                  <ChevronDown size={11} style={{ color: "#94a3b8" }} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="flex-1 bg-transparent px-3 py-1.5 outline-none"
                  style={{ fontSize: 13, color: "#1e293b" }}
                />
              </div>
            </FormRow>

            {/* Language */}
            <FormRow label="Language:">
              <div className="relative" style={{ width: 160 }}>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full appearance-none rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 pr-8 outline-none cursor-pointer transition focus:border-emerald-400 focus:bg-white"
                  style={{ fontSize: 13, color: "#1e293b" }}
                >
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </FormRow>

            {/* Use manager code */}
            <FormRow label="Use manager code:">
              <Checkbox checked={managerCode} onChange={setManagerCode} />
            </FormRow>

            {/* Two-factor login */}
            <FormRow label="Use two-factor login:">
              <Checkbox checked={twoFactor} onChange={setTwoFactor} />
            </FormRow>

            {/* Change Password */}
            <div className="pt-1">
              <button
                onClick={() => setShowPassForm(v => !v)}
                className="flex items-center gap-2 text-white rounded-lg px-4 py-2 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#10b981", fontSize: 13 }}
              >
                Change password
              </button>

              {showPassForm && (
                <div className="mt-4 space-y-4 border border-gray-100 rounded-xl p-5 bg-gray-50">
                  <PasswordField label="Current password:" value={currentPass} onChange={setCurrentPass} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
                  <PasswordField label="New password:"     value={newPass}     onChange={setNewPass}     show={showNew}     onToggle={() => setShowNew(v => !v)} />
                  <PasswordField label="Confirm password:" value={confirmPass} onChange={setConfirmPass} show={showNew}     onToggle={() => setShowNew(v => !v)} />
                  <button
                    className="text-white rounded-lg px-4 py-2 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#10b981", fontSize: 13 }}
                  >
                    Update password
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer — Save */}
          <div className="px-8 py-5 border-t border-gray-100">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 text-white rounded-lg px-5 py-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: saved ? "#059669" : "#10b981",
                fontSize: 13,
              }}
            >
              {saved && <Check size={14} />}
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper: form row ── */
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <label
        className="shrink-0 text-gray-600 pt-1.5"
        style={{ fontSize: 13, width: 160 }}
      >
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/* ── Helper: styled checkbox ── */
function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-5 h-5 rounded flex items-center justify-center transition-all border mt-0.5"
      style={{
        backgroundColor: checked ? "#10b981" : "white",
        borderColor: checked ? "#10b981" : "#d1d5db",
      }}
    >
      {checked && <Check size={11} color="white" strokeWidth={3} />}
    </button>
  );
}

/* ── Helper: password field ── */
function PasswordField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
}) {
  return (
    <FormRow label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-9 outline-none transition focus:border-emerald-400"
          style={{ fontSize: 13 }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </FormRow>
  );
}
