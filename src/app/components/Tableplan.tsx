import React, { useState, useMemo } from "react";
import { Users, Plus, Clock, X, MousePointer2 } from "lucide-react";
import {
  ALL_BOOKINGS, STATUS_META, getBookingsForDay,
  type Booking, type Section, type Status,
} from "../data/bookings";

// ── Clip path & chair constants ───────────────────────────────────
const OCTAGON = "polygon(29.3% 0%,70.7% 0%,100% 29.3%,100% 70.7%,70.7% 100%,29.3% 100%,0% 70.7%,0% 29.3%)";
const CD = 11; // chair depth
const CG = 5;  // chair gap
const CW = 18; // chair width

// ── Chair rendering ───────────────────────────────────────────────
function Chairs({ count, tableW, tableH, side, color }: {
  count: number; tableW: number; tableH: number; side: "top"|"bottom"|"left"|"right"; color: string;
}) {
  const horiz = side === "top" || side === "bottom";
  const span  = horiz ? tableW : tableH;
  const step  = span / count;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const off = step * i + (step - CW) / 2;
        const s: React.CSSProperties = horiz
          ? { position:"absolute", left:off, width:CW, height:CD,
              ...(side==="top"    ? { bottom:"100%", marginBottom:CG } : { top:"100%", marginTop:CG }),
              borderRadius: side==="top" ? "4px 4px 0 0" : "0 0 4px 4px" }
          : { position:"absolute", top:off, width:CD, height:CW,
              ...(side==="left"   ? { right:"100%", marginRight:CG } : { left:"100%", marginLeft:CG }),
              borderRadius: side==="left" ? "4px 0 0 4px" : "0 4px 4px 0" };
        return <div key={i} style={{ ...s, backgroundColor: color, opacity:0.82, boxShadow:"0 1px 2px rgba(0,0,0,0.15)" }} />;
      })}
    </>
  );
}

