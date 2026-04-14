import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router";
import {
  Menu, BarChart2, List,
  LayoutGrid,
  Sun, Utensils, Moon, Calendar,
  Search, Bell, Plus, UserPlus,
  Mic, Maximize, Minimize, PowerOff,
  ReceiptText, ShoppingCart, BookOpen, Table2, MoreHorizontal,
  ChevronDown,
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
import { OrderDetailsPanel } from "./components/OrderDetailsPanel";
import { updateBookingStatus, type Status } from "./data/bookings";
import { DeliveryTrackingModal } from "./components/DeliveryTrackingModal";
import { UserMenuDropdown } from "./components/UserMenuDropdown";
import LogoPlaceholder from "../imports/LogoPlaceholder";
import { SettingsPage, type SettingsView } from "./components/SettingsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

type NavTab = "Bookings" | "CRM" | "Archive";

// ── Add New Smart Dropdown ──────────────────────────────────────
interface AddNewDropdownProps {
  onNewBooking: () => void;
  onWalkIn: () => void;
  onClose: () => void;
}
function AddNewDropdown({ onNewBooking, onWalkIn, onClose }: AddNewDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-[200] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      style={{ width: 220, animation: "addNewIn 0.15s cubic-bezier(0.34,1.4,0.64,1)" }}
    >
      <style>{`@keyframes addNewIn { from { opacity:0; transform:scale(0.93) translateY(-6px);} to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50">
        <p className="text-gray-700" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Create New</p>
      </div>
      <div className="p-2 space-y-1.5">
        <button
          onClick={() => { onNewBooking(); onClose(); }}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl border-2 border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#10b981" }}>
            <Plus size={14} color="white" />
          </div>
          <div>
            <div className="text-gray-800" style={{ fontSize: 12, fontWeight: 600 }}>New Booking</div>
            <div className="text-gray-500" style={{ fontSize: 10.5 }}>Schedule a reservation</div>
          </div>
          <span className="ml-auto px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0" style={{ fontSize: 9, fontWeight: 700 }}>PLAN</span>
        </button>
        <button
          onClick={() => { onWalkIn(); onClose(); }}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl border-2 border-blue-400 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#3b82f6" }}>
            <UserPlus size={14} color="white" />
          </div>
          <div>
            <div className="text-gray-800" style={{ fontSize: 12, fontWeight: 600 }}>Walk-in</div>
            <div className="text-gray-500" style={{ fontSize: 10.5 }}>Seat a guest right now</div>
          </div>
          <span className="ml-auto px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0" style={{ fontSize: 9, fontWeight: 700 }}>NOW</span>
        </button>
      </div>
    </div>
  );
}

// ── Global Top Header ───────────────────────────────────────────
interface GlobalHeaderProps {
  onNewBooking: () => void;
  onWalkIn: () => void;
}
function GlobalHeader({ onNewBooking, onWalkIn }: GlobalHeaderProps) {
  const [addNewOpen,  setAddNewOpen]  = useState(false);
  const [searchVal,   setSearchVal]   = useState("");

  return (
    <header
      className="shrink-0 flex items-center border-b border-gray-200 bg-white relative"
      style={{ height: 52, paddingLeft: 14, paddingRight: 14 }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center mr-5" style={{ width: 104, height: 32, flexShrink: 0 }}>
        <LogoPlaceholder />
      </div>

      {/* ── Shift info ── */}
      <div className="flex items-center gap-2 mr-5 py-1.5" style={{ flexShrink: 0 }}>
        {/* Avatar */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #0d9488, #10b981)", fontSize: 9, fontWeight: 800, color: "white" }}
        >
          QN
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 500 }}>Shift opened by</div>
          <div style={{ fontSize: 11, color: "#111827", fontWeight: 700, whiteSpace: "nowrap" }}>
            QuangNguyên
            <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 5 }}>· 15:30 31/10/2023</span>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* ── Right actions ── */}
      <div className="flex items-center gap-2 ml-4" style={{ flexShrink: 0 }}>

        {/* Search bar */}
        <div
          className="flex items-center gap-2 rounded-lg px-2.5"
          style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", height: 32, width: 180 }}
        >
          <Search size={12} style={{ color: "#9ca3af", flexShrink: 0 }} />
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Type to search…"
            className="flex-1 bg-transparent outline-none min-w-0"
            style={{ fontSize: 12, color: "#111827", caretColor: "#10b981" }}
          />
          <Mic size={11} style={{ color: "#9ca3af", flexShrink: 0, cursor: "pointer" }} />
        </div>

        {/* Bell */}
        <button
          className="flex items-center justify-center rounded-lg transition-colors relative hover:bg-gray-50"
          style={{ width: 32, height: 32, backgroundColor: "transparent", border: "1px solid #e5e7eb", color: "#6b7280" }}
          aria-label="Notifications"
        >
          <Bell size={14} />
          {/* badge */}
          <span
            className="absolute rounded-full flex items-center justify-center"
            style={{ width: 8, height: 8, backgroundColor: "#f43f5e", top: 5, right: 5, fontSize: 6, color: "white", fontWeight: 700 }}
          />
        </button>

        {/* Add New button */}
        <div className="relative">
          <button
            onClick={() => setAddNewOpen(v => !v)}
            className="flex items-center gap-1.5 rounded-lg font-semibold transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{
              height: 32,
              paddingLeft: 12,
              paddingRight: 10,
              fontSize: 12,
              background: "linear-gradient(135deg, #0d9488, #10b981)",
              color: "white",
              boxShadow: "0 2px 8px rgba(16,185,129,0.35)",
            }}
          >
            <Plus size={13} />
            Add New
            <ChevronDown size={11} style={{ opacity: 0.8, marginLeft: 1 }} />
          </button>

          {addNewOpen && (
            <AddNewDropdown
              onNewBooking={onNewBooking}
              onWalkIn={onWalkIn}
              onClose={() => setAddNewOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
}

// ── Sub Nav (Bookings | CRM | Archive) ─────────────────────────
function SubNav() {
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  let activeTab = "Bookings";
  if (path.startsWith("/crm")) activeTab = "CRM";
  else if (path.startsWith("/archive")) activeTab = "Archive";

  return (
    <div className="flex items-center gap-6 px-6 border-b border-gray-100 bg-white shrink-0" style={{ height: 44 }}>
      {([
        { id: "Bookings", label: t.nav.bookings, path: "/reservation/bookings" },
        { id: "CRM",      label: t.nav.crm,      path: "/crm" },
        { id: "Archive",  label: t.nav.archive,  path: "/archive" },
      ] as const).map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="relative h-full transition-colors flex items-center"
            style={{
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#10b981" : "#6b7280",
            }}
          >
            {item.label}
            {isActive && (
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{ height: 2, backgroundColor: "#10b981" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Global POS Footer ───────────────────────────────────────────
type PosTab = "Order" | "Reservation" | "Tables" | "Receipt" | "More";

function GlobalFooter() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  let activeFooterTab: PosTab = "Reservation";
  if (path.startsWith("/order")) activeFooterTab = "Order";
  else if (path.startsWith("/reservation/table-plan")) activeFooterTab = "Tables";
  else if (path.startsWith("/receipt")) activeFooterTab = "Receipt";
  else if (path.startsWith("/settings")) activeFooterTab = "More";

  const [isFullscreen, setIsFullscreen] = useState(false);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    function onFsChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const FOOTER_TABS: { id: PosTab; icon: React.ElementType; label: string; route: string }[] = [
    { id: "Order",       icon: ShoppingCart,   label: "Order",       route: "/order" },
    { id: "Reservation", icon: BookOpen,       label: "Reservation", route: "/reservation/bookings" },
    { id: "Tables",      icon: Table2,         label: "Tables",      route: "/reservation/table-plan" },
    { id: "Receipt",     icon: ReceiptText,    label: "Receipt",     route: "/receipt" },
    { id: "More",        icon: Menu,           label: "More",        route: "/settings" },
  ];

  return (
    <footer
      className="shrink-0 flex items-center border-t border-gray-200 bg-white"
      style={{
        height: 52,
        paddingLeft: 14,
        paddingRight: 14,
      }}
    >
      {/* ── Left: Close Shift ── */}
      <button
        className="flex items-center gap-2 rounded-lg transition-all hover:opacity-80 active:scale-95"
        style={{
          height: 34,
          paddingLeft: 12,
          paddingRight: 14,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#ef4444",
          flexShrink: 0,
        }}
        aria-label="Close shift"
      >
        <PowerOff size={13} />
        Close Shift
      </button>

      {/* ── Divider ── */}
      <div style={{ width: 1, height: 28, backgroundColor: "#e5e7eb", margin: "0 16px", flexShrink: 0 }} />

      {/* ── Center: POS nav tabs ── */}
      <div className="flex items-center gap-1 flex-1 justify-center relative">
        {FOOTER_TABS.map(tab => {
          const isActive = activeFooterTab === tab.id;
          const Icon = tab.icon;

          return (
            <div key={tab.id} className="relative">
              <button
                onClick={() => navigate(tab.route)}
                className="flex items-center gap-1.5 rounded-lg transition-all duration-150 active:scale-95"
                style={{
                  height: 36,
                  paddingLeft: 14,
                  paddingRight: 14,
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#10b981" : "#6b7280",
                  backgroundColor: isActive ? "#ecfdf5" : "transparent",
                  border: isActive ? "1px solid #a7f3d0" : "1px solid transparent",
                }}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Divider ── */}
      <div style={{ width: 1, height: 28, backgroundColor: "#e5e7eb", margin: "0 16px", flexShrink: 0 }} />

      {/* ── Right: Full-screen toggle ── */}
      <button
        onClick={toggleFullscreen}
        className="flex items-center gap-1.5 rounded-lg transition-all hover:bg-gray-50 active:scale-95"
        style={{
          height: 34,
          paddingLeft: 10,
          paddingRight: 12,
          fontSize: 12,
          fontWeight: 500,
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          color: "#6b7280",
          flexShrink: 0,
        }}
        aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
      >
        {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
        {isFullscreen ? "Exit" : "Full Screen"}
      </button>
    </footer>
  );
}

// ── View Controls (Show / Time toggles) ────────────────────────
interface ViewControlsProps {
  activeTime: string; setActiveTime: (t: string) => void;
}
function ViewControls({ activeTime, setActiveTime }: ViewControlsProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  let activeView = "Gantt";
  if (path.endsWith("/list")) activeView = "List";
  if (path.endsWith("/table-plan")) activeView = "Tableplan";

  const VIEW_BUTTONS = [
    { id: "Gantt",     icon: BarChart2,  label: t.views.diagram,   route: "/reservation/bookings" },
    { id: "List",      icon: List,       label: t.views.list,      route: "/reservation/list"     },
    { id: "Tableplan", icon: LayoutGrid, label: t.views.tablePlan, route: "/reservation/table-plan" },
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
              <button key={v.id} onClick={() => navigate(v.route)}
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

// ── App Inner ───────────────────────────────────────────────────
function AppInner() {
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTime,        setActiveTime]        = useState("All");
  const [drawerOpen,        setDrawerOpen]        = useState(false);
  const [selectedBooking,   setSelectedBooking]   = useState<{ id: number; tab?: string } | null>(null);
  const [orderPanelId,      setOrderPanelId]      = useState<number | null>(null);
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);
  const [bookingDrawerType, setBookingDrawerType] = useState<"walk-in" | "reservation">("reservation");
  const [bookingDrawerSlot, setBookingDrawerSlot] = useState<SlotInfo | undefined>(undefined);
  const [selectedDay,       setSelectedDay]       = useState(new Date().getDate());
  const [forceRender,       setForceRender]       = useState(0);
  const [hideCancelledNoshow,  setHideCancelledNoshow]  = useState(false);

  function handleNewBooking() {
    setBookingDrawerType("reservation");
    setBookingDrawerSlot(undefined);
    setBookingDrawerOpen(true);
  }
  function handleWalkIn() {
    setBookingDrawerType("walk-in");
    setBookingDrawerSlot(undefined);
    setBookingDrawerOpen(true);
  }
  function handleBookingClick(id: number)             { setOrderPanelId(id); }
  function handleIconClick(id: number, tab: string)   { setSelectedBooking({ id, tab }); }
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
  function handleUpdateStatus(id: number, status: Status) {
    updateBookingStatus(id, status, selectedDay);
    setForceRender(v => v + 1);
  }

  const isSettings = location.pathname.startsWith("/settings");

  return (
    <div
      className="flex flex-col bg-gray-50"
      style={{ height: "100vh", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Global Top Header ── */}
      <GlobalHeader
        onNewBooking={handleNewBooking}
        onWalkIn={handleWalkIn}
      />

      {/* ── Sub Navigation ── */}
      {!isSettings && <SubNav />}

      {/* ── Main content (fills space between header/subnav & footer) ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-h-0">
        <Routes>
          <Route path="/" element={<Navigate to="/reservation/bookings" replace />} />
          
          <Route path="/settings" element={
            <SettingsPage initialView="settings" onBack={() => navigate(-1)} />
          } />

          <Route path="/crm" element={<CRMView />} />

          <Route path="/archive" element={
            <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 flex-col gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Calendar size={28} className="text-gray-300" />
              </div>
              <p style={{ fontSize: 15 }}>{t.archive.title}</p>
              <p className="text-gray-400" style={{ fontSize: 12 }}>{t.archive.subtitle}</p>
            </div>
          } />

          <Route path="/order" element={
            <div className="flex-1 flex items-center justify-center text-gray-400 bg-white">
               <p>POS / Cart Flow Placeholder</p>
            </div>
          } />

          <Route path="/receipt" element={
            <div className="flex-1 flex items-center justify-center text-gray-400 bg-white">
               <p>Receipt View Placeholder</p>
            </div>
          } />

          <Route path="/reservation/*" element={
            <div className="flex flex-1 overflow-hidden min-h-0 bg-white">
              <LeftSidebar
                onOpenSettings={() => setDrawerOpen(true)}
                onBookingClick={handleBookingClick}
                onIconClick={handleIconClick}
                selectedDay={selectedDay}
                onDaySelect={setSelectedDay}
              />
              <ErrorBoundary>
                <main className="flex flex-col flex-1 overflow-hidden min-h-0 min-w-0 bg-white">
                  {/* ViewControls sit directly at the top — sub-header removed */}
                  <ViewControls
                    activeTime={activeTime}
                    setActiveTime={setActiveTime}
                  />
                  <Routes>
                    <Route path="bookings" element={
                      <Timeline period={activeTime} day={selectedDay} onBookingClick={handleBookingClick} onSlotNewBooking={handleSlotNewBooking} onSlotWalkIn={handleSlotWalkIn} forceRender={forceRender} hideCancelledNoshow={hideCancelledNoshow} onHideCancelledNoshowChange={setHideCancelledNoshow} />
                    } />
                    <Route path="list" element={
                      <ListView period={activeTime} day={selectedDay} onBookingClick={handleBookingClick} onUpdateStatus={handleUpdateStatus} forceRender={forceRender} />
                    } />
                    <Route path="table-plan" element={
                      <Tableplan period={activeTime} day={selectedDay} onBookingClick={handleBookingClick} forceRender={forceRender} hideCancelledNoshow={hideCancelledNoshow} onOpenTableConfig={() => setDrawerOpen(true)} onWalkinRequest={(tables, time) => { if (!tables.length) return; setBookingDrawerType("walk-in"); setBookingDrawerSlot({ section: tables[0].section as any, table: tables[0].table, additionalTables: tables.length > 1 ? tables.slice(1).map(t => ({ section: t.section as any, table: t.table })) : undefined, timeSlot: time }); setBookingDrawerOpen(true); }} />
                    } />
                  </Routes>
                </main>
              </ErrorBoundary>
            </div>
          } />
        </Routes>
      </div>

      {/* ── Global POS Footer ── */}
      <GlobalFooter />

      {/* ── Global overlays / drawers / modals ── */}
      <BookingSettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <BookingDetailModal
        selectedDay={selectedDay}
        bookingId={selectedBooking?.id ?? null}
        initialTab={(selectedBooking?.tab ?? "overview") as any}
        onClose={() => setSelectedBooking(null)}
        onOpenCRM={() => { setSelectedBooking(null); navigate("/crm"); }}
        onStatusChange={handleUpdateStatus}
      />
      <OrderDetailsPanel
        bookingId={orderPanelId}
        selectedDay={selectedDay}
        onClose={() => setOrderPanelId(null)}
        onStatusChange={handleUpdateStatus}
        onBookingUpdated={() => setForceRender(v => v + 1)}
      />
      <BookingDrawer
        open={bookingDrawerOpen}
        onClose={() => setBookingDrawerOpen(false)}
        initialType={bookingDrawerType}
        initialSlot={bookingDrawerSlot}
        selectedDay={selectedDay}
        onBookingCreated={() => setForceRender(v => v + 1)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </BrowserRouter>
  );
}