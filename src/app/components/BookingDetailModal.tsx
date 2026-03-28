import React, { useState, useEffect } from "react";
import {
  X, Users, MapPin, Clock, Calendar, MessageSquare,
  FileText, Settings, Phone, Mail, ExternalLink,
  Check, Download, Edit3, Info, Send, Bell, BellOff, Eye,
  Paperclip as PaperclipIcon, CheckCircle2, Circle, ArrowRight, ChevronDown, ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { ALL_BOOKINGS, STATUS_META, type Status } from "../data/bookings";
import { useLang } from "../context/LanguageContext";

// ── Per-booking enriched data ─────────────────────────────────

interface StaffNote { author: string; time: string; text: string; }
interface Document  { name: string; kind: "menu" | "receipt" | "form" | "image"; size: string; date: string; }
interface CRMSnap   { visits: number; totalSpent: number; lastVisit: string; }
interface GuestFollowUp { text: string; time: string; }

interface BookingEnriched {
  phone: string; email: string; guestNote: string;
  guestFollowUps?: GuestFollowUp[];
  staffNotes: StaffNote[]; documents: Document[]; crm: CRMSnap;
}

export const TAG_DEFINITIONS: Record<string, { description: string; color: string; bg: string }> = {
  "Evening menu":     { description: "Đặt trước thực đơn 3 món tối · 1.500.000₫/người", color: "#065f46", bg: "#d1fae5" },
  "Seafood special":  { description: "Khách yêu cầu thực đơn hải sản tươi đặc biệt hôm nay",    color: "#0c4a6e", bg: "#bae6fd" },
  "Four seasons":     { description: "Thực đơn 4 món Four Seasons theo mùa · 1.850.000₫/người", color: "#4c1d95", bg: "#ede9fe" },
  "Vegetarian menu":  { description: "Thực đơn thuần chay — đã xác nhận với bếp", color: "#14532d", bg: "#bbf7d0" },
  "Birthday 🎂":      { description: "Tiệc sinh nhật — chuẩn bị bánh ngạc nhiên miễn phí", color: "#92400e", bg: "#fef3c7" },
  "Anniversary ❤️":   { description: "Dịp đặc biệt — trang trí bàn và lời chào cá nhân đã sắp xếp", color: "#881337", bg: "#ffe4e6" },
  "VIP ⭐":           { description: "Khách VIP — dịch vụ ưu tiên, manager đón tiếp trực tiếp", color: "#78350f", bg: "#fef3c7" },
  "Wine pairing":     { description: "Gói kết hợp rượu vang đầy đủ · +800.000₫/người", color: "#581c87", bg: "#f3e8ff" },
  "Business":         { description: "Ăn tối công vụ — tài khoản công ty, xuất hoá đơn theo yêu cầu", color: "#1e3a5f", bg: "#dbeafe" },
  "Tasting menu":     { description: "Thực đơn nếm thử của Chef · 7 món · 2.200.000₫/người", color: "#064e3b", bg: "#d1fae5" },
  "Allergen: nuts":   { description: "⚠ Dị ứng hạt nghiêm trọng — bếp và toàn bộ nhân viên cần được cảnh báo", color: "#7f1d1d", bg: "#fee2e2" },
  "Allergen: gluten": { description: "⚠ Dị ứng gluten — có thực đơn không gluten theo yêu cầu", color: "#7f1d1d", bg: "#fee2e2" },
  "Corporate":        { description: "Nhóm doanh nghiệp — sự kiện công ty, có thể cần A/V hoặc phòng riêng", color: "#1e3a5f", bg: "#dbeafe" },
  "Team breakfast":   { description: "Bữa sáng nhóm — xác nhận số lượng 24h trước", color: "#065f46", bg: "#d1fae5" },
  "Set lunch":        { description: "Thực đơn set lunch 2 món đặt trước · 800.000₫/người", color: "#0c4a6e", bg: "#bae6fd" },
  "Yoga retreat":     { description: "Nhóm yoga retreat — ưu tiên thực đơn nhẹ", color: "#065f46", bg: "#d1fae5" },
  "Weekend special":  { description: "Ưu đãi cuối tuần — thực đơn 2 món giá cố định", color: "#0c4a6e", bg: "#bae6fd" },
  "Breakfast set":    { description: "Set sáng đặt trước — xác nhận khẩu phần ăn kiêng", color: "#92400e", bg: "#fef3c7" },
  "Vegan":            { description: "Toàn bộ thực đơn thuần thực vật theo yêu cầu", color: "#14532d", bg: "#bbf7d0" },
};

const BOOKING_ENRICHED: Record<number, BookingEnriched> = {
  301: { phone: "+84 98 123 4567", email: "alice.johnson@email.com", guestNote: "Cho mình bàn gần cửa sổ nhé? Chúng mình rất thích ngắm cảnh. Mong chờ thực đơn tối! Đây là lần thứ ba trong năm nay 🙂",
    guestFollowUps: [
      { text: "À, mình quên nói — chồng mình dị ứng nhẹ với tôm, không nghiêm trọng nhưng mong nhà hàng lưu ý nhé.", time: "Hôm qua · 21:14" },
    ],
    staffNotes: [{ author: "Maria (Lễ tân)", time: "16:30", text: "Khách VIP — Bàn 1 đã chuẩn bị nến và hoa. Alice là khách quen, gọi tên chào. Cô ấy thích nước khoáng không ga và Chablis nhà hàng." }],
    documents: [{ name: "Đặt trước thực đơn tối.pdf", kind: "menu" as const, size: "124 KB", date: "02/12/2025" }, { name: "Thực đơn tối 04-12.pdf", kind: "menu" as const, size: "380 KB", date: "04/12/2025" }, { name: "Ảnh bàn trang trí.jpg", kind: "image" as const, size: "1.2 MB", date: "04/12/2025" }],
    crm: { visits: 156, totalSpent: 42000000, lastVisit: "29/11/2025" } },
  303: { phone: "+84 93 345 6789", email: "jessica.t@email.com", guestNote: "Tiệc sinh nhật! Chồng mình không biết — có thể sắp xếp điều gì đó đặc biệt không? 🎂", staffNotes: [{ author: "Lễ tân", time: "17:15", text: "Khách không đến lúc 17:00. Gọi điện hai lần, không trả lời. Theo chính sách, tiền đặt cọc (500.000₫) bị mất. Đánh dấu no-show lúc 17:20." }], documents: [{ name: "Xác nhận đặt bàn.pdf", kind: "receipt", size: "45 KB", date: "30/11/2025" }, { name: "Biên lai đặt cọc 500.000₫.pdf", kind: "receipt", size: "28 KB", date: "30/11/2025" }], crm: { visits: 7, totalSpent: 1400000, lastVisit: "15/11/2025" } },
  304: { phone: "+84 94 456 7890", email: "clark.benson@email.com", guestNote: "Bàn 3 người, gần khu bar nếu được. Bữa tối thân mật, không cần cầu kỳ.", staffNotes: [{ author: "Lễ tân", time: "17:35", text: "Khách đến trễ 5 phút lúc 17:35. Đã an vị tại T3. Nhóm vui vẻ, gọi đồ uống trước." }], documents: [], crm: { visits: 14, totalSpent: 3100000, lastVisit: "20/11/2025" } },
  305: { phone: "+84 90 567 8901", email: "david.brown@corp.vn", guestNote: "Chúng tôi muốn thử thực đơn Four Seasons cho cả 6 người. Có thể kết hợp rượu vang theo từng món không? Một khách chỉ ăn hải sản.", staffNotes: [{ author: "Sommelier", time: "15:00", text: "Kết hợp rượu vang xác nhận cho 6 khách. Thứ tự: Chablis 1er Cru → Gevrey-Chambertin → Haut-Médoc → Sauternes." }, { author: "Bếp trưởng", time: "16:00", text: "Ghi chú thích nghi cho 1 khách ăn hải sản. Không có thịt đỏ ở món 2 & 3 cho phần đó." }], documents: [{ name: "Thực đơn Four Seasons 04-12.pdf", kind: "menu", size: "290 KB", date: "04/12/2025" }, { name: "Thẻ kết hợp rượu vang.pdf", kind: "menu", size: "180 KB", date: "04/12/2025" }, { name: "Xác nhận đặt bàn.pdf", kind: "receipt", size: "52 KB", date: "28/11/2025" }, { name: "Ảnh trang trí bàn.jpg", kind: "image", size: "890 KB", date: "04/12/2025" }, { name: "Sơ đồ chỗ ngồi.jpg", kind: "image", size: "560 KB", date: "03/12/2025" }], crm: { visits: 28, totalSpent: 6200000, lastVisit: "26/11/2025" } },
  306: { phone: "+84 97 678 9012", email: "emily.davis@email.com", guestNote: "", staffNotes: [], documents: [], crm: { visits: 3, totalSpent: 1050000, lastVisit: "01/11/2025" } },
  307: { phone: "+84 96 789 0123", email: "j.elliot@email.com", guestNote: "Hoàn toàn thuần chay — không cá, không thịt, không nước dùng thịt trong bất kỳ món nào. Rất quan trọng.", staffNotes: [{ author: "Bếp trưởng", time: "14:30", text: "Thực đơn thuần chay đã chuẩn bị. Tất cả nước sốt dùng rau củ. Đã xác nhận với toàn bộ nhà bếp. Đánh dấu T7." }], documents: [{ name: "Thực đơn thuần chay 04-12.pdf", kind: "menu", size: "185 KB", date: "04/12/2025" }], crm: { visits: 8, totalSpent: 2100000, lastVisit: "28/10/2025" } },
  308: { phone: "+84 93 890 1234", email: "sophia.w@email.com", guestNote: "Nhóm lớn ăn tối! Một khách dùng xe lăn — vui lòng đảm bảo chỗ ngồi tiếp cận được.", staffNotes: [{ author: "Quản lý", time: "18:00", text: "11 khách. Lối đi xe lăn đã sắp xếp tại T9. Vẫn chờ lúc 18:20 — đã gọi, họ sẽ đến sau ~10 phút." }], documents: [], crm: { visits: 4, totalSpent: 1400000, lastVisit: "02/12/2025" } },
  309: { phone: "+84 91 901 2345", email: "isabella.white@email.com", guestNote: "Bàn góc yên tĩnh sẽ rất tuyệt — chúng mình đang kỷ niệm thăng chức tối nay!", staffNotes: [{ author: "Lễ tân", time: "18:00", text: "Đã xếp bàn yên tĩnh. Để lại thiệp chúc mừng nhỏ trên bàn. T5 tầng một." }], documents: [], crm: { visits: 2, totalSpent: 475000, lastVisit: "28/11/2025" } },
  310: { phone: "+84 98 012 3456", email: "j.wilson@outlook.com", guestNote: "6 người ăn tối. Lần trước vui lắm — rất mong được quay lại!", staffNotes: [{ author: "Phục vụ (Karl)", time: "18:20", text: "Nhóm 6 người đã đến và an vị tại T5 khu nhà hàng. Tâm trạng tốt, gọi khai vị ngay." }], documents: [], crm: { visits: 28, totalSpent: 6200000, lastVisit: "26/11/2025" } },
  311: { phone: "+84 95 123 4567", email: "o.martinez@email.com", guestNote: "Rất mong thưởng thức lại thực đơn Four Seasons! Lần trước tuyệt vời lắm. Có thể giữ bàn cũ không?", staffNotes: [{ author: "Sommelier", time: "17:00", text: "Cũng đặt kết hợp rượu vang — đã thêm Olivia vào danh sách Four Seasons. Cùng loại rượu với bàn 305." }], documents: [{ name: "Thực đơn Four Seasons 04-12.pdf", kind: "menu", size: "290 KB", date: "04/12/2025" }, { name: "Ảnh trang trí bàn.jpg", kind: "image", size: "740 KB", date: "04/12/2025" }], crm: { visits: 11, totalSpent: 2900000, lastVisit: "10/11/2025" } },
  312: { phone: "+84 90 234 5678", email: "noah.garcia@email.com", guestNote: "Bàn cho 4 người, ăn tối.", staffNotes: [], documents: [], crm: { visits: 2, totalSpent: 475000, lastVisit: "03/12/2025" } },
  313: { phone: "+84 96 345 6789", email: "ava.thompson@email.com", guestNote: "Kỷ niệm ngày cưới! Chúng mình đến đây 3 năm liền rồi. Có thể cắm hoa trên bàn không? 💝", staffNotes: [{ author: "Quản lý", time: "18:30", text: "Đã xác nhận trang trí kỷ niệm. Hoa hồng tươi trên T7. Bếp đã chuẩn bị tráng miệng miễn phí nhỏ." }], documents: [{ name: "Gói kỷ niệm.pdf", kind: "form", size: "88 KB", date: "01/12/2025" }, { name: "Mẫu đặt trước.pdf", kind: "form", size: "44 KB", date: "01/12/2025" }, { name: "Ảnh trang trí hoa.jpg", kind: "image", size: "1.1 MB", date: "04/12/2025" }], crm: { visits: 19, totalSpent: 5900000, lastVisit: "08/11/2025" } },
};

// ── Fallback enriched data ────────────────────────────────────
function buildFallbackEnriched(b: typeof ALL_BOOKINGS[0]): BookingEnriched {
  return {
    phone: "", email: "",
    guestNote: b.tags.length > 0 ? `Guest has the following preferences: ${b.tags.join(", ")}.` : "",
    staffNotes: b.status === "noshow"
      ? [{ author: "Reception", time: b.time, text: `Guest did not arrive at ${b.time}. Booking marked as no-show.` }]
      : b.status === "reserved"
      ? [{ author: "Host", time: b.time, text: `Guest arrived at ${b.time}. Seated at ${b.section} T.${b.table}.` }]
      : [],
    documents: [],
    crm: { visits: 1, totalSpent: 0, lastVisit: "First visit" },
  };
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
function durationMins(t1: string, t2: string) {
  const [h1, m1] = t1.split(":").map(Number);
  const [h2, m2] = t2.split(":").map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

const STATUS_FLOW: Status[] = ["awaitingconfirm", "reserved", "seated", "waitingpayment", "completed"];

// ── Sub-components ────────────────────────────────────────────

function StatusPill({ status, label }: { status: Status; label: string }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: m.bg, fontSize: 12 }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.dot }} />
      <span style={{ color: m.color, fontWeight: 600 }}>{label}</span>
    </span>
  );
}