function RadialChairs({ count, radius, color }: { count: number; radius: number; color: string }) {
  return (
    <div style={{ position: "absolute", left: radius, top: radius }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (360 / count) * i;
        const dist = radius + CG;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: CW,
              height: CD,
              left: -CW / 2,
              top: -dist - CD,
              backgroundColor: color,
              opacity: 0.82,
              borderRadius: "4px 4px 0 0",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
              transformOrigin: `50% ${dist + CD}px`,
              transform: `rotate(${angle}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Table definitions ─────────────────────────────────────────────
interface TableDef {
  id: string;
  number: number;
  capacity: number;
  shape: "rect"|"circle"|"octagon";
  section: Section;
  x: number; y: number; w: number; h: number;
  top?: number; bottom?: number; left?: number; right?: number;
  linkedGroup?: string;
}

// Zone offsets: 2×2 grid — Restaurant (TL), First floor (TR), Terrace (BL), Bar (BR)
const ZONE: Record<Section, { dx:number; dy:number; label:string; bg:string; labelColor:string }> = {
  Restaurant:    { dx:0,   dy:0,   label:"Restaurant",  bg:"#f0fdf4", labelColor:"#166534" },
  "First floor": { dx:870, dy:0,   label:"First Floor", bg:"#eff6ff", labelColor:"#1e40af" },
  Terrace:       { dx:0,   dy:590, label:"Terrace",     bg:"#fefce8", labelColor:"#854d0e" },
  Bar:           { dx:870, dy:590, label:"Bar",         bg:"#fdf4ff", labelColor:"#7e22ce" },
};
const ZONE_W = 830;
const ZONE_H = 550;

const LOCAL_TABLES: Record<Section, Omit<TableDef,"section">[]> = {
  Restaurant: [
    { id:"r1",  number:1,  capacity:4, shape:"rect",    x:55,  y:60,  w:122, h:64,  top:2, bottom:2 },
    { id:"r2",  number:2,  capacity:4, shape:"rect",    x:205, y:60,  w:122, h:64,  top:2, bottom:2 },
    { id:"r3",  number:3,  capacity:4, shape:"rect",    x:355, y:60,  w:122, h:64,  top:2, bottom:2 },
    { id:"r4",  number:4,  capacity:6, shape:"rect",    x:510, y:60,  w:172, h:64,  top:3, bottom:3 },
    { id:"r8a", number:8,  capacity:4, shape:"octagon", x:718, y:52,  w:68,  h:68  },
    { id:"r8b", number:8,  capacity:6, shape:"octagon", x:40,  y:186, w:118, h:118 },
    { id:"r5",  number:5,  capacity:6, shape:"octagon", x:215, y:186, w:118, h:118 },
    { id:"r10", number:10, capacity:4, shape:"rect",    x:390, y:170, w:80,  h:130, left:2, right:2 },
    { id:"r8c", number:8,  capacity:4, shape:"octagon", x:565, y:208, w:94,  h:94  },
    { id:"r6a", number:6,  capacity:3, shape:"circle",  x:270, y:335, w:68,  h:68  },
    { id:"r6b", number:6,  capacity:3, shape:"circle",  x:372, y:335, w:68,  h:68  },
    { id:"r9",  number:9,  capacity:6, shape:"rect",    x:28,  y:430, w:172, h:76,  top:3, bottom:3 },
    { id:"r11a",number:11, capacity:4, shape:"rect",    x:225, y:430, w:118, h:76,  top:2, bottom:2, linkedGroup:"g11" },
    { id:"r11b",number:11, capacity:4, shape:"rect",    x:367, y:430, w:118, h:76,  top:2, bottom:2, linkedGroup:"g11" },
    { id:"r11c",number:11, capacity:4, shape:"rect",    x:509, y:430, w:118, h:76,  top:2, bottom:2, linkedGroup:"g11" },
    { id:"r8d", number:8,  capacity:4, shape:"octagon", x:718, y:430, w:68,  h:68  },
  ],
  "First floor": [
    { id:"f1",  number:1,  capacity:4, shape:"rect",    x:55,  y:60,  w:120, h:62,  top:2, bottom:2 },
    { id:"f2",  number:2,  capacity:4, shape:"rect",    x:205, y:60,  w:120, h:62,  top:2, bottom:2 },
    { id:"f3",  number:3,  capacity:4, shape:"rect",    x:355, y:60,  w:120, h:62,  top:2, bottom:2 },
    { id:"f4",  number:4,  capacity:6, shape:"rect",    x:510, y:60,  w:160, h:62,  top:3, bottom:3 },
    { id:"f5",  number:5,  capacity:4, shape:"rect",    x:55,  y:190, w:120, h:62,  top:2, bottom:2 },
    { id:"f6",  number:6,  capacity:4, shape:"rect",    x:205, y:190, w:120, h:62,  top:2, bottom:2 },
    { id:"f7",  number:7,  capacity:8, shape:"rect",    x:355, y:170, w:180, h:82,  top:3, bottom:3, left:1, right:1 },
    { id:"f8",  number:8,  capacity:4, shape:"octagon", x:55,  y:310, w:100, h:100 },
    { id:"f9",  number:9,  capacity:6, shape:"rect",    x:210, y:315, w:160, h:70,  top:3, bottom:3 },
    { id:"f10", number:10, capacity:4, shape:"circle",  x:430, y:310, w:80,  h:80  },
  ],
  Terrace: [
    { id:"te1", number:1,  capacity:2, shape:"circle",  x:75,  y:80,  w:72,  h:72  },
    { id:"te2", number:2,  capacity:2, shape:"circle",  x:200, y:80,  w:72,  h:72  },
    { id:"te3", number:3,  capacity:4, shape:"rect",    x:340, y:62,  w:130, h:64,  top:2, bottom:2 },
    { id:"te4", number:4,  capacity:4, shape:"rect",    x:510, y:62,  w:130, h:64,  top:2, bottom:2 },
    { id:"te5", number:5,  capacity:6, shape:"rect",    x:55,  y:212, w:180, h:72,  top:3, bottom:3 },
    { id:"te6", number:6,  capacity:2, shape:"circle",  x:295, y:202, w:72,  h:72  },
    { id:"te7", number:7,  capacity:6, shape:"octagon", x:415, y:190, w:110, h:110 },
    { id:"te8", number:8,  capacity:4, shape:"rect",    x:55,  y:360, w:140, h:64,  top:2, bottom:2 },
    { id:"te9", number:9,  capacity:4, shape:"rect",    x:240, y:360, w:140, h:64,  top:2, bottom:2 },
    { id:"te10",number:10, capacity:6, shape:"rect",    x:425, y:345, w:180, h:84,  top:3, bottom:3 },
  ],
  Bar: [
    { id:"b1",  number:1,  capacity:2, shape:"circle",  x:75,  y:80,  w:76,  h:76  },
    { id:"b2",  number:2,  capacity:2, shape:"circle",  x:210, y:80,  w:76,  h:76  },
    { id:"b3",  number:3,  capacity:2, shape:"circle",  x:345, y:80,  w:76,  h:76  },
    { id:"b4",  number:4,  capacity:2, shape:"circle",  x:480, y:80,  w:76,  h:76  },
    { id:"b5",  number:5,  capacity:4, shape:"rect",    x:75,  y:225, w:130, h:66,  top:2, bottom:2 },
    { id:"b6",  number:6,  capacity:4, shape:"rect",    x:250, y:225, w:130, h:66,  top:2, bottom:2 },
    { id:"b7",  number:7,  capacity:6, shape:"rect",    x:425, y:208, w:170, h:82,  top:3, bottom:3 },
    { id:"b8",  number:8,  capacity:4, shape:"octagon", x:130, y:362, w:95,  h:95  },
    { id:"b9",  number:9,  capacity:4, shape:"octagon", x:285, y:362, w:95,  h:95  },
    { id:"b10", number:10, capacity:4, shape:"rect",    x:445, y:368, w:130, h:68,  top:2, bottom:2 },
  ],
};

// Build flat canvas-coord table list (section → apply zone offset)
const ALL_DEFS: TableDef[] = (Object.entries(LOCAL_TABLES) as [Section, Omit<TableDef,"section">[]][]).flatMap(
  ([sec, defs]) => defs.map(d => ({
    ...d, section:sec,
    x: d.x + ZONE[sec].dx, y: d.y + ZONE[sec].dy,
  }))
);

// ── Helpers ───────────────────────────────────────────────────────
function minToTime(m: number) { return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }
function getActiveBooking(def: TableDef, day: number, atMin: number): Booking|undefined {
  return getBookingsForDay(day).find(b => {
    const onTable = (b.section===def.section && b.table===def.number)
      || b.additionalTables?.some(t => t.section===def.section && t.table===def.number);
    if (!onTable) return false;
    const [sh,sm] = b.time.split(":").map(Number);
    const [eh,em] = b.endTime.split(":").map(Number);
    return atMin >= sh*60+sm && atMin < eh*60+em;
  });
}

// ── FloorTable ────────────────────────────────────────────────────
function FloorTable({ def, booking, nowMin, dragTarget, selected = false,
  onClickEmpty, onClickBooking, onDragStart, onDrop, onDragOver,
}: {
  def: TableDef; booking?: Booking; nowMin: number; dragTarget: boolean; selected?: boolean;
  onClickEmpty: (d: TableDef, e: React.MouseEvent) => void; onClickBooking: (id: number) => void;
  onDragStart: (bId:number,dId:string)=>void; onDrop:(dId:string)=>void; onDragOver:(e:React.DragEvent)=>void;
}) {
  const isEmpty  = !booking;
  const status   = booking?.status as Status|null;
  const meta     = status ? STATUS_META[status] : null;
  const fillDot  = meta ? meta.dot  : "#d1d5db";
  const fillBg   = meta ? meta.bg   : "#ffffff";
  const fillText = meta ? meta.color : "#9ca3af";

  const startMin = booking ? (() => { const [h,m]=booking.time.split(":").map(Number); return h*60+m; })() : 0;
  const minsToStart = startMin - nowMin;
  const isNoShow = booking?.status === "noshow";
  const isLate   = !isEmpty && booking!.status==="awaitingconfirm" && minsToStart < 0;
  const isSoon   = !isEmpty && booking!.status==="awaitingconfirm" && minsToStart>=0 && minsToStart<=20;

  const borderColor = selected ? "#10b981" : dragTarget ? "#3b82f6" : isEmpty ? "#e5e7eb" : fillDot;
  const borderW     = selected ? 3 : dragTarget ? 3 : isEmpty ? 1.5 : 2;
  const actualBg    = selected ? "#ecfdf5" : fillBg;
  const actualText  = selected ? "#047857" : fillText;

  const initials = booking ? booking.guestName.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase() : null;

  // Chair color: muted status color for occupied, slate for empty
  const chairColor = isEmpty ? (selected ? "#10b981" : "#cbd5e1") : fillDot;

  return (
    <div style={{ position:"absolute", left:def.x, top:def.y, width:def.w, height:def.h, transition:"opacity 0.2s" }}
      onDragOver={onDragOver} onDrop={e => { e.preventDefault(); onDrop(def.id); }}>

      {/* Chairs for Rectangles */}
      {def.shape === "rect" && (
        <>
          {def.top    && <Chairs count={def.top}    tableW={def.w} tableH={def.h} side="top"    color={chairColor} />}
          {def.bottom && <Chairs count={def.bottom} tableW={def.w} tableH={def.h} side="bottom" color={chairColor} />}
          {def.left   && <Chairs count={def.left}   tableW={def.w} tableH={def.h} side="left"   color={chairColor} />}
          {def.right  && <Chairs count={def.right}  tableW={def.w} tableH={def.h} side="right"  color={chairColor} />}
        </>
      )}

      {/* Radial Chairs for circle / octagon */}
      {(def.shape === "circle" || def.shape === "octagon") && (
        <RadialChairs count={def.capacity} radius={def.w / 2} color={chairColor} />
      )}

      {/* Table surface */}
      <div
        className="select-none flex flex-col items-center justify-center transition-all duration-150 group"
        draggable={!isEmpty}
        onDragStart={e => { if (booking) { e.dataTransfer.setData("text/plain",""); onDragStart(booking.id, def.id); } }}
        onClick={(e) => isEmpty ? onClickEmpty(def, e) : onClickBooking(booking!.id)}
        style={{
          width:def.w, height:def.h, position:"relative",
          backgroundColor: isEmpty ? (selected ? actualBg : "white") : actualBg,
          border:`${borderW}px solid ${borderColor}`,
          borderRadius: def.shape==="circle"?"50%":def.shape==="rect"?"10px":"0",
          clipPath: def.shape==="octagon" ? OCTAGON : undefined,
          boxShadow: dragTarget
            ? `0 0 0 4px #3b82f640, 0 4px 16px rgba(59,130,246,0.2)`
            : isEmpty ? "0 1px 3px rgba(0,0,0,0.06)" : `0 2px 10px ${fillDot}35`,
          cursor: isEmpty ? "crosshair" : "grab",
        }}
        title={booking
          ? `${booking.guestName} · ${booking.guests} pax · ${booking.time}–${booking.endTime} · ${meta?.label}`
          : `T.${def.number} — Available (${def.capacity} seats)`}
      >
        {/* Table number */}
        <span style={{ color:actualText, fontSize:def.w<75?13:def.w>130?20:16, fontWeight:800, lineHeight:1 }}>
          {def.number}
        </span>

        {/* Guest info */}
        {!isEmpty && booking && (
          <>
            <div style={{ color:actualText, fontSize:def.w<75?8:10, fontWeight:600, marginTop:2, opacity:0.88,
              maxWidth:def.w-10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"center", paddingInline:4 }}>
              {def.w<82 ? initials : booking.guestName.split(" ")[0]}
            </div>
            <div style={{ color:actualText, fontSize:def.w<75?7.5:9, display:"flex", alignItems:"center", gap:2, marginTop:2, opacity:0.65 }}>
              <Users size={def.w<75?7:8} />
              <span>{booking.guests}/{def.capacity}</span>
              <span style={{ opacity:0.5 }}>·</span>
              <span>{booking.time}</span>
            </div>
          </>
        )}

        {/* Empty hint */}
        {isEmpty && (
          <div style={{ color:"#cbd5e1", fontSize:def.w<75?7.5:9, marginTop:2, display:"flex", alignItems:"center", gap:1.5 }}>
            <Plus size={def.w<75?8:9} /> <span>Walk-in</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{ backgroundColor: isEmpty?"rgba(59,130,246,0.07)":"rgba(0,0,0,0.11)",
            borderRadius:"inherit", clipPath:def.shape==="octagon"?OCTAGON:undefined }}>
          <span style={{ color:"white", fontSize:9, fontWeight:800, textShadow:"0 1px 3px rgba(0,0,0,0.5)" }}>
            {isEmpty?"ADD":"VIEW"}
          </span>
        </div>
      </div>

      {/* Alert corner badges */}
      {isNoShow && <div style={{ position:"absolute",top:-6,right:-6,width:15,height:15,borderRadius:"50%",backgroundColor:"#F44336",border:"2.5px solid white",zIndex:10,animation:"tpPulse 1.4s ease-in-out infinite" }} />}
      {isLate && !isNoShow && <div style={{ position:"absolute",top:-6,right:-6,width:15,height:15,borderRadius:"50%",backgroundColor:"#f97316",border:"2.5px solid white",zIndex:10 }} />}
      {isSoon && !isLate && !isNoShow && <div style={{ position:"absolute",top:-6,right:-6,width:15,height:15,borderRadius:"50%",backgroundColor:"#eab308",border:"2.5px solid white",zIndex:10 }} />}
    </div>
  );
}

// ── Linked-group bounding box ─────────────────────────────────────
function LinkedBox({ defs, onUnlink }: { defs: TableDef[], onUnlink: () => void }) {
  if (defs.length < 2) return null;
  const p=14, x1=Math.min(...defs.map(d=>d.x))-p, y1=Math.min(...defs.map(d=>d.y))-p;
  const x2=Math.max(...defs.map(d=>d.x+d.w))+p, y2=Math.max(...defs.map(d=>d.y+d.h))+p;
  return (
    <div style={{ position:"absolute",left:x1,top:y1,width:x2-x1,height:y2-y1,
      border:"2px dashed #818cf8",borderRadius:16,pointerEvents:"none",zIndex:0 }}>
      
      {/* Label and button wrapper with pointer-events auto */}
      <div style={{ position:"absolute",top:-13,left:10,pointerEvents:"auto" }} className="flex items-center gap-2">
        <div style={{ backgroundColor:"#6366f1",color:"white",fontSize:9.5,fontWeight:700,padding:"2px 8px",borderRadius:20 }}>
          Merged Group
        </div>
        <button
          onClick={onUnlink}
          className="bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm rounded-full p-0.5 border border-gray-100"
          title="Detach tables"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// ── Zone backdrop ─────────────────────────────────────────────────
function ZoneBg({ sec, isAll }: { sec: Section, isAll: boolean }) {
  const z = ZONE[sec];
  const x = isAll ? z.dx : 0;
  const y = isAll ? z.dy : 0;
  return (
    <div style={{ position:"absolute",left:x,top:y,width:ZONE_W,height:ZONE_H,
      backgroundColor:z.bg,borderRadius:0,pointerEvents:"none",zIndex:0,
      borderRight:isAll&&(sec==="Restaurant"||sec==="Terrace")?"2px solid rgba(0,0,0,0.06)":undefined,
      borderBottom:isAll&&(sec==="Restaurant"||sec==="First floor")?"2px solid rgba(0,0,0,0.06)":undefined,
    }}>
      {/* Zone label watermark */}
      <div style={{ position:"absolute",bottom:14,right:20,fontSize:24,fontWeight:900,
        color:z.labelColor+"18",letterSpacing:"0.08em",textTransform:"uppercase",userSelect:"none" }}>
        {z.label}
      </div>
      {/* Zone label pill top-left */}
      <div style={{ position:"absolute",top:12,left:16,fontSize:11,fontWeight:700,
        color:z.labelColor,backgroundColor:z.labelColor+"22",padding:"3px 10px",borderRadius:20 }}>
        {z.label}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
type AreaFilter = "All" | Section;

interface TableplanProps {
  period: string;
  day: number;
  onBookingClick?: (id: number) => void;
  onWalkinRequest?: (tables: { section: Section, table: number }[], time: string) => void;
  forceRender?: number;
}

export function Tableplan({ day, onBookingClick, onWalkinRequest }: TableplanProps) {
  const nowDate = new Date();
  const nowMinsActual = nowDate.getHours() * 60 + nowDate.getMinutes();

  const [areaFilter, setAreaFilter] = useState<AreaFilter>("All");
  const [sliderMin, setSliderMin]   = useState(nowMinsActual);
  const [dragFromId, setDragFromId] = useState<string|null>(null);
  const [dragOverId, setDragOverId] = useState<string|null>(null);
  const [unlinkedGroups, setUnlinkedGroups] = useState<Set<string>>(new Set());
  const [, setTick] = useState(0);

  const [selectedEmptyTables, setSelectedEmptyTables] = useState<TableDef[]>([]);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);

  const atMin = sliderMin;
  const isAll = areaFilter === "All";

  // Calculate coordinates dynamically based on current areaFilter
  const visibleDefs = useMemo(() => {
    return ALL_DEFS.map(d => {
      const x = isAll ? d.x : d.x - ZONE[d.section].dx;
      const y = isAll ? d.y : d.y - ZONE[d.section].dy;
      return { ...d, x, y };
    }).filter(d => isAll || d.section === areaFilter);
  }, [areaFilter, isAll]);

  const tableBookings = useMemo(() => {
    const map: Record<string,Booking> = {};
    for (const def of visibleDefs) {
      const b = getActiveBooking(def, day, atMin);
      if (b) map[def.id] = b;
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleDefs, day, atMin]);

  const visibleGroups = useMemo(() => {
    const g: Record<string,TableDef[]> = {};
    
    // 1. Static physical linked groups from layout
    for (const d of visibleDefs) {
      if (d.linkedGroup && !unlinkedGroups.has(d.linkedGroup)) {
        g[d.linkedGroup]??=[]; g[d.linkedGroup].push(d);
      }
    }
    
    // 2. Dynamic groups from active bookings sharing tables
    const activeBookingIds = new Set<number>();
    for (const d of visibleDefs) {
      const b = tableBookings[d.id];
      if (b && b.additionalTables && b.additionalTables.length > 0) {
        if (!unlinkedGroups.has(`booking-${b.id}`)) {
          activeBookingIds.add(b.id);
        }
      }
    }
    
    for (const bId of activeBookingIds) {
      const b = ALL_BOOKINGS.find(x => x.id === bId);
      if (!b) continue;
      
      const parts = [
        { section: b.section, table: b.table },
        ...(b.additionalTables || [])
      ];
      
      const groupDefs: TableDef[] = [];
      for (const p of parts) {
        const matchingDef = visibleDefs.find(vd => vd.section === p.section && vd.number === p.table);
        if (matchingDef) groupDefs.push(matchingDef);
      }
      
      if (groupDefs.length > 1) {
        const groupId = `booking-${b.id}`;
        // Tag the first element so LinkedBox can access the generated groupId
        g[groupId] = groupDefs.map((def, idx) => idx === 0 ? { ...def, linkedGroup: groupId } : def);
      }
    }
    
    return g;
  }, [visibleDefs, unlinkedGroups, tableBookings]);

  function handleDrop(toId: string) {
    const fromB = dragFromId ? tableBookings[dragFromId] : null;
    if (!fromB || !dragFromId || dragFromId===toId) { setDragFromId(null); setDragOverId(null); return; }
    if (tableBookings[toId]) { setDragFromId(null); setDragOverId(null); return; }
    const toDef = ALL_DEFS.find(d=>d.id===toId); // Look up true section/number from ALL_DEFS
    if (!toDef) { setDragFromId(null); setDragOverId(null); return; }
    const b = ALL_BOOKINGS.find(x=>x.id===fromB.id);
    if (b) { b.table = toDef.number; b.section = toDef.section; }
    setDragFromId(null); setDragOverId(null); setTick(v=>v+1);
  }

  const occupied  = visibleDefs.filter(d=>tableBookings[d.id]).length;
  const available = visibleDefs.length - occupied;

  const AREA_TABS: AreaFilter[] = ["All", "Restaurant", "First floor", "Terrace", "Bar"];
  const ALL_STATUSES = Object.keys(STATUS_META) as Status[];

  const CANVAS_W = isAll ? ZONE_W * 2 : ZONE_W;
  const CANVAS_H = isAll ? ZONE_H * 2 : ZONE_H;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor:"#f1f5f9" }}>
      <style>{`@keyframes tpPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }`}</style>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-200 bg-white shrink-0 flex-wrap">

        {/* Area filter tabs */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-gray-100">
          {AREA_TABS.map(tab => {
            const active = areaFilter===tab;
            const z = tab!=="All" ? ZONE[tab as Section] : null;
            return (
              <button key={tab} onClick={()=>setAreaFilter(tab)}
                className="px-3 py-1 rounded-lg text-sm transition-all"
                style={{
                  fontSize:11.5, fontWeight:active?700:500,
                  backgroundColor:active?(z?z.bg+"cc":"white"):"transparent",
                  color:active?(z?z.labelColor:"#0f766e"):"#6b7280",
                  boxShadow:active?"0 1px 3px rgba(0,0,0,0.12)":"none",
                }}>
                {tab==="All"?"🗺 All":tab}
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Time slider */}
        <div className="flex items-center gap-2 flex-1" style={{ minWidth:0, maxWidth:300 }}>
          <Clock size={12} className="text-gray-400 shrink-0" />
          <span style={{ fontSize:11, color:"#6b7280", whiteSpace:"nowrap" }}>View at</span>
          <input type="range" min={6*60} max={23*60} step={15} value={sliderMin}
            onChange={e=>setSliderMin(Number(e.target.value))}
            className="flex-1 cursor-pointer" style={{ accentColor:"#00BCD4", height:4 }} />
          <span className="shrink-0 px-2 py-0.5 rounded-lg" style={{ fontSize:12,fontWeight:700,color:"#006064",backgroundColor:"#e0f7fa",minWidth:40,textAlign:"center" }}>
            {minToTime(sliderMin)}
          </span>
          <button onClick={()=>setSliderMin(nowMinsActual)}
            className="shrink-0 px-2 py-0.5 rounded-lg border hover:bg-blue-50 transition-colors"
            style={{ fontSize:10.5,fontWeight:600,color:"#3b82f6",borderColor:"#bfdbfe" }}>
            Now
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Multi-select toggle */}
        <button onClick={() => { setIsMultiSelecting(!isMultiSelecting); setSelectedEmptyTables([]); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${isMultiSelecting ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          style={{ fontSize: 11.5, fontWeight: 600 }}>
          <MousePointer2 size={14} />
          {isMultiSelecting ? "Selecting..." : "Select Tables"}
        </button>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Quick stats */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize:11,fontWeight:600,color:"#0e7490" }}>{occupied} occupied</span>
          <span style={{ fontSize:11,color:"#9ca3af" }}>·</span>
          <span style={{ fontSize:11,fontWeight:600,color:"#6b7280" }}>{available} available</span>
        </div>
      </div>

      {/* ── Status legend ── */}
      <div className="flex items-center gap-4 px-5 py-2 border-b border-gray-100 bg-white shrink-0 flex-wrap">
        {ALL_STATUSES.map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div style={{ width:10,height:10,borderRadius:"50%",backgroundColor:STATUS_META[s].dot }} />
            <span style={{ fontSize:10.5,color:"#4b5563" }}>{STATUS_META[s].label}</span>
          </div>
        ))}
      </div>

      {/* ── Unified canvas ── */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center bg-gray-50">
        <div className="relative rounded-2xl overflow-hidden transition-all duration-300"
          style={{ width:CANVAS_W, height:CANVAS_H, boxShadow:"0 2px 20px rgba(0,0,0,0.08)" }}
          onDragOver={e=>e.preventDefault()}>

          {/* Zone backgrounds */}
          {(isAll ? ["Restaurant","First floor","Terrace","Bar"] as Section[] : [areaFilter as Section]).map(sec=>(
            <ZoneBg key={sec} sec={sec} isAll={isAll} />
          ))}

          {/* Linked group overlays */}
          {Object.values(visibleGroups).map((grp,i) => {
            const groupId = grp[0].linkedGroup!;
            return (
              <LinkedBox key={i} defs={grp} onUnlink={() => {
                if (groupId.startsWith('booking-')) {
                  const bId = Number(groupId.replace('booking-', ''));
                  const b = ALL_BOOKINGS.find(x => x.id === bId);
                  if (b) {
                    delete b.additionalTables;
                    setTick(v => v + 1);
                  }
                } else {
                  setUnlinkedGroups(prev => new Set(prev).add(groupId));
                }
              }} />
            );
          })}

          {/* Tables */}
          {visibleDefs.map(def => (
            <FloorTable key={def.id} def={def}
              booking={tableBookings[def.id]}
              nowMin={atMin}
              dragTarget={dragOverId===def.id}
              selected={selectedEmptyTables.some(t => t.id === def.id)}
              onDragStart={(_b,dId)=>setDragFromId(dId)}
              onDrop={handleDrop}
              onDragOver={e=>{ e.preventDefault(); setDragOverId(def.id); }}
              onClickEmpty={(d, e) => {
                 if (isMultiSelecting || e.shiftKey || e.metaKey) {
                   setSelectedEmptyTables(prev => {
                     const isSel = prev.some(t => t.id === d.id);
                     return isSel ? prev.filter(t => t.id !== d.id) : [...prev, d];
                   });
                 } else {
                   if (selectedEmptyTables.length > 0) {
                     onWalkinRequest?.([{ section: d.section, table: d.number }], minToTime(atMin));
                     setSelectedEmptyTables([]);
                     setIsMultiSelecting(false);
                   } else {
                     onWalkinRequest?.([{ section: d.section, table: d.number }], minToTime(atMin));
                   }
                 }
              }}
              onClickBooking={id=>onBookingClick?.(id)}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Bar for Multi-select */}
      {selectedEmptyTables.length > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl z-[100] border border-gray-700 transition-all duration-300 animate-in slide-in-from-bottom-5"
          style={{ backgroundColor: "rgba(17, 24, 39, 0.95)", backdropFilter: "blur(12px)" }}>
          <div className="flex flex-col text-white">
            <span style={{ fontSize: 14, fontWeight: 700 }}>{selectedEmptyTables.length} tables selected</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              Total capacity: {selectedEmptyTables.reduce((sum, t) => sum + t.capacity, 0)} pax
            </span>
          </div>
          <div className="w-px h-8 bg-gray-700 mx-2" />
          <button onClick={() => {
            onWalkinRequest?.(selectedEmptyTables.map(t => ({ section: t.section, table: t.number })), minToTime(atMin));
            setSelectedEmptyTables([]);
            setIsMultiSelecting(false);
          }} className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg" style={{ fontSize: 13 }}>
            Create Booking
          </button>
        </div>
      )}
    </div>
  );
}