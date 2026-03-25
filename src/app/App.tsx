import React, { useState, useEffect, useRef } from "react";
import {
  Menu, BarChart2, List,
  Plus, UserPlus, LayoutGrid,
  Sun, Utensils, Moon, Calendar, Clock,
} from "lucide-react";
import { LanguageProvider, useLang } from "./context/LanguageContext";
import { LeftSidebar } from "./components/LeftSidebar";
import { Timeline, type SlotInfo } from "./components/Timeline";
import { Tableplan } from "./components/Tableplan";
import { ListView } from "./components/ListView";
import { CRMView } from "./components/CRMView";
import { BookingSettingsDrawer } from "./components/BookingSettingsDrawer";
import { BookingDetailModal } from "./components/BookingDetailModal";
import { BookingDrawer } from "./components/BookingDrawer";
import { UserMenuDropdown } from "./components/UserMenuDropdown";
import LogoPlaceholder from "../imports/LogoPlaceholder";
import { SettingsPage, type SettingsView } from "./components/SettingsPage";

type NavTab = "Bookings" | "CRM" | "Archive";

function TopNav({ activeTab, setActiveTab, onProfile, onSettings, hideActiveTab }: {
  activeTab: NavTab;
  setActiveTab: (t: NavTab) => void;
  onProfile: () => void;
  onSettings: () => void;
  hideActiveTab: boolean;
}) {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center border-b border-gray-200 bg-white shrink-0 relative" style={{ height: 40, paddingLeft: 12, paddingRight: 12 }}>
      {/* ── Logo ── */}
      <div className="flex items-center mr-8" style={{ width: 116, height: 32 }}>
        <LogoPlaceholder />
      </div>

      {/* ── Nav tabs ── */}
      <nav className="flex items-center">
        {([
          { id: "Bookings", label: t.nav.bookings },
          { id: "CRM",      label: t.nav.crm      },
          { id: "Archive",  label: t.nav.archive  },
        ] as { id: NavTab; label: string }[]).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 h-10 transition-colors relative ${!hideActiveTab && activeTab === item.id ? "text-emerald-600 font-medium" : "text-gray-600 hover:text-gray-800"}`}
            style={{ fontSize: 13 }}
          >
            {item.label}
            {!hideActiveTab && activeTab === item.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
          </button>
        ))}
      </nav>

      {/* ── Right side: restaurant name + menu ── */}
      <div className="ml-auto flex items-center gap-3">
        {/* Restaurant name — no dropdown arrow */}
        <span className="text-gray-700" style={{ fontSize: 13, fontWeight: 500 }}>
          Quang Nguyen
        </span>

        {/* Hamburger / menu button */}
        <div ref={menuAnchorRef} className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${menuOpen ? "bg-gray-100 text-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            aria-label="Open menu"
          >
            <Menu size={16} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <UserMenuDropdown
              onClose={() => setMenuOpen(false)}
              onProfile={onProfile}
              onSettings={onSettings}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface BookingsHeaderProps {
  liveTime: string;
  selectedDay: number;
  onNewBooking: () => void;
  onWalkIn: () => void;
}
function BookingsHeader({ liveTime, selectedDay, onNewBooking, onWalkIn }: BookingsHeaderProps) {
  const { lang, t } = useLang();
  
  const d = new Date();
  d.setDate(selectedDay);
  const dateStr = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).format(d);
  
  // Format liveTime cleanly
  const timeStr = liveTime.match(/^\d+:\d+/) ? liveTime.match(/^\d+:\d+/)?.[0] : liveTime;

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-gray-900 leading-none" style={{ fontSize: 16, fontWeight: 600 }}>{dateStr}</h1>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={10} className="text-emerald-500" />
            <span className="text-emerald-600 tabular-nums" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>{liveTime}</span>
            <span className="text-gray-400 ml-1" style={{ fontSize: 10 }}>{t.header.live}</span>
          </div>
        <div className="h-8 w-px bg-gray-100 mx-1" />
        <button
          onClick={onNewBooking}
          className="flex items-center gap-1.5 text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#10b981", fontSize: 12 }}
        >
          <Plus size={13} /> {t.header.newBooking}
        </button>
        <button
          onClick={onWalkIn}
          className="flex items-center gap-1.5 text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#3b82f6", fontSize: 12 }}
        >
          <UserPlus size={13} /> {t.header.walkIn}
        </button>
      </div>
    </header>
  );
}

interface ViewControlsProps {
  activeView: string; setActiveView: (v: string) => void;
  activeTime: string; setActiveTime: (t: string) => void;
}
function ViewControls({ activeView, setActiveView, activeTime, setActiveTime }: ViewControlsProps) {
  const { t } = useLang();

  const VIEW_BUTTONS = [
    { id: "Diagram",   icon: BarChart2,  label: t.views.diagram   },
    { id: "List",      icon: List,       label: t.views.list      },
    { id: "Tableplan", icon: LayoutGrid, label: t.views.tablePlan },
  ];

  const TIME_BUTTONS = [
    { id: "All",     icon: Calendar, label: t.periods.all,     activeColor: "#374151" },
    { id: "Morning", icon: Sun,      label: t.periods.morning, activeColor: "#b45309" },
    { id: "Lunch",   icon: Utensils, label: t.periods.lunch,   activeColor: "#c2410c" },
    { id: "Evening", icon: Moon,     label: t.periods.evening, activeColor: "#0f766e" },
  ];

  return (
    <div className="flex items-center gap-5 border-b border-gray-100 bg-white shrink-0" style={{ height: 38, paddingLeft: 16, paddingRight: 16 }}>
      <div className="flex items-center gap-2">
        <span className="text-gray-400" style={{ fontSize: 11 }}>{t.views.show}</span>
        <div className="flex border border-gray-200 rounded overflow-hidden">
          {VIEW_BUTTONS.map((v, i) => {
            const isActive = activeView === v.id;
            const Icon = v.icon;
            return (
              <button key={v.id} onClick={() => setActiveView(v.id)}
                className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${i < VIEW_BUTTONS.length - 1 ? "border-r border-gray-200" : ""} ${isActive ? "bg-white text-emerald-600" : "text-gray-500 hover:bg-gray-50"}`}
                style={{ fontSize: 11 }}>
                <Icon size={12} className={isActive ? "text-emerald-600" : "text-gray-400"} />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400" style={{ fontSize: 11 }}>{t.views.time}</span>
        <div className="flex border border-gray-200 rounded overflow-hidden">
          {TIME_BUTTONS.map((tb, i) => {
            const isActive = activeTime === tb.id;
            const Icon = tb.icon;
            return (
              <button key={tb.id} onClick={() => setActiveTime(tb.id)}
                className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${i < TIME_BUTTONS.length - 1 ? "border-r border-gray-200" : ""}`}
                style={{ fontSize: 11, backgroundColor: isActive ? tb.activeColor : "transparent", color: isActive ? "white" : "#6b7280" }}>
                <Icon size={11} /> {tb.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AppInner() {
  const { t } = useLang();
  const [activeTab,       setActiveTab]       = useState<NavTab>("Bookings");
  const [activeView,      setActiveView]      = useState("Diagram");
  const [activeTime,      setActiveTime]      = useState("All");
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ id: number; tab?: string } | null>(null);
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);
  const [bookingDrawerType, setBookingDrawerType] = useState<"walk-in" | "reservation">("reservation");
  const [bookingDrawerSlot, setBookingDrawerSlot] = useState<SlotInfo | undefined>(undefined);
  const [selectedDay,     setSelectedDay]     = useState(new Date().getDate());
  const [settingsView,    setSettingsView]    = useState<SettingsView | null>(null);

  const [liveTime, setLiveTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });
  useEffect(() => {
    const id = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function handleBookingClick(id: number) { setSelectedBooking({ id, tab: "overview" }); }
  function handleIconClick(id: number, tab: string) { setSelectedBooking({ id, tab }); }
  function handleSlotNewBooking(slot: SlotInfo) {
    setBookingDrawerType("reservation");
    setBookingDrawerSlot(slot);
    setBookingDrawerOpen(true);
  }
  function handleSlotWalkIn(slot: SlotInfo) {
    setBookingDrawerType("walk-in");
    setBookingDrawerSlot(slot);
    setBookingDrawerOpen(true);
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: "100vh", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <TopNav
        activeTab={activeTab}
        setActiveTab={(tab) => { setSettingsView(null); setActiveTab(tab); }}
        onProfile={() => setSettingsView("profile")}
        onSettings={() => setSettingsView("settings")}
        hideActiveTab={settingsView !== null}
      />

      {/* ── Settings / Profile overlay ── */}
      {settingsView !== null && (
        <SettingsPage initialView={settingsView} onBack={() => setSettingsView(null)} />
      )}

      {settingsView === null && activeTab === "CRM" && <CRMView />}

      {settingsView === null && activeTab === "Archive" && (
        <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 flex-col gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Calendar size={28} className="text-gray-300" />
          </div>
          <p style={{ fontSize: 15 }}>{t.archive.title}</p>
          <p className="text-gray-400" style={{ fontSize: 12 }}>{t.archive.subtitle}</p>
        </div>
      )}

      {settingsView === null && activeTab === "Bookings" && (
        <div className="flex flex-1 overflow-hidden min-h-0">
          <LeftSidebar
            onOpenSettings={() => setDrawerOpen(true)}
            onBookingClick={handleBookingClick}
            onIconClick={handleIconClick}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
          />
          <main className="flex flex-col flex-1 overflow-hidden min-h-0 min-w-0 bg-white">
            <BookingsHeader 
              liveTime={liveTime} 
              selectedDay={selectedDay}
              onNewBooking={() => { setBookingDrawerType("reservation"); setBookingDrawerSlot(undefined); setBookingDrawerOpen(true); }} 
              onWalkIn={() => { setBookingDrawerType("walk-in"); setBookingDrawerSlot(undefined); setBookingDrawerOpen(true); }} 
            />
            <ViewControls activeView={activeView} setActiveView={setActiveView} activeTime={activeTime} setActiveTime={setActiveTime} />
            {activeView === "Diagram"   && <Timeline   period={activeTime} day={selectedDay} onBookingClick={handleBookingClick} onSlotNewBooking={handleSlotNewBooking} onSlotWalkIn={handleSlotWalkIn} />}
            {activeView === "List"      && <ListView   period={activeTime} day={selectedDay} onBookingClick={handleBookingClick} />}
            {activeView === "Tableplan" && <Tableplan  period={activeTime} day={selectedDay} onBookingClick={handleBookingClick} />}
          </main>
        </div>
      )}


      <BookingSettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <BookingDetailModal
        selectedDay={selectedDay}
        bookingId={selectedBooking?.id ?? null}
        initialTab={(selectedBooking?.tab ?? "overview") as any}
        onClose={() => setSelectedBooking(null)}
        onOpenCRM={() => { setSelectedBooking(null); setActiveTab("CRM"); }}
      />
      <BookingDrawer
        open={bookingDrawerOpen}
        onClose={() => setBookingDrawerOpen(false)}
        initialType={bookingDrawerType}
        initialSlot={bookingDrawerSlot}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}