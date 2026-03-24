import React, { useState } from "react";
import {
  /* General group child icons */
  FolderOpen,
  Building2,
  CalendarCheck,
  Tag,
  LayoutList,
  Users,
  /* Standalone + top-level group icons (matching image) */
  Mail,
  MessageCircle,
  HelpCircle,
  CalendarDays,
  CreditCard,
  ShoppingCart,
  Code2,
  RefreshCcw,
  BadgeCheck,
  /* Guest payment children */
  AlignJustify,
  Link2,
  /* Preordering children */
  Package,
  ArrowUpDown,
  ClipboardList,
  /* Implementation children */
  LayoutTemplate,
  /* Integrations children */
  Megaphone,
  Globe,
  Flag,
  Infinity,
  Star,
  Share2,
  /* UI */
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  Phone,
  SlidersHorizontal,
} from "lucide-react";

export type SettingsView = "profile" | "settings";
interface SettingsPageProps {
  initialView: SettingsView;
  onBack: () => void;
}

/* ══════════════════════════════════════════════
   DATA TYPES
══════════════════════════════════════════════ */
interface SubItem {
  id: string;
  label: string;
}
interface GroupItem {
  id: string;
  icon: React.ElementType;
  label: string;
  children?: SubItem[]; // 3rd-level (only some items inside General)
}
type SidebarEntry =
  | {
      kind: "standalone";
      id: string;
      icon: React.ElementType;
      label: string;
    }
  | {
      kind: "group";
      id: string;
      icon: React.ElementType;
      label: string;
      items: GroupItem[];
    };

/* Shared icon colour — matches the blue-slate in the image */
const IC = "#5b7ba8";