function IconGuideRow({ icon, label, description, count }: { icon: React.ReactNode; label: string; description: string; count?: number }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-800" style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
          {count !== undefined && count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700" style={{ fontSize: 10, fontWeight: 600 }}>{count}</span>
          )}
        </div>
        <p className="text-gray-500" style={{ fontSize: 11, lineHeight: 1.5 }}>{description}</p>
      </div>
    </div>
  );
}

function TagCard({ label }: { label: string }) {
  const def = typeof TAG_DEFINITIONS[label] === "function"
    ? (TAG_DEFINITIONS[label] as any)()
    : TAG_DEFINITIONS[label];
  if (!def) return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200" style={{ fontSize: 11 }}>{label}</span>;
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-xl border" style={{ borderColor: def.color + "33", backgroundColor: def.bg + "88" }}>
      <div className="px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: def.color, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</div>
      <p style={{ fontSize: 11, color: def.color, lineHeight: 1.5 }}>{def.description}</p>
    </div>
  );
}

function DocRow({ doc, onClick }: { doc: Document; onClick: () => void }) {
  const icons: Record<Document["kind"], string> = { menu: "🍽️", receipt: "🧾", form: "📋", image: "🖼️" };
  const isImage = doc.kind === "image";
  return (
    <div
      className="rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm bg-white transition-all overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {isImage && (
        <div className="w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative" style={{ height: 120 }}>
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <span style={{ fontSize: 36 }}>🖼️</span>
            <span style={{ fontSize: 10 }}>{doc.name}</span>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full px-3 py-1.5 flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600, color: "#047857" }}>
              <Eye size={12} /> Xem ảnh
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 p-3">
        {!isImage && <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shrink-0">{icons[doc.kind]}</div>}
        <div className="flex-1 min-w-0">
          <div className="text-gray-800 truncate group-hover:text-emerald-700 transition-colors" style={{ fontSize: 12, fontWeight: 500 }}>{doc.name}</div>
          <div className="text-gray-400" style={{ fontSize: 10.5 }}>{doc.size} · {doc.date}</div>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-gray-300 group-hover:text-emerald-500 transition-colors p-1" title="Xem" onClick={e => { e.stopPropagation(); onClick(); }}><Eye size={13} /></button>
          <button className="text-gray-300 hover:text-emerald-600 transition-colors p-1" title="Tải xuống" onClick={e => e.stopPropagation()}><Download size={13} /></button>
        </div>
      </div>
    </div>
  );
}

// ── Document Preview Modal ────────────────────────────────────
function DocPreviewModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const kindLabel: Record<Document["kind"], string> = { menu: "Menu", receipt: "Biên lai", form: "Biểu mẫu", image: "Hình ảnh" };
  const kindColor: Record<Document["kind"], string> = { menu: "#0d9488", receipt: "#7c3aed", form: "#2563eb", image: "#db2777" };
  const isImage = doc.kind === "image";

  // Simulated PDF pages content
  const pdfLines: Record<string, string[]> = {
    "menu": [
      "THỰC ĐƠN — " + doc.name.replace(".pdf", "").toUpperCase(),
      "",
      "🍽️  Khai vị",
      "   Súp bí đỏ nướng với kem tươi",
      "   Gỏi cuốn hải sản nhiệt đới",
      "",
      "🥩  Món chính",
      "   Bò thăn áp chảo với nấm truffle",
      "   Cá hồi nướng với rau củ mùa",
      "",
      "🍮  Tráng miệng",
      "   Bánh Soufflé sô-cô-la nóng",
      "   Kem vani Madagascar",
      "",
      "Giá: xem tag thực đơn · Phục vụ theo đặt trước",
    ],
    "receipt": [
      "BIÊN LAI / HOÁ ĐƠN",
      "─────────────────────────────",
      doc.name.replace(".pdf", ""),
      "",
      "Ngày: " + doc.date,
      "Trạng thái: Đã thanh toán ✓",
      "",
      "Chi tiết:",
      "  Đặt bàn ..............  500.000₫",
      "  Phụ thu dịch vụ .....   50.000₫",
      "─────────────────────────────",
      "  TỔNG .................  550.000₫",
      "",
      "Cảm ơn quý khách!",
    ],
    "form": [
      "BIỂU MẪU ĐẶT BÀN",
      "─────────────────────────────",
      doc.name.replace(".pdf", ""),
      "",
      "Ngày đặt: " + doc.date,
      "",
      "□ Xác nhận số lượng khách",
      "□ Thực đơn đặt trước",
      "☑ Yêu cầu đặc biệt — đã ghi nhận",
      "☑ Chính sách đặt cọc — đã ký",
      "",
      "Chữ ký khách: _______________",
      "Nhân viên xác nhận: _______________",
    ],
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: isImage ? "auto" : 480, maxWidth: "90vw", maxHeight: "85vh", animation: "fadeSlideIn 0.2s cubic-bezier(0.34,1.4,0.64,1)" }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:scale(0.94) translateY(8px);} to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">{doc.kind === "menu" ? "🍽️" : doc.kind === "receipt" ? "🧾" : doc.kind === "form" ? "📋" : "🖼️"}</span>
            <div className="min-w-0">
              <div className="text-gray-800 truncate" style={{ fontSize: 13, fontWeight: 600 }}>{doc.name}</div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded-full text-white" style={{ fontSize: 9.5, fontWeight: 700, backgroundColor: kindColor[doc.kind] }}>{kindLabel[doc.kind]}</span>
                <span className="text-gray-400" style={{ fontSize: 11 }}>{doc.size} · {doc.date}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors shrink-0 ml-2">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {isImage ? (
            // Image lightbox
            <div className="bg-gray-900 flex items-center justify-center" style={{ minHeight: 320, minWidth: 400 }}>
              <div className="flex flex-col items-center gap-4 text-gray-400 p-10">
                <span style={{ fontSize: 72 }}>🖼️</span>
                <div className="text-center">
                  <div className="text-white" style={{ fontSize: 14, fontWeight: 600 }}>{doc.name}</div>
                  <div className="text-gray-400" style={{ fontSize: 12 }}>Hình ảnh · {doc.size}</div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300" style={{ fontSize: 11 }}>Nhấn nút tải xuống để lưu file gốc</div>
              </div>
            </div>
          ) : (
            // Simulated PDF viewer
            <div className="bg-gray-100 p-4">
              <div className="bg-white rounded-lg shadow-sm p-6 mx-auto" style={{ maxWidth: 400, fontFamily: "monospace" }}>
                {(pdfLines[doc.kind] ?? [doc.name]).map((line, i) => (
                  <div key={i} style={{ fontSize: 12, lineHeight: 1.8, color: line === "" ? "transparent" : line.startsWith("─") ? "#e5e7eb" : line.startsWith("  ") ? "#374151" : "#111827", fontWeight: line.endsWith(":") || line.toUpperCase() === line ? 700 : 400, borderBottom: line.startsWith("─") ? "1px solid #e5e7eb" : undefined }}>  {line || "\u00a0"}</div>
                ))}
              </div>
              <div className="text-center mt-3 text-gray-400" style={{ fontSize: 10 }}>Trang 1 / 1 · Xem trước — tải xuống để xem đầy đủ</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <span className="text-gray-400" style={{ fontSize: 11 }}>Chia sẻ qua email cho nhân viên</span>
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white transition-colors" style={{ fontSize: 12, backgroundColor: "#10b981" }}>
            <Download size={12} /> Tải xuống
          </button>
        </div>
      </div>
    </div>
  );
}

// ── How-to: guest follow-up notes ─────────────────────────────────
function GuestNoteHowTo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 13 }}>💡</span>
          <span className="text-gray-500" style={{ fontSize: 11, fontWeight: 600 }}>Khách có thể gửi ghi chú bổ sung sau khi đặt bàn không?</span>
        </div>
        {open ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRightIcon size={13} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-gray-50 space-y-2" style={{ fontSize: 11, lineHeight: 1.7, color: "#4b5563" }}>
          <p>✅ <strong>Có.</strong> Khách nhận email xác nhận có chứa liên kết cá nhân dạng <em>"Điều chỉnh / Bổ sung yêu cầu"</em>.</p>
          <p>💬 Khách điều hướng đến trang mini cá nhân của họ, nơi họ có thể viết thêm ghi chú hoặc điều chỉnh yêu cầu (không cần tài khoản).</p>
          <p>📧 Ghi chú bổ sung sẽ hiển thị ở đây với nhãn <strong>"được gửi sau"</strong> để phân biệt với ghi chú ban đầu.</p>
          <p className="text-gray-400">⚠️ Chức năng này cần được bật trong cài đặt gửi email xác nhận → Booking Settings.</p>
        </div>
      )}
    </div>
  );
}

function NoteItem({ note, todayLabel }: { note: StaffNote; todayLabel: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
        <span style={{ fontSize: 11, fontWeight: 700, color: "#047857" }}>{note.author[0]}</span>
      </div>
      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-700" style={{ fontSize: 11, fontWeight: 600 }}>{note.author}</span>
          <span className="text-gray-400" style={{ fontSize: 10 }}>{todayLabel} {note.time}</span>
        </div>
        <p className="text-gray-600" style={{ fontSize: 12, lineHeight: 1.5 }}>{note.text}</p>
      </div>
    </div>
  );
}

const Field = ({ label, children, value, isPastMode }: { label: string; children?: React.ReactNode; value?: string; isPastMode?: boolean }) => (
  <div>
    <label className="block text-gray-500 mb-1" style={{ fontSize: 11, fontWeight: 600 }}>{label}</label>
    {isPastMode ? (
      <div className="text-gray-900 font-medium py-1.5" style={{ fontSize: 13 }}>{value || "—"}</div>
    ) : (
      children
    )}
  </div>
);

const TABLE_RANGES: Record<string, number[]> = {
  "Restaurant":  [1,2,3,4,5,6,7,8,9,10,11],
  "First floor": [1,2,3,4,5,6,7,8,9,10],
  "Terrace":     [1,2,3,4,5],
  "Bar":         [1,2,3,4,5,6,7,8],
  "Private room":[1,2,3]
};

// ── Unified Overview & Edit Tab ─────────────────────────────────
function UnifiedOverviewTab({ booking, enriched, selectedDay, onClose, onOpenCRM, onStatusChange, currentStatus, setCurrentStatus }: {
  booking: typeof ALL_BOOKINGS[0];
  enriched: BookingEnriched;
  selectedDay: number;
  onClose: () => void;
  onOpenCRM?: (name: string) => void;
  onStatusChange?: (id: number, status: Status) => void;
  currentStatus: Status | null;
  setCurrentStatus: (s: Status) => void;
}) {
  const { lang, t } = useLang();
  const te = t.edit;
  const tm = t.modal;

  const [,            setTick]        = useState(0);
  const [name,        setName]        = useState(booking.guestName);
  const [phone,       setPhone]       = useState(enriched.phone);
  const [email,       setEmail]       = useState(enriched.email);
  const [guests,      setGuests]      = useState(String(booking.guests));
  const [time,        setTime]        = useState(booking.time);
  const [endTime,     setEndTime]     = useState(booking.endTime);
  const [section,     setSection]     = useState<string>(booking.section);
  const [selectedTables, setSelectedTables] = useState<{section: string, table: number}[]>([{section: booking.section, table: booking.table}, ...(booking.additionalTables || [])]);
  const [deposit,     setDeposit]     = useState("");
  const [request,     setRequest]     = useState(enriched.guestNote);
  const [saved,       setSaved]       = useState(false);
  const [notifyGuest, setNotifyGuest] = useState(false);

  useEffect(() => {
    if (time !== booking.time || endTime !== booking.endTime || guests !== String(booking.guests)) {
      setNotifyGuest(true);
    } else {
      setNotifyGuest(false);
    }
  }, [time, endTime, guests, booking]);

  const handleTimeInput = (val: string, setter: (v: string) => void) => {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setter(`${raw.slice(0,2)}:${raw.slice(2)}`);
    } else {
      setter(raw);
    }
  };

  const handleTimeBlur = (val: string, setter: (v: string) => void) => {
    if (val.length === 4 && !val.includes(":")) {
      setter(`${val.slice(0,2)}:${val.slice(2)}`);
    }
  };

  const status = currentStatus ?? booking.status;
  const color = avatarColor(booking.guestName);
  const statusLabel = (s: Status) => t.status[s as keyof typeof t.status] ?? s;

  // Determine if booking is in the past
  const now = new Date();
  const currentDay = now.getDate();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [endH, endM] = booking.endTime.split(":").map(Number);
  
  const isPast = selectedDay < currentDay || (selectedDay === currentDay && (endH * 60 + endM) < nowMins);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }



  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-emerald-400 bg-white transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";
  const inputStyle = { fontSize: 12 };

  return (
    <div className="p-5 space-y-6">

      {/* ── Tags ── */}
      {booking.tags.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-gray-700" style={{ fontSize: 12, fontWeight: 600 }}>{tm.bookingTags}</span>
            <div className="group relative cursor-help">
              <Info size={12} className="text-gray-400" />
              <div className="absolute bottom-5 left-0 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">{tm.tagsHint}</div>
            </div>
          </div>
          <div className="space-y-2">{booking.tags.map(tag => <TagCard key={tag} label={tag} />)}</div>
        </div>
      )}


      {/* Save success / Past warning banners */}
      {isPast && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-200">
          <Info size={14} className="text-orange-500 shrink-0" />
          <span className="text-orange-700" style={{ fontSize: 12, fontWeight: 600 }}>{te.pastWarning}</span>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <Check size={14} className="text-emerald-600" />
          <span className="text-emerald-700" style={{ fontSize: 12, fontWeight: 600 }}>{te.saveSuccess}</span>
        </div>
      )}

      {/* ── Section: Thông tin khách ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
            <Users size={11} className="text-emerald-600" />
          </div>
          <span className="text-gray-700" style={{ fontSize: 12, fontWeight: 700 }}>{te.guestInfo}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={te.guestName} value={name} isPastMode={isPast}>
            <input value={name} onChange={e => setName(e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label={te.phone} value={phone} isPastMode={isPast}>
            <div className="relative">
              <Phone size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className={inputCls} style={{ ...inputStyle, paddingLeft: 28 }} />
            </div>
          </Field>
          <Field label={te.email} value={email} isPastMode={isPast}>
            <div className="relative col-span-2">
              <Mail size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={email} onChange={e => setEmail(e.target.value)}
                className={inputCls} style={{ ...inputStyle, paddingLeft: 28 }} />
            </div>
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Section: Đặt bàn ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
            <Calendar size={11} className="text-blue-600" />
          </div>
          <span className="text-gray-700" style={{ fontSize: 12, fontWeight: 700 }}>{te.bookingInfo}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label={te.time} value={time} isPastMode={isPast}>
            <input type="text" value={time} 
              onChange={e => handleTimeInput(e.target.value, setTime)} 
              onBlur={() => handleTimeBlur(time, setTime)}
              placeholder="HH:MM" maxLength={5}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label={te.endTime} value={endTime} isPastMode={isPast}>
            <input type="text" value={endTime} 
              onChange={e => handleTimeInput(e.target.value, setEndTime)} 
              onBlur={() => handleTimeBlur(endTime, setEndTime)}
              placeholder="HH:MM" maxLength={5}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label={te.guests} value={guests ? `${guests} ${t.modal.guestSuffix ?? "khách"}` : ""} isPastMode={isPast}>
            <div className="flex items-center gap-1.5 w-full">
              <button onClick={() => setGuests(g => String(Math.max(1, (parseInt(g) || 1) - 1)))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
                style={{ fontSize: 16 }}>−</button>
              <input type="number" min={1} value={guests}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) setGuests(String(val));
                  else if (e.target.value === "") setGuests("");
                }}
                onBlur={() => {
                  if (guests === "" || parseInt(guests) < 1) setGuests("1");
                }}
                inputMode="numeric" pattern="[0-9]*"
                className={`w-12 min-w-0 flex-1 border border-gray-200 rounded-lg px-2 py-2 text-center text-gray-800 focus:outline-none focus:border-emerald-400`} 
                style={{ fontSize: 13, fontWeight: 600 }} />
              <button onClick={() => setGuests(g => String((parseInt(g) || 1) + 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
                style={{ fontSize: 16 }}>+</button>
            </div>
          </Field>
          {/* Table Allocation (Multi-table UI) */}
          <div className="col-span-2 md:col-span-3 mt-1">
            <label className="block text-gray-500 mb-2" style={{ fontSize: 11, fontWeight: 600 }}>CẤP BÀN (TABLE ALLOCATION)</label>
            {isPast ? (
              <div className="flex flex-wrap gap-2 text-gray-900 font-medium py-1.5" style={{ fontSize: 13 }}>
                <span className="px-2 py-1 bg-gray-100 rounded-lg">{booking.section} T.{booking.table}</span>
                {booking.additionalTables?.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 rounded-lg">{t.section} T.{t.table}</span>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full">
                    {Object.keys(TABLE_RANGES).map(s => (
                      <button key={s} onClick={() => setSection(s)}
                        className={`flex-1 min-w-[80px] shrink-0 px-3 py-2 rounded-lg border transition-colors`}
                        style={{ fontSize: 12, fontWeight: section === s ? 600 : 500, borderColor: section === s ? "#d1d5db" : "transparent", backgroundColor: section === s ? "#f3f4f6" : "transparent", color: section === s ? "#111827" : "#6b7280" }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-wrap gap-2">
                    {TABLE_RANGES[section]?.map(t => {
                      const active = selectedTables.some(st => st.section === section && st.table === t);
                      return (
                        <button key={t} onClick={() => {
                          setSelectedTables(prev => {
                            const next = active 
                              ? prev.filter(st => !(st.section === section && st.table === t))
                              : [...prev, { section, table: t }];
                            
                            // Immediately update booking source of truth
                            if (next.length > 0) {
                                booking.section = next[0].section as any; // Cast as any or Section
                                booking.table = next[0].table;
                                booking.additionalTables = next.length > 1 ? next.slice(1).map(n => ({ section: n.section as any, table: n.table })) : undefined;
                            } else {
                                booking.additionalTables = undefined;
                            }
                            setTick(v => v + 1);
                            return next;
                          });
                        }}
                          className={`w-[52px] py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${active ? "bg-emerald-500 border-emerald-600 text-white shadow-sm" : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700"}`}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700 }}>T.{t}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedTables.length > 0 && (
                    <div className="text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg flex items-center justify-between" style={{ fontSize: 12, fontWeight: 600 }}>
                      <span>{selectedTables.length} table(s) selected: {selectedTables.map(st => `T.${st.table}`).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Field label={te.deposit} value={deposit ? `${parseInt(deposit).toLocaleString()} ₫` : ""} isPastMode={isPast}>
            <input value={deposit} onChange={e => setDeposit(e.target.value)}
              className={inputCls} style={inputStyle} placeholder={te.depositPlaceholder} />
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Section: Yêu cầu đặc biệt ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
            <MessageSquare size={11} className="text-purple-600" />
          </div>
          <span className="text-gray-700" style={{ fontSize: 12, fontWeight: 700 }}>{te.specialReq}</span>
        </div>
        {isPast ? (
            <div className="text-gray-900 border border-transparent py-1.5" style={{ fontSize: 13, lineHeight: 1.6 }}>{request || "—"}</div>
        ) : (
          <textarea value={request} onChange={e => setRequest(e.target.value)}
            rows={3}
            placeholder={te.reqPlaceholder}
            className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:border-emerald-400 resize-none bg-white transition-colors`}
            style={{ fontSize: 12 }} />
        )}
      </div>



    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────

interface BookingDetailModalProps {
  bookingId: number | null;
  initialTab?: "overview" | "messages" | "documents";
  selectedDay: number;
  onClose: () => void;
  onOpenCRM?: (name: string) => void;
  onStatusChange?: (id: number, status: Status) => void;
}
type ModalTab = "overview" | "messages" | "documents";

export function BookingDetailModal({ bookingId, initialTab = "overview", selectedDay, onClose, onOpenCRM, onStatusChange }: BookingDetailModalProps) {
  const [activeTab,     setActiveTab]     = useState<ModalTab>(initialTab);
  const [currentStatus, setCurrentStatus] = useState<Status | null>(null);
  const [newNote,       setNewNote]       = useState("");
  const [previewDoc,    setPreviewDoc]    = useState<Document | null>(null);
  const { lang, t } = useLang();
  const tm = t.modal;

  const d = new Date();
  d.setDate(selectedDay);
  const dateStr = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).format(d);

  const booking  = ALL_BOOKINGS.find(b => b.id === bookingId);
  const enriched = booking ? (BOOKING_ENRICHED[booking.id] ?? buildFallbackEnriched(booking)) : undefined;

  if (!booking || !enriched) return null;

  const status   = currentStatus ?? booking.status;
  const dur      = durationMins(booking.time, booking.endTime);
  const color    = avatarColor(booking.guestName);
  const msgCount = (enriched.guestNote ? 1 : 0) + enriched.staffNotes.length;
  const docCount = enriched.documents.length;

  const dNow     = new Date();
  const nowMins  = dNow.getHours() * 60 + dNow.getMinutes();
  const currDay  = dNow.getDate();
  const [eH, eM] = booking.endTime.split(":").map(Number);
  const isPast   = selectedDay < currDay || (selectedDay === currDay && (eH * 60 + eM) < nowMins);

  const statusLabel = (s: Status) => t.status[s as keyof typeof t.status] ?? s;

  const TABS: { id: ModalTab; label: string; badge?: number }[] = [
    { id: "overview",  label: tm.tabOverview  },
    { id: "messages",  label: tm.tabMessages,  badge: msgCount },
    { id: "documents", label: tm.tabDocuments, badge: docCount },
  ];

  const isOpen = bookingId !== null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-200"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", pointerEvents: isOpen ? "auto" : "none", opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden w-full sm:w-[540px] lg:max-w-[40vw]"
        style={{ 
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          pointerEvents: isOpen ? "auto" : "none" 
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="px-5 pt-5 pb-3 shrink-0 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: color, fontSize: 16, fontWeight: 700 }}>{initials(booking.guestName)}</div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-gray-900" style={{ fontSize: 17, fontWeight: 700 }}>{booking.guestName}</h2>
                  <StatusPill status={status} label={statusLabel(status)} />
                </div>
                <div className="flex items-center gap-2 mt-1 text-gray-500 flex-wrap" style={{ fontSize: 11 }}>
                  <span className="flex items-center gap-1"><Calendar size={11} /> {dateStr}</span>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {booking.time} – {booking.endTime} ({dur} {tm.minSuffix})</span>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {booking.section} · {tm.tableLabel} {booking.table}</span>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {booking.guests} {tm.guestSuffix}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors shrink-0">
              <X size={15} />
            </button>
          </div>

          {/* Lifecycle bar */}
          <div className="flex items-center gap-1 mt-3">
            {(["awaitingconfirm","reserved","seated","waitingpayment","completed"] as Status[]).map((s, i) => {
              const m = STATUS_META[s];
              const isActive = s === status;
              const isPast   = STATUS_FLOW.indexOf(s) < STATUS_FLOW.indexOf(status);
              const isNoShow = status === "noshow";
              return (
                <React.Fragment key={s}>
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all cursor-pointer"
                    style={{ backgroundColor: isActive ? m.bg : isPast ? "#f0fdf4" : "#f9fafb", opacity: isNoShow ? 0.4 : 1 }}
                    onClick={() => !isNoShow && setCurrentStatus(s)}
                    title={statusLabel(s)}
                  >
                    {isPast || isActive
                      ? <CheckCircle2 size={12} style={{ color: isPast ? "#10b981" : m.dot }} />
                      : <Circle size={12} className="text-gray-300" />}
                    <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500, color: isActive ? m.color : isPast ? "#059669" : "#9ca3af" }}>
                      {statusLabel(s)}
                    </span>
                  </div>
                  {i < 4 && <ArrowRight size={10} className="text-gray-300 shrink-0" />}
                </React.Fragment>
              );
            })}
            {status === "noshow" && (
              <>
                <ArrowRight size={10} className="text-gray-300 shrink-0" />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-600" style={{ fontSize: 10.5, fontWeight: 700 }}>{statusLabel("noshow")}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex border-b border-gray-100 px-5 shrink-0 bg-white">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors relative ${activeTab === tab.id ? "text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}
              style={{ fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400 }}>
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: 9.5, fontWeight: 700, backgroundColor: activeTab === tab.id ? "#d1fae5" : "#f3f4f6", color: activeTab === tab.id ? "#047857" : "#6b7280" }}>
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
          ))}
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto">

        {/* ═══ OVERVIEW ═══ */}
          {activeTab === "overview" && (
            <UnifiedOverviewTab 
                booking={booking} 
                enriched={enriched} 
                selectedDay={selectedDay} 
                onClose={onClose} 
                onOpenCRM={onOpenCRM}
                onStatusChange={onStatusChange}
                currentStatus={currentStatus}
                setCurrentStatus={setCurrentStatus}
            />
          )}

          {/* ═══ MESSAGES ═══ */}
          {activeTab === "messages" && (
            <div className="p-5 space-y-5">

              {/* ① Booking note from guest */}
              {enriched.guestNote ? (
                <div>
                  <div className="text-gray-500 mb-2 flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <MessageSquare size={11} /> Ghi chú đặt bàn (từ khách)
                  </div>
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: color, fontSize: 10, fontWeight: 700 }}>{initials(booking.guestName)}</div>
                    <div className="flex-1 bg-white rounded-xl px-3.5 py-3 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-700" style={{ fontSize: 11, fontWeight: 600 }}>{booking.guestName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600" style={{ fontSize: 9.5, fontWeight: 600 }}>Lúc đặt bàn</span>
                      </div>
                      <p className="text-gray-600" style={{ fontSize: 12, lineHeight: 1.6 }}>"{enriched.guestNote}"</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <MessageSquare size={12} className="text-gray-300" />
                  <span className="text-gray-400" style={{ fontSize: 11 }}>Khách không để lại ghi chú khi đặt bàn.</span>
                </div>
              )}

              {/* ② Guest follow-ups (added after booking) */}
              {enriched.guestFollowUps && enriched.guestFollowUps.length > 0 && (
                <div>
                  <div className="text-gray-500 mb-2 flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <MessageSquare size={11} className="text-indigo-400" /> Ghi chú bổ sung (khách gửi sau)
                  </div>
                  <div className="space-y-2">
                    {enriched.guestFollowUps.map((f, i) => (
                      <div key={i} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: color, fontSize: 10, fontWeight: 700 }}>{initials(booking.guestName)}</div>
                        <div className="flex-1 bg-indigo-50 rounded-xl px-3.5 py-3 border border-indigo-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-indigo-700" style={{ fontSize: 11, fontWeight: 600 }}>{booking.guestName}</span>
                            <span className="text-indigo-400" style={{ fontSize: 10 }}>{f.time}</span>
                          </div>
                          <p className="text-indigo-800" style={{ fontSize: 12, lineHeight: 1.6 }}>"{f.text}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ③ How-to: how can guests add notes after booking */}
              <GuestNoteHowTo />

              {/* ④ Staff notes */}
              {enriched.staffNotes.length > 0 && (
                <div>
                  <div className="text-gray-500 mb-2 flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <Edit3 size={11} /> {tm.staffNotes}
                  </div>
                  <div className="space-y-3">
                    {enriched.staffNotes.map((n, i) => <NoteItem key={i} note={n} todayLabel={tm.today} />)}
                  </div>
                </div>
              )}

              {/* ⑤ Add staff note */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Edit3 size={12} className="text-gray-400" />
                  <div className="text-gray-600" style={{ fontSize: 12, fontWeight: 600 }}>Thêm ghi chú nội bộ (chỉ nhân viên thấy)</div>
                </div>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                  placeholder="VD: Khách cần hỗ trợ đặc biệt, sở thích chỗ ngồi, thông tin dị ứng bổ sung..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:border-emerald-400 resize-none bg-gray-50"
                  style={{ fontSize: 12 }} rows={3} />
                <div className="flex justify-end mt-2">
                  <button disabled={!newNote.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white transition-all disabled:opacity-40"
                    style={{ fontSize: 12, backgroundColor: "#10b981" }}>
                    <Send size={12} /> {tm.addNoteBtn}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* ═══ DOCUMENTS ═══ */}
          {activeTab === "documents" && (
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-1.5 p-3 rounded-xl bg-purple-50 border border-purple-100">
                <Info size={13} className="text-purple-500 mt-0.5 shrink-0" />
                <p className="text-purple-700" style={{ fontSize: 11, lineHeight: 1.5 }}>
                  <strong>{tm.tabDocuments}</strong> — {tm.docsInfo}
                </p>
              </div>

              {enriched.documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                  <FileText size={30} className="text-gray-200" />
                  <p style={{ fontSize: 13 }}>{tm.noDocs}</p>
                  <p style={{ fontSize: 11 }}>{tm.noDocsSub}</p>
                </div>
              ) : (
                <div className="space-y-2">{enriched.documents.map((d, i) => <DocRow key={i} doc={d} onClick={() => setPreviewDoc(d)} />)}</div>
              )}

              <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors" style={{ fontSize: 12 }}>
                <PaperclipIcon size={14} /> {tm.attachFile}
              </button>
            </div>
          )}


        </div>

        {/* ── Sticky 2-row footer (overview tab only) ── */}
        {activeTab === "overview" && (
          <div className="shrink-0 bg-white border-t border-gray-100">
            {/* Row 1: Primary actions */}
            <div className="flex items-center justify-between px-5 py-3">
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ fontSize: 13 }}>Close</button>
              <div className="flex gap-2">
                <button disabled={isPast}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ fontSize: 12 }}>Delete</button>
                <button disabled={isPast}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  style={{ fontSize: 13, fontWeight: 600, backgroundColor: "#6366f1" }}>
                  <Check size={13} /> Save Changes
                </button>
              </div>
            </div>
            {/* Row 2: Status progression pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap px-5 py-2.5 border-t border-gray-100">
              {(["awaitingconfirm","reserved","seated","waitingpayment","completed"] as Status[]).map((s, i, arr) => {
                const m = STATUS_META[s];
                const isActive = s === status;
                return (
                  <React.Fragment key={s}>
                    <button
                      onClick={() => { setCurrentStatus(s); if (onStatusChange) onStatusChange(booking.id, s); }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full border-2 transition-all"
                      style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500, borderColor: isActive ? m.dot : "#e5e7eb", backgroundColor: isActive ? m.bg : "transparent", color: isActive ? m.color : "#9ca3af" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.dot }} />
                      {m.label}
                      {isActive && <Check size={10} />}
                    </button>
                    {i < arr.length - 1 && <span className="text-gray-300" style={{ fontSize: 9 }}>›</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* Document preview overlay */}
      {previewDoc && <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </>
  );
}