/* ══════════════════════════════════════════════
   SIDEBAR DATA
══════════════════════════════════════════════ */
const SIDEBAR_ENTRIES: SidebarEntry[] = [
  /* ── General (group) ── */
  {
    kind: "group",
    id: "general-group",
    icon: FolderOpen,
    label: "General",
    items: [
      { id: "the-place", icon: Building2, label: "The place" },
      {
        id: "hours",
        icon: FolderOpen,
        label: "Opening hours",
        children: [
          { id: "gen-hours", label: "General opening hours" },
          { id: "special", label: "Special periods" },
          { id: "cutoff", label: "Cut-off time" },
        ],
      },
      {
        id: "tables",
        icon: FolderOpen,
        label: "Tables and rooms",
        children: [
          { id: "rooms", label: "Rooms" },
          { id: "tables-t", label: "Tables" },
          { id: "combined", label: "Combined tables" },
          { id: "tableplan", label: "Table plan" },
        ],
      },
      {
        id: "bsettings",
        icon: CalendarCheck,
        label: "Booking settings",
      },
      { id: "tags", icon: Tag, label: "Tags" },
      {
        id: "btypes",
        icon: LayoutList,
        label: "Booking types",
      },
      { id: "logins", icon: Users, label: "Logins" },
      {
        id: "advanced",
        icon: FolderOpen,
        label: "Advanced",
        children: [
          { id: "seatings", label: "Seatings" },
          { id: "periodic", label: "Periodic criteria" },
          { id: "custom-fields", label: "Custom Fields" },
          { id: "booking-agents", label: "Booking agents" },
        ],
      },
    ],
  },

  /* ── Standalone items ── */
  {
    kind: "standalone",
    id: "email-notif",
    icon: Mail,
    label: "E-mail notifications",
  },
  {
    kind: "standalone",
    id: "sms-notif",
    icon: MessageCircle,
    label: "SMS notifications",
  },
  {
    kind: "standalone",
    id: "feedback",
    icon: HelpCircle,
    label: "Feedback questions",
  },
  {
    kind: "standalone",
    id: "events",
    icon: CalendarDays,
    label: "Events",
  },

  /* ── Guest payment (group) ── */
  {
    kind: "group",
    id: "guest-payment",
    icon: CreditCard,
    label: "Guest payment",
    items: [
      {
        id: "payment-setups",
        icon: AlignJustify,
        label: "Payment setups",
      },
      {
        id: "payment-gateway",
        icon: Link2,
        label: "Payment Gateway",
      },
    ],
  },

  /* ── Preordering (group) ── */
  {
    kind: "group",
    id: "preordering",
    icon: ShoppingCart,
    label: "Preordering",
    items: [
      { id: "products", icon: Package, label: "Products" },
      { id: "sections", icon: ArrowUpDown, label: "Sections" },
      {
        id: "preorder-setup",
        icon: ClipboardList,
        label: "Preorder setups",
      },
    ],
  },

  /* ── Implementation (group) ── */
  {
    kind: "group",
    id: "implementation",
    icon: Code2,
    label: "Implementation",
    items: [
      {
        id: "booking-link",
        icon: Link2,
        label: "Booking link and code",
      },
      {
        id: "customize-page",
        icon: LayoutTemplate,
        label: "Customize booking page",
      },
    ],
  },

  /* ── Integrations (group) ── */
  {
    kind: "group",
    id: "integrations",
    icon: RefreshCcw,
    label: "Integrations",
    items: [
      {
        id: "activecampaign",
        icon: Megaphone,
        label: "ActiveCampaign",
      },
      { id: "google", icon: Globe, label: "Google" },
      { id: "klaviyo", icon: Flag, label: "Klaviyo" },
      { id: "mailchimp", icon: Mail, label: "Mailchimp" },
      {
        id: "meta",
        icon: Infinity,
        label: "Meta (Facebook & Instagram)",
      },
      { id: "michelin", icon: Star, label: "Michelin Guide" },
      { id: "webhooks", icon: Share2, label: "Webhooks" },
    ],
  },

  /* ── Subscription (standalone) ── */
  {
    kind: "standalone",
    id: "subscription",
    icon: BadgeCheck,
    label: "Subscription",
  },
];

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export function SettingsPage({
  initialView,
  onBack,
}: SettingsPageProps) {
  const defaultNav =
    initialView === "profile" ? "logins" : "the-place";

  const [activeNav, setActiveNav] = useState(defaultNav);

  /* Group expanded state — all collapsed by default (^ = closed) */
  const [groupOpen, setGroupOpen] = useState<
    Record<string, boolean>
  >({
    "general-group": false,
    "guest-payment": false,
    preordering: false,
    implementation: false,
    integrations: false,
  });

  /* Expanded items with children INSIDE the General accordion */
  const [itemOpen, setItemOpen] = useState<
    Record<string, boolean>
  >({
    hours: false,
    tables: false,
    advanced: false,
  });

  const toggleGroup = (id: string) =>
    setGroupOpen((p) => ({ ...p, [id]: !p[id] }));
  const toggleItem = (id: string) =>
    setItemOpen((p) => ({ ...p, [id]: !p[id] }));

  /* Accent bg for expanded accordion sections */
  const OPEN_BG = "#eaeff8";
  const HOVER_BG = "#f0f4fb";

  return (
    <div
      className="flex flex-1 overflow-hidden"
      style={{ backgroundColor: "#f0f2f5" }}
    >
      {/* ══════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════ */}
      <div
        className="shrink-0 overflow-y-auto"
        style={{ width: 260, padding: "14px 12px" }}
      >
        {/* ── Single white container for ALL items ── */}
        <div
          className="rounded-2xl overflow-hidden bg-white"
          style={{
            border: "1px solid #dde3ef",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {SIDEBAR_ENTRIES.map((entry, idx) => {
            const isLast = idx === SIDEBAR_ENTRIES.length - 1;

            /* ── Standalone row ── */
            if (entry.kind === "standalone") {
              const Icon = entry.icon;
              const isActive = activeNav === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => setActiveNav(entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? "#eaf7f4"
                      : "white",
                    borderBottom: isLast
                      ? "none"
                      : "1px solid #f0f3f9",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (
                        e.currentTarget as HTMLElement
                      ).style.backgroundColor = HOVER_BG;
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.backgroundColor = isActive
                      ? "#eaf7f4"
                      : "white";
                  }}
                >
                  <Icon
                    size={17}
                    style={{
                      color: isActive ? "#0f9a87" : IC,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 400,
                      color: isActive ? "#0f9a87" : "#2d3f58",
                    }}
                  >
                    {entry.label}
                  </span>
                </button>
              );
            }

            /* ── Group (accordion) ── */
            const GroupIcon = entry.icon;
            const isOpen = groupOpen[entry.id] ?? false;
            /* ^ = collapsed, v = expanded — matches image convention */
            const Chevron = isOpen ? ChevronDown : ChevronUp;
            const headerBg = isOpen ? OPEN_BG : "white";

            return (
              <div
                key={entry.id}
                style={{
                  borderBottom: isLast
                    ? "none"
                    : "1px solid #f0f3f9",
                }}
              >
                {/* Group header row */}
                <button
                  onClick={() => toggleGroup(entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ backgroundColor: headerBg }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.backgroundColor = isOpen
                      ? OPEN_BG
                      : HOVER_BG;
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.backgroundColor = headerBg;
                  }}
                >
                  <GroupIcon
                    size={17}
                    style={{ color: IC, flexShrink: 0 }}
                  />
                  <span
                    className="flex-1"
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "#2d3f58",
                    }}
                  >
                    {entry.label}
                  </span>
                  <Chevron
                    size={14}
                    style={{ color: "#8fa3bf", flexShrink: 0 }}
                  />
                </button>

                {/* Expanded children — same accent background */}
                {isOpen &&
                  entry.items.map((item, iIdx) => {
                    const ItemIcon = item.icon;
                    const hasChildren = !!item.children?.length;
                    const isItemExp =
                      itemOpen[item.id] ?? false;
                    const isActive =
                      !hasChildren && activeNav === item.id;
                    const ItemChevron = isItemExp
                      ? ChevronDown
                      : ChevronUp;
                    const isLastItem =
                      iIdx === entry.items.length - 1;

                    return (
                      <div key={item.id}>
                        {/* 2nd-level row */}
                        <button
                          onClick={() => {
                            if (hasChildren)
                              toggleItem(item.id);
                            else setActiveNav(item.id);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{
                            backgroundColor: isActive
                              ? "#dff0eb"
                              : OPEN_BG,
                            borderTop: "1px solid #dce4f5",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive)
                              (
                                e.currentTarget as HTMLElement
                              ).style.backgroundColor =
                                "#dde6f8";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLElement
                            ).style.backgroundColor = isActive
                              ? "#dff0eb"
                              : OPEN_BG;
                          }}
                        >
                          <ItemIcon
                            size={15}
                            style={{
                              color: isActive ? "#0f9a87" : IC,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            className="flex-1"
                            style={{
                              fontSize: 13,
                              fontWeight: isActive ? 600 : 400,
                              color: isActive
                                ? "#0f9a87"
                                : "#2d3f58",
                            }}
                          >
                            {item.label}
                          </span>
                          {hasChildren && (
                            <ItemChevron
                              size={12}
                              style={{
                                color: "#8fa3bf",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </button>

                        {/* 3rd-level sub-items (inside General > Opening hours etc.) */}
                        {hasChildren &&
                          isItemExp &&
                          item.children!.map((child) => {
                            const isChildActive =
                              activeNav === child.id;
                            return (
                              <button
                                key={child.id}
                                onClick={() =>
                                  setActiveNav(child.id)
                                }
                                className="w-full flex items-center pl-10 pr-4 py-2 text-left transition-colors"
                                style={{
                                  backgroundColor: isChildActive
                                    ? "#dff0eb"
                                    : "#e2e9f9",
                                  borderTop:
                                    "1px solid #d5dff5",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChildActive)
                                    (
                                      e.currentTarget as HTMLElement
                                    ).style.backgroundColor =
                                      "#d8e3f7";
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLElement
                                  ).style.backgroundColor =
                                    isChildActive
                                      ? "#dff0eb"
                                      : "#e2e9f9";
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 12.5,
                                    fontWeight: isChildActive
                                      ? 600
                                      : 400,
                                    color: isChildActive
                                      ? "#0f9a87"
                                      : "#4a5f7a",
                                  }}
                                >
                                  {child.label}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════
          MAIN CONTENT PANEL
      ══════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="bg-white rounded-xl"
          style={{
            maxWidth: 740,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div className="px-8 pt-7 pb-4 border-b border-gray-100">
            <h1
              className="text-gray-900"
              style={{ fontSize: 22, fontWeight: 600 }}
            >
              Settings
            </h1>
            <button
              onClick={onBack}
              className="flex items-center gap-1 mt-1 transition-colors hover:text-emerald-700"
              style={{ fontSize: 12.5, color: "#10b981" }}
            >
              <ChevronLeft size={13} /> Back
            </button>
          </div>

          <div className="px-8 py-6">
            {activeNav === "the-place" && <ThePlaceContent />}
            {activeNav === "logins" && <LoginsContent />}
            {activeNav === "gen-hours" && (
              <PlaceholderContent label="General opening hours" />
            )}
            {activeNav === "special" && (
              <PlaceholderContent label="Special periods" />
            )}
            {activeNav === "cutoff" && (
              <PlaceholderContent label="Cut-off time" />
            )}
            {activeNav === "rooms" && (
              <PlaceholderContent label="Rooms" />
            )}
            {activeNav === "tables-t" && (
              <PlaceholderContent label="Tables" />
            )}
            {activeNav === "combined" && (
              <PlaceholderContent label="Combined tables" />
            )}
            {activeNav === "tableplan" && (
              <PlaceholderContent label="Table plan" />
            )}
            {activeNav === "bsettings" && (
              <PlaceholderContent label="Booking settings" />
            )}
            {activeNav === "tags" && (
              <PlaceholderContent label="Tags" />
            )}
            {activeNav === "btypes" && (
              <PlaceholderContent label="Booking types" />
            )}
            {activeNav === "seatings" && (
              <PlaceholderContent label="Seatings" />
            )}
            {activeNav === "periodic" && (
              <PlaceholderContent label="Periodic criteria" />
            )}
            {activeNav === "custom-fields" && (
              <PlaceholderContent label="Custom Fields" />
            )}
            {activeNav === "booking-agents" && (
              <PlaceholderContent label="Booking agents" />
            )}
            {activeNav === "email-notif" && (
              <PlaceholderContent label="E-mail notifications" />
            )}
            {activeNav === "sms-notif" && (
              <PlaceholderContent label="SMS notifications" />
            )}
            {activeNav === "feedback" && (
              <PlaceholderContent label="Feedback questions" />
            )}
            {activeNav === "events" && (
              <PlaceholderContent label="Events" />
            )}
            {activeNav === "payment-setups" && (
              <PlaceholderContent label="Payment setups" />
            )}
            {activeNav === "payment-gateway" && (
              <PlaceholderContent label="Payment Gateway" />
            )}
            {activeNav === "products" && (
              <PlaceholderContent label="Products" />
            )}
            {activeNav === "sections" && (
              <PlaceholderContent label="Sections" />
            )}
            {activeNav === "preorder-setup" && (
              <PlaceholderContent label="Preorder setups" />
            )}
            {activeNav === "booking-link" && (
              <PlaceholderContent label="Booking link and code" />
            )}
            {activeNav === "customize-page" && (
              <PlaceholderContent label="Customize booking page" />
            )}
            {activeNav === "activecampaign" && (
              <PlaceholderContent label="ActiveCampaign" />
            )}
            {activeNav === "google" && (
              <PlaceholderContent label="Google" />
            )}
            {activeNav === "klaviyo" && (
              <PlaceholderContent label="Klaviyo" />
            )}
            {activeNav === "mailchimp" && (
              <PlaceholderContent label="Mailchimp" />
            )}
            {activeNav === "meta" && (
              <PlaceholderContent label="Meta (Facebook & Instagram)" />
            )}
            {activeNav === "michelin" && (
              <PlaceholderContent label="Michelin Guide" />
            )}
            {activeNav === "webhooks" && (
              <PlaceholderContent label="Webhooks" />
            )}
            {activeNav === "subscription" && (
              <PlaceholderContent label="Subscription" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CONTENT — The place
══════════════════════════════════════════════ */
function ThePlaceContent() {
  const [name, setName] = useState("Quang Nguyen");
  const [phone, setPhone] = useState("+84559716366");
  const [email, setEmail] = useState("quangnguyen@norra.ai");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Vietnam (+84)");
  const [language, setLanguage] = useState("English (GB)");
  const [timezone, setTimezone] = useState(
    "(GMT+07:00) Bangkok, Hanoi, Jakarta",
  );
  const [timefmt, setTimefmt] = useState("24-hour");
  const [initials, setInitials] = useState("");
  const [saved, setSaved] = useState(false);

  const COUNTRIES = [
    "Vietnam (+84)",
    "Denmark (+45)",
    "Norway (+47)",
    "Sweden (+46)",
    "Germany (+49)",
    "France (+33)",
    "United Kingdom (+44)",
    "United States (+1)",
  ];
  const LANGUAGES = [
    "English (GB)",
    "English (US)",
    "Dansk",
    "Norsk",
    "Svenska",
    "Deutsch",
    "Français",
    "Tiếng Việt",
  ];
  const TIMEZONES = [
    "(GMT+07:00) Bangkok, Hanoi, Jakarta",
    "(GMT+00:00) London",
    "(GMT+01:00) Paris, Berlin",
    "(GMT-05:00) New York",
    "(GMT+08:00) Singapore",
  ];
  const TIMEFORMATS = ["24-hour", "12-hour (AM/PM)"];

  return (
    <div className="space-y-8">
      <section>
        <h2
          className="text-gray-800 mb-5"
          style={{ fontSize: 16, fontWeight: 600 }}
        >
          The place
        </h2>
        <div className="space-y-4">
          <FormRow label="Name:">
            <TextInput value={name} onChange={setName} />
          </FormRow>
          <FormRow label="Phone:">
            <div
              className="flex items-center rounded-md border border-gray-200 bg-gray-50 overflow-hidden focus-within:border-emerald-400 focus-within:bg-white transition"
              style={{ width: 260 }}
            >
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 shrink-0"
                style={{
                  backgroundColor: "#f0fdf9",
                  borderRight: "1px solid #e2e8f0",
                }}
              >
                <Phone size={13} style={{ color: "#10b981" }} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent px-3 py-1.5 outline-none"
                style={{ fontSize: 13, color: "#1e293b" }}
              />
            </div>
          </FormRow>
          <FormRow label="E-mail:">
            <TextInput
              value={email}
              onChange={setEmail}
              type="email"
            />
          </FormRow>
          <FormRow label="Address:">
            <TextInput value={address} onChange={setAddress} />
          </FormRow>
          <FormRow label="Zip code and City:">
            <div className="flex gap-2">
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="Zip code"
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none transition focus:border-emerald-400 focus:bg-white"
                style={{
                  fontSize: 13,
                  width: 130,
                  color: "#1e293b",
                }}
              />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none transition focus:border-emerald-400 focus:bg-white"
                style={{ fontSize: 13, color: "#1e293b" }}
              />
            </div>
          </FormRow>
          <FormRow label="Country:">
            <SelectInput
              value={country}
              onChange={setCountry}
              options={COUNTRIES}
              style={{ width: 280 }}
            />
          </FormRow>
        </div>
      </section>
      <Divider />
      <section>
        <h2
          className="text-gray-800 mb-5"
          style={{ fontSize: 16, fontWeight: 600 }}
        >
          Regional settings
        </h2>
        <div className="space-y-4">
          <FormRow label="Standard Language:">
            <SelectInput
              value={language}
              onChange={setLanguage}
              options={LANGUAGES}
              style={{ width: 200 }}
            />
          </FormRow>
          <FormRow label="Time zone:">
            <SelectInput
              value={timezone}
              onChange={setTimezone}
              options={TIMEZONES}
              style={{ width: 340 }}
            />
          </FormRow>
          <FormRow label="Time format:">
            <SelectInput
              value={timefmt}
              onChange={setTimefmt}
              options={TIMEFORMATS}
              style={{ width: 160 }}
            />
          </FormRow>
        </div>
      </section>
      <Divider />
      <section>
        <h2
          className="text-gray-800 mb-5"
          style={{ fontSize: 16, fontWeight: 600 }}
        >
          Staff
        </h2>
        <div className="space-y-1">
          <FormRow label="Initials:">
            <TextInput
              value={initials}
              onChange={setInitials}
              placeholder="Initials"
            />
          </FormRow>
          <div style={{ paddingLeft: 155 }}>
            <p
              className="text-gray-400"
              style={{ fontSize: 11.5, marginTop: 4 }}
            >
              Enter staff initials separated by semicolon (e.g.
              "AB, JRC, RS")
            </p>
          </div>
        </div>
      </section>
      <div className="pt-2">
        <SaveButton
          saved={saved}
          onSave={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CONTENT — Logins / Profile
══════════════════════════════════════════════ */
function LoginsContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("quangnguyen@norra.ai");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("Dansk");
  const [managerCode, setManagerCode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);

  const LANGUAGES = [
    "Dansk",
    "English",
    "Norsk",
    "Svenska",
    "Deutsch",
    "Français",
    "Tiếng Việt",
  ];

  return (
    <div className="space-y-5">
      <h2
        className="text-gray-800 mb-1"
        style={{ fontSize: 16, fontWeight: 600 }}
      >
        Profile
      </h2>
      <FormRow label="Name:">
        <TextInput
          value={name}
          onChange={setName}
          placeholder="Your name"
        />
      </FormRow>
      <FormRow label="E-mail:">
        <TextInput
          value={email}
          onChange={setEmail}
          type="email"
        />
      </FormRow>
      <FormRow label="Mobile:">
        <div
          className="flex items-center rounded-md border border-gray-200 bg-gray-50 overflow-hidden focus-within:border-emerald-400 focus-within:bg-white transition"
          style={{ width: 280 }}
        >
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 border-r border-gray-200 shrink-0 select-none"
            style={{ backgroundColor: "#f8fafc" }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>
              🇻🇳
            </span>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              +84
            </span>
            <ChevronDown
              size={11}
              style={{ color: "#94a3b8" }}
            />
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="flex-1 bg-transparent px-3 py-1.5 outline-none"
            style={{ fontSize: 13, color: "#1e293b" }}
          />
        </div>
      </FormRow>
      <FormRow label="Language:">
        <SelectInput
          value={language}
          onChange={setLanguage}
          options={LANGUAGES}
          style={{ width: 160 }}
        />
      </FormRow>
      <FormRow label="Use manager code:">
        <Checkbox
          checked={managerCode}
          onChange={setManagerCode}
        />
      </FormRow>
      <FormRow label="Use two-factor login:">
        <Checkbox checked={twoFactor} onChange={setTwoFactor} />
      </FormRow>
      <div className="pt-1">
        <button
          onClick={() => setShowPassForm((v) => !v)}
          className="flex items-center gap-2 text-white rounded-lg px-4 py-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#10b981", fontSize: 13 }}
        >
          Change password
        </button>
        {showPassForm && (
          <div className="mt-4 space-y-4 border border-gray-100 rounded-xl p-5 bg-gray-50">
            <PasswordField
              label="Current password:"
              value={currentPass}
              onChange={setCurrentPass}
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
            />
            <PasswordField
              label="New password:"
              value={newPass}
              onChange={setNewPass}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
            />
            <PasswordField
              label="Confirm password:"
              value={confirmPass}
              onChange={setConfirmPass}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
            />
            <button
              className="text-white rounded-lg px-4 py-2 hover:opacity-90"
              style={{
                backgroundColor: "#10b981",
                fontSize: 13,
              }}
            >
              Update password
            </button>
          </div>
        )}
      </div>
      <div className="pt-3 border-t border-gray-100">
        <SaveButton
          saved={saved}
          onSave={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        />
      </div>
    </div>
  );
}

function PlaceholderContent({ label }: { label: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
        <SlidersHorizontal
          size={22}
          className="text-gray-300"
        />
      </div>
      <p style={{ fontSize: 14 }}>{label}</p>
      <p style={{ fontSize: 12 }}>
        This section is coming soon.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SHARED UI HELPERS
══════════════════════════════════════════════ */
function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <label
        className="shrink-0 text-gray-500 pt-1.5"
        style={{ fontSize: 13, width: 155 }}
      >
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
function TextInput({
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 outline-none transition focus:border-emerald-400 focus:bg-white"
      style={{ fontSize: 13, color: "#1e293b" }}
    />
  );
}
function SelectInput({
  value,
  onChange,
  options,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  style?: React.CSSProperties;
}) {
  return (
    <div className="relative" style={style}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 pr-8 outline-none cursor-pointer transition focus:border-emerald-400 focus:bg-white"
        style={{ fontSize: 13, color: "#1e293b" }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}
function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
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
      {checked && (
        <Check size={11} color="white" strokeWidth={3} />
      )}
    </button>
  );
}
function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <FormRow label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
function SaveButton({
  saved,
  onSave,
}: {
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <button
      onClick={onSave}
      className="flex items-center gap-2 text-white rounded-lg px-5 py-2 transition-all hover:opacity-90"
      style={{
        backgroundColor: saved ? "#059669" : "#10b981",
        fontSize: 13,
      }}
    >
      {saved && <Check size={14} />}
      {saved ? "Saved!" : "Save"}
    </button>
  );
}
function Divider() {
  return <div className="border-t border-gray-100" />;
}