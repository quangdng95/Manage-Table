import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft, Search, SlidersHorizontal, Trash2, ChevronDown, Check, X,
} from "lucide-react";
import {
  FOOD_CATEGORIES, FOOD_ITEMS, KITCHEN_META, formatVND,
  type CartLine, type FoodItem, type AdditionGroup, type SelectedAddition, type AnyItem, type ComboItem, type NestedComboSelection, isComboOutOfStock
} from "../data/foodMenu";

// ── Shared types ────────────────────────────────────────────────
// addState[groupId][optionId] = qty (0 = unselected, 1+ = selected/count)
type AddState = Record<string, Record<string, number>>;

interface FoodModalState {
  item: AnyItem;
  editingLineId?: string;   // set when editing an existing cart line
  qty: number;
  note: string;
  addState: AddState;
  comboAddState?: Record<string, AddState>;
  comboNote?: Record<string, string>;
}

// ── Empty Cart SVG ─────────────────────────────────────────────
function EmptyCartSvg() {
  return (
    <svg width="80" height="64" viewBox="0 0 100 80" fill="none">
      <rect x="20" y="35" width="60" height="38" rx="3" fill="#e5e7eb" />
      <rect x="20" y="35" width="60" height="10" rx="3" fill="#d1d5db" />
      <path d="M 16 35 Q 18 15 50 20 Q 82 15 84 35" stroke="#9ca3af" strokeWidth="2" fill="#e5e7eb" />
      <path d="M 20 35 Q 22 18 50 22 Q 78 18 80 35" stroke="#d1d5db" strokeWidth="1" fill="none" />
      <line x1="50" y1="35" x2="50" y2="73" stroke="#d1d5db" strokeWidth="1.5" />
    </svg>
  );
}

// ── Addition Group Section ─────────────────────────────────────
function AdditionGroupSection({
  group, state, onRadio, onCheckbox, onCounter,
}: {
  group: AdditionGroup;
  state: Record<string, number>;
  onRadio: (optId: string) => void;
  onCheckbox: (optId: string) => void;
  onCounter: (optId: string, delta: number) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Group header */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-800" style={{ fontSize: 13 }}>{group.name}</span>
        {group.required
          ? <span className="px-1.5 py-0.5 rounded-md font-bold" style={{ fontSize: 9.5, backgroundColor: "#fee2e2", color: "#dc2626" }}>Required</span>
          : <span className="px-1.5 py-0.5 rounded-md font-medium" style={{ fontSize: 9.5, backgroundColor: "#f3f4f6", color: "#9ca3af" }}>Optional</span>
        }
      </div>

      {/* Radio / Checkbox options */}
      {group.type !== "counter" && (
        <div className="space-y-1.5">
          {group.options.map(opt => {
            const selected = (state[opt.id] ?? 0) > 0;
            const isRadio  = group.type === "radio";
            return (
              <button
                key={opt.id}
                onClick={() => isRadio ? onRadio(opt.id) : onCheckbox(opt.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all hover:border-teal-300 active:scale-[0.99]"
                style={{
                  borderColor:       selected ? "#0d9488" : "#e5e7eb",
                  backgroundColor:   selected ? "#f0fdfa" : "white",
                }}
              >
                {/* Indicator */}
                <div
                  className="shrink-0 flex items-center justify-center border-2 transition-all"
                  style={{
                    width: 16, height: 16,
                    borderRadius:     isRadio ? "50%" : 4,
                    borderColor:      selected ? "#0d9488" : "#d1d5db",
                    backgroundColor:  selected ? "#0d9488" : "white",
                  }}
                >
                  {selected && (isRadio
                    ? <div className="w-2 h-2 rounded-full bg-white" />
                    : <Check size={10} color="white" strokeWidth={3} />
                  )}
                </div>
                <span className="flex-1 text-gray-700" style={{ fontSize: 13 }}>{opt.label}</span>
                {!!opt.price && (
                  <span className="shrink-0 font-semibold text-teal-600" style={{ fontSize: 12 }}>
                    +{formatVND(opt.price)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Counter options */}
      {group.type === "counter" && (
        <div className="space-y-1.5">
          {group.options.map(opt => {
            const qty = state[opt.id] ?? 0;
            return (
              <div
                key={opt.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-gray-700" style={{ fontSize: 13 }}>{opt.label}</span>
                  {!!opt.price && (
                    <span className="text-teal-600 font-semibold ml-2" style={{ fontSize: 12 }}>
                      +{formatVND(opt.price)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    onClick={() => onCounter(opt.id, -1)}
                    disabled={qty === 0}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                    style={{ fontSize: 16 }}
                  >−</button>
                  <span className="font-bold text-gray-800" style={{ fontSize: 14, minWidth: 20, textAlign: "center" }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => onCounter(opt.id, 1)}
                    className="w-7 h-7 rounded-lg text-white flex items-center justify-center transition-opacity hover:opacity-90"
                    style={{ fontSize: 16, background: "linear-gradient(135deg, #0d9488, #10b981)" }}
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Food Detail Modal ──────────────────────────────────────────
function FoodDetailModal({
  modal, onClose, onSave, onUpdate,
}: {
  modal: FoodModalState;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<FoodModalState>) => void;
}) {
  const item = modal.item;
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [activeComboStep, setActiveComboStep] = useState(0);
  const cat = FOOD_CATEGORIES.find(c => c.id === item.categoryId);
  const hasAdditions = (item.additions?.length ?? 0) > 0;
  const isEditing = !!modal.editingLineId;

  const [wizardPhase, setWizardPhase] = useState<"overview" | "config" | "summary">(
    isEditing && item.type === "combo" ? "summary" : "overview"
  );

  // Compute unrolled instances for combos
  const unrolledItems = useMemo(() => {
    if (item.type !== "combo") return [];
    const items: { item: FoodItem, instanceId: string, globalIndex: number }[] = [];
    let globalIndex = 1;
    item.includedItems?.forEach(child => {
      for (let i = 0; i < child.fixedQuantity; i++) {
        items.push({
          item: child.item,
          instanceId: `${child.item.id}_${i}`,
          globalIndex: globalIndex++
        });
      }
    });
    return items;
  }, [item]);

  const isItemConfigured = (instanceId: string) => {
    const unrolled = unrolledItems.find(u => u.instanceId === instanceId);
    if (!unrolled) return false;
    
    const hasNote = !!modal.comboNote?.[instanceId];
    const hasState = Object.keys(modal.comboAddState?.[instanceId] || {}).length > 0;
    const hasInteracted = hasNote || hasState;

    const reqGroups = unrolled.item.additions?.filter(g => g.required) || [];
    if (reqGroups.length === 0) return hasInteracted;

    for (const g of reqGroups) {
      const state = modal.comboAddState?.[instanceId]?.[g.id];
      if (!state) return false;
      const hasSelection = Object.values(state).some(qty => qty > 0);
      if (!hasSelection) return false;
    }
    return true;
  };

  // Extra price from selected additions
  const additionsExtra = useMemo(() => {
    let extra = 0;
    if (item.type === "combo") {
       unrolledItems.forEach(({ item: childItem, instanceId }) => {
           childItem.additions?.forEach(group => {
               const opts = modal.comboAddState?.[instanceId]?.[group.id] || {};
               group.options?.forEach(opt => {
                   const qty = opts[opt.id] ?? 0;
                   if (qty > 0 && opt.price) extra += (opt.price * qty); 
               });
           });
       });
    } else {
      item.additions?.forEach(group => {
        const opts = modal.addState[group.id] ?? {};
        group.options.forEach(opt => {
          const qty = opts[opt.id] ?? 0;
          if (qty > 0 && opt.price) extra += opt.price * qty;
        });
      });
    }
    return extra;
  }, [item, modal.addState, modal.comboAddState, unrolledItems]);

  const totalPrice = (item.price + additionsExtra) * modal.qty;

  const DESC_LIMIT = 120;
  const desc       = item.description ?? "";
  const isTruncated = !showFullDesc && desc.length > DESC_LIMIT;

  function toggleRadio(groupId: string, optId: string) {
    onUpdate({ addState: { ...modal.addState, [groupId]: { [optId]: 1 } } });
  }

  function toggleCheckbox(groupId: string, optId: string) {
    const g   = modal.addState[groupId] ?? {};
    const cur = g[optId] ?? 0;
    onUpdate({ addState: { ...modal.addState, [groupId]: { ...g, [optId]: cur ? 0 : 1 } } });
  }

  function changeCounter(groupId: string, optId: string, delta: number) {
    const g   = modal.addState[groupId] ?? {};
    const next = Math.max(0, (g[optId] ?? 0) + delta);
    onUpdate({ addState: { ...modal.addState, [groupId]: { ...g, [optId]: next } } });
  }

  // --- Combo handlers ---
  function toggleComboRadio(instanceId: string, groupId: string, optId: string) {
    const childAddState = modal.comboAddState?.[instanceId] || {};
    onUpdate({ comboAddState: { ...modal.comboAddState, [instanceId]: { ...childAddState, [groupId]: { [optId]: 1 } } } });
  }

  function toggleComboCheckbox(instanceId: string, groupId: string, optId: string) {
    const childAddState = modal.comboAddState?.[instanceId] || {};
    const g = childAddState[groupId] || {};
    const cur = g[optId] ?? 0;
    onUpdate({ comboAddState: { ...modal.comboAddState, [instanceId]: { ...childAddState, [groupId]: { ...g, [optId]: cur ? 0 : 1 } } } });
  }

  function changeComboCounter(instanceId: string, groupId: string, optId: string, delta: number) {
    const childAddState = modal.comboAddState?.[instanceId] || {};
    const g = childAddState[groupId] || {};
    const next = Math.max(0, (g[optId] ?? 0) + delta);
    onUpdate({ comboAddState: { ...modal.comboAddState, [instanceId]: { ...childAddState, [groupId]: { ...g, [optId]: next } } } });
  }

  function updateComboNote(instanceId: string, note: string) {
    onUpdate({ comboNote: { ...modal.comboNote, [instanceId]: note } });
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
      <div
        className="bg-white rounded-2xl overflow-hidden flex flex-col"
        style={{
          width: "min(700px, 95vw)",
          maxHeight: "88vh",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          animation: "modal-in 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900" style={{ fontSize: 16 }}>
            {isEditing ? "Edit Item" : "Add to Order"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body: 2 columns ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left col: image + notes */}
          <div className="flex flex-col gap-3 p-4 shrink-0" style={{ width: 268 }}>
            {/* Emoji image */}
            <div
              className="rounded-2xl flex items-center justify-center shrink-0"
              style={{
                height: 182,
                background: `linear-gradient(135deg, ${cat?.gradient[0] ?? "#f9fafb"}, ${cat?.gradient[1] ?? "#f3f4f6"})`,
                fontSize: 80,
              }}
            >
              {item.emoji}
            </div>

            {/* Notes textarea */}
            {item.type !== "combo" && (
              <div className="flex-1 flex flex-col">
                <label
                  className="block text-gray-400 mb-1.5"
                  style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}
                >
                  Notes (optional)
                </label>
                <textarea
                  value={modal.note}
                  onChange={e => onUpdate({ note: e.target.value })}
                  placeholder="Special requests, allergies, preparation notes…"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 resize-none text-gray-800 focus:outline-none focus:border-teal-400 transition-colors"
                  style={{ fontSize: 12, lineHeight: 1.65, minHeight: 80 }}
                />
              </div>
            )}
          </div>

          {/* Right col: info + additions (scrollable) */}
          <div className="flex-1 border-l border-gray-100 overflow-y-auto p-4 space-y-4">
            {/* Item info */}
            <div>
              <h2 className="font-bold text-gray-900 leading-tight mb-1.5" style={{ fontSize: 19 }}>
                {item.name}
              </h2>

              {/* Description with "more" toggle */}
              {desc && (
                <p className="text-gray-500 mb-3" style={{ fontSize: 13, lineHeight: 1.65 }}>
                  {isTruncated ? `${desc.slice(0, DESC_LIMIT)}…` : desc}
                  {desc.length > DESC_LIMIT && (
                    <button
                      onClick={() => setShowFullDesc(v => !v)}
                      className="text-teal-600 font-semibold ml-1"
                      style={{ fontSize: 12 }}
                    >
                      {showFullDesc ? "less" : "more"}
                    </button>
                  )}
                </p>
              )}

              {/* Price + Sold count */}
              <div className="flex items-end justify-between">
                <div>
                  <span className="font-extrabold" style={{ fontSize: 22, color: "#ef4444" }}>
                    {formatVND(item.price + additionsExtra)}
                  </span>
                  {additionsExtra > 0 && (
                    <span className="text-gray-400 ml-2" style={{ fontSize: 12 }}>
                      (base {formatVND(item.price)})
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-gray-400 pb-0.5" style={{ fontSize: 12 }}>
                  <span>🔥</span>
                  <span>{item.soldCount ?? 3} Sold</span>
                </span>
              </div>
            </div>

            {/* Additions form */}
            {item.type === "combo" ? (
              <div className="space-y-6 mt-4 border-t border-gray-100 pt-4">
                {wizardPhase === "overview" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">Included Items</h3>
                    <div className="space-y-2">
                       {item.includedItems?.map((child, idx) => (
                         <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                           <span className="text-xl" style={{ minWidth: 24, textAlign: 'center' }}>{child.item.emoji}</span>
                           <span className="font-semibold text-gray-700 text-sm">{child.fixedQuantity}x {child.item.name}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {wizardPhase === "config" && (() => {
                  const activeUnrolled = unrolledItems[activeComboStep];
                  if (!activeUnrolled) return null;
                  const { item: childItem, instanceId } = activeUnrolled;
                  
                  return (
                    <div key={instanceId} className="space-y-4">
                      {/* Stepper Header */}
                      <div className="flex gap-2 pb-3 border-b border-gray-100 overflow-x-auto" style={{ minHeight: 48 }}>
                        {unrolledItems.map((u, i) => {
                          const isActive = i === activeComboStep;
                          const isConfig = isItemConfigured(u.instanceId);
                          return (
                            <button
                              key={u.instanceId}
                              onClick={() => setActiveComboStep(i)}
                              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${isActive ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:bg-gray-50"}`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${isActive ? "bg-teal-500 text-white" : isConfig ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`} style={{ fontSize: 10 }}>
                                {isConfig && !isActive ? <Check size={12} strokeWidth={3} /> : u.globalIndex}
                              </div>
                              <span className={`text-xs whitespace-nowrap ${isActive ? "font-bold text-teal-800" : "font-medium text-gray-600"}`}>
                                {u.item.name.substring(0, 16)}{u.item.name.length > 16 ? "…" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <h4 className="font-bold text-gray-800 flex items-center gap-2 mt-2" style={{ fontSize: 16 }}>
                        <span className="text-xl">{childItem.emoji}</span>
                        {childItem.name}
                      </h4>
                      
                      {/* Note for this child */}
                      <div>
                        <input 
                          placeholder={`Specific note for ${childItem.name}...`} 
                          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 text-gray-800 transition-colors"
                          value={modal.comboNote?.[instanceId] || ""}
                          onChange={(e) => updateComboNote(instanceId, e.target.value)}
                          style={{ fontSize: 13 }}
                        />
                      </div>
                      
                      {/* Child Additions */}
                      {(childItem.additions?.length ?? 0) === 0 ? (
                        <p className="text-gray-400 italic text-xs mt-1">No customizable options.</p>
                      ) : childItem.additions?.map(group => (
                        <AdditionGroupSection
                          key={group.id}
                          group={group}
                          state={modal.comboAddState?.[instanceId]?.[group.id] || {}}
                          onRadio={(optId) => toggleComboRadio(instanceId, group.id, optId)}
                          onCheckbox={(optId) => toggleComboCheckbox(instanceId, group.id, optId)}
                          onCounter={(optId, delta) => changeComboCounter(instanceId, group.id, optId, delta)}
                        />
                      ))}
                    </div>
                  );
                })()}

                {wizardPhase === "summary" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">Review Configuration</h3>
                    
                    <div className="space-y-3">
                      {unrolledItems.map((u) => {
                        const state = modal.comboAddState?.[u.instanceId] || {};
                        const note = modal.comboNote?.[u.instanceId] || "";
                        
                        const mods: string[] = [];
                        u.item.additions?.forEach(group => {
                          const opts = state[group.id] || {};
                          group.options.forEach(opt => {
                            const qty = opts[opt.id] ?? 0;
                            if (qty > 0) mods.push(group.type === "counter" ? `${opt.label} ×${qty}` : opt.label);
                          });
                        });
                        
                        const hasContent = mods.length > 0 || note;
                        
                        return (
                          <div key={u.instanceId} className="px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
                            <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center font-bold" style={{ fontSize: 10 }}>{u.globalIndex}</span>
                              {u.item.name}
                            </div>
                            
                            {hasContent ? (
                              <div className="mt-1.5 pl-7 space-y-1">
                                {mods.map((m, i) => (
                                  <div key={i} className="text-xs text-gray-600 flex items-center gap-1.5 before:content-['•'] before:text-gray-400">{m}</div>
                                ))}
                                {note && (
                                  <div className="text-xs text-orange-600 italic bg-orange-50 px-2 py-1.5 rounded-lg inline-block mt-1 border border-orange-100">
                                    Note: {note}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-1 pl-7 text-xs text-gray-400 italic">No additions configured</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Global Note for Combo */}
                    <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col">
                      <label className="block text-gray-500 mb-1.5" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                        Global Combo Note
                      </label>
                      <textarea
                        value={modal.note}
                        onChange={e => onUpdate({ note: e.target.value })}
                        placeholder="Logistical requests for the entire combo..."
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 resize-none text-gray-800 focus:outline-none focus:border-teal-400 transition-colors"
                        style={{ fontSize: 12, lineHeight: 1.65, minHeight: 60 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : hasAdditions ? (
              <div className="space-y-5 mt-4 border-t border-gray-100 pt-4">
                {item.additions!.map(group => (
                  <AdditionGroupSection
                    key={group.id}
                    group={group}
                    state={modal.addState[group.id] ?? {}}
                    onRadio={optId => toggleRadio(group.id, optId)}
                    onCheckbox={optId => toggleCheckbox(group.id, optId)}
                    onCounter={(optId, delta) => changeCounter(group.id, optId, delta)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center gap-3 bg-white">
          {item.type === "combo" ? (
             <>
               {wizardPhase === "overview" && (
                 <>
                   <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-gray-600 border border-gray-200 font-bold hover:bg-gray-50 transition-all">Cancel</button>
                   <button onClick={() => setWizardPhase("config")} className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all bg-teal-600 hover:bg-teal-700">Configure Items</button>
                 </>
               )}
               {wizardPhase === "config" && (
                 <>
                   <button 
                     onClick={() => {
                       if (activeComboStep > 0) setActiveComboStep(s => s - 1);
                       else setWizardPhase("overview");
                     }}
                     className="px-4 py-2.5 rounded-xl text-gray-600 border border-gray-200 font-bold transition-all hover:bg-gray-50 active:scale-[0.98]"
                     style={{ fontSize: 14 }}
                   >
                     〈 Back
                   </button>
                   
                   {activeComboStep < unrolledItems.length - 1 ? (
                     <button
                       onClick={() => setActiveComboStep(s => s + 1)}
                       className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                       style={{ fontSize: 14, background: "linear-gradient(135deg, #0d9488, #10b981)", boxShadow: "0 4px 14px rgba(16,185,129,0.4)" }}
                     >
                       Next 〉
                     </button>
                   ) : (
                     <button
                       onClick={() => setWizardPhase("summary")}
                       className="flex-1 py-2.5 rounded-xl text-teal-700 bg-teal-50 border-2 border-teal-200 font-bold transition-all hover:bg-teal-100 hover:border-teal-300"
                       style={{ fontSize: 14 }}
                     >
                       Review Order 〉
                     </button>
                   )}
                 </>
               )}
               {wizardPhase === "summary" && (
                 <>
                   <button 
                     onClick={() => setWizardPhase("config")}
                     className="px-4 py-2.5 rounded-xl text-gray-600 border border-gray-200 font-bold transition-all hover:bg-gray-50"
                     style={{ fontSize: 14 }}
                   >
                     〈 Edit
                   </button>
                   <div className="flex items-center gap-1 shrink-0">
                     <button onClick={() => onUpdate({ qty: Math.max(1, modal.qty - 1) })} disabled={modal.qty <= 1} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors font-light" style={{ fontSize: 22 }}>−</button>
                     <div className="font-bold text-gray-800 text-center" style={{ fontSize: 17, minWidth: 38 }}>{modal.qty}</div>
                     <button onClick={() => onUpdate({ qty: modal.qty + 1 })} className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-light transition-all hover:opacity-90 active:scale-[0.96]" style={{ fontSize: 22, background: "linear-gradient(135deg, #0d9488, #10b981)" }}>+</button>
                   </div>
                   <button onClick={onSave} className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all hover:opacity-90 active:scale-[0.98]" style={{ fontSize: 14, background: isEditing ? "linear-gradient(135deg, #7c3aed, #8b5cf6)" : "linear-gradient(135deg, #0d9488, #10b981)", boxShadow: isEditing ? "0 4px 14px rgba(139,92,246,0.4)" : "0 4px 14px rgba(16,185,129,0.4)" }}>
                     {isEditing ? "Update Cart" : "Add to Cart"} · {formatVND(totalPrice)}
                   </button>
                 </>
               )}
             </>
          ) : (
             <>
               {/* Qty stepper */}
               <div className="flex items-center gap-1 shrink-0">
                 <button onClick={() => onUpdate({ qty: Math.max(1, modal.qty - 1) })} disabled={modal.qty <= 1} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors font-light" style={{ fontSize: 22 }}>−</button>
                 <div className="font-bold text-gray-800 text-center" style={{ fontSize: 17, minWidth: 38 }}>{modal.qty}</div>
                 <button onClick={() => onUpdate({ qty: modal.qty + 1 })} className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-light transition-all hover:opacity-90 active:scale-[0.96]" style={{ fontSize: 22, background: "linear-gradient(135deg, #0d9488, #10b981)" }}>+</button>
               </div>
               {/* CTA button */}
               <button onClick={onSave} className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all hover:opacity-90 active:scale-[0.98]" style={{ fontSize: 14, background: isEditing ? "linear-gradient(135deg, #7c3aed, #8b5cf6)" : "linear-gradient(135deg, #0d9488, #10b981)", boxShadow: isEditing ? "0 4px 14px rgba(139,92,246,0.4)" : "0 4px 14px rgba(16,185,129,0.4)" }}>
                 {isEditing ? "Update Cart" : "Add to Cart"} · {formatVND(totalPrice)}
               </button>
             </>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────
export interface FoodCatalogProps {
  open: boolean;
  bookingRef: string;
  bookingName: string;
  initialCart?: CartLine[];
  onBack: () => void;
  onSaveAndSend: (lines: CartLine[]) => void;
  onSaveOnly: (lines: CartLine[]) => void;
}

// ── FoodCatalog Component ──────────────────────────────────────
export function FoodCatalog({
  open,
  bookingRef,
  bookingName,
  initialCart = [],
  onBack,
  onSaveAndSend,
  onSaveOnly,
}: FoodCatalogProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(FOOD_CATEGORIES[0].id);
  const [cart, setCart]         = useState<CartLine[]>(initialCart);
  const [search, setSearch]     = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort]         = useState<"default" | "name" | "price-asc" | "price-desc">("default");
  const [modal, setModal]       = useState<FoodModalState | null>(null);
  const [toast, setToast]       = useState<string | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Reset when catalog opens
  useEffect(() => {
    if (open) {
      setCart(initialCart);
      setSearch("");
      setActiveCategoryId(FOOD_CATEGORIES[0].id);
      setSort("default");
      setModal(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);

  // Filtered + sorted food items
  const filteredItems = useMemo(() => {
    let items = FOOD_ITEMS.filter(item => {
      const matchCat    = item.categoryId === activeCategoryId;
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    if (sort === "name")       items = [...items].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    if (sort === "price-asc")  items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [activeCategoryId, search, sort]);

  // ── Cart operations ────────────────────────────────────────────
  function incrementLine(lineId: string) {
    setCart(prev => prev.map(l => l.lineId === lineId ? { ...l, qty: l.qty + 1 } : l));
  }
  function decrementLine(lineId: string) {
    setCart(prev => {
      const line = prev.find(l => l.lineId === lineId);
      if (!line) return prev;
      if (line.qty <= 1) return prev.filter(l => l.lineId !== lineId);
      return prev.map(l => l.lineId === lineId ? { ...l, qty: l.qty - 1 } : l);
    });
  }
  function removeCompletely(lineId: string) {
    setCart(prev => prev.filter(l => l.lineId !== lineId));
  }

  // ── Handlers ───────────────────────────────────────────────────
  function handleItemClick(item: AnyItem) {
    if (item.type === "combo") {
      const hasAdds = item.includedItems?.some(child => 
        (child.item.additions?.length ?? 0) > 0
      );
      if (!hasAdds) {
        addComboToCart(item);
        setToast(`Added ${item.name} to Cart`);
        setTimeout(() => setToast(null), 3000);
        return;
      }
    }
    openModal(item);
  }

  function addComboToCart(item: ComboItem) {
      setCart(prev => {
          const cleanIdx = prev.findIndex(
            l => l.item.id === item.id && !l.note && !(l.comboSelections?.length)
          );
          if (cleanIdx !== -1) {
            return prev.map((l, i) => i === cleanIdx ? { ...l, qty: l.qty + 1 } : l);
          }
          return [...prev, { lineId: `${item.id}-${Date.now()}`, item: item, qty: 1 }];
      });
  }

  // ── Modal helpers ──────────────────────────────────────────────
  function openModal(item: AnyItem, editLine?: CartLine) {
    if (editLine) {
        if (item.type === "combo") {
          const comboAddState: Record<string, AddState> = {};
          const comboNote: Record<string, string> = {};
          const idCounters: Record<string, number> = {};
          editLine.comboSelections?.forEach(sel => {
             const idx = idCounters[sel.itemId] || 0;
             const instanceId = `${sel.itemId}_${idx}`;
             idCounters[sel.itemId] = idx + 1;

             const childAddState: AddState = {};
             sel.selectedAdditions?.forEach(sa => {
                if (!childAddState[sa.groupId]) childAddState[sa.groupId] = {};
                childAddState[sa.groupId][sa.optionId] = sa.qty;
             });
             comboAddState[instanceId] = childAddState;
             if (sel.note) comboNote[instanceId] = sel.note;
          });
          setModal({ item, editingLineId: editLine.lineId, qty: editLine.qty, note: editLine.note ?? "", addState: {}, comboAddState, comboNote });
      } else {
          const addState: AddState = {};
          editLine.selectedAdditions?.forEach(sa => {
            if (!addState[sa.groupId]) addState[sa.groupId] = {};
            addState[sa.groupId][sa.optionId] = sa.qty;
          });
          setModal({ item, editingLineId: editLine.lineId, qty: editLine.qty, note: editLine.note ?? "", addState });
      }
    } else {
      setModal({ item, qty: 1, note: "", addState: {}, comboAddState: {}, comboNote: {} });
    }
  }

  function buildModifierLabels(item: AnyItem, addState: AddState): string[] {
    const labels: string[] = [];
    if (item.type === "combo") return labels;
    item.additions?.forEach(group => {
      const opts = addState[group.id] ?? {};
      group.options.forEach(opt => {
        const qty = opts[opt.id] ?? 0;
        if (qty > 0) labels.push(group.type === "counter" ? `${opt.label} ×${qty}` : opt.label);
      });
    });
    return labels;
  }

  function updateModal(patch: Partial<FoodModalState>) {
    setModal(prev => prev ? { ...prev, ...patch } : null);
  }

  function handleModalSave() {
    if (!modal) return;

    if (modal.item.type === "combo") {
        const comboSelections: NestedComboSelection[] = [];
        modal.item.includedItems?.forEach(child => {
            for (let i = 0; i < child.fixedQuantity; i++) {
                const instanceId = `${child.item.id}_${i}`;
                const childAddState = modal.comboAddState?.[instanceId] || {};
                const childNote = modal.comboNote?.[instanceId];
                const childSelectedAdditions: SelectedAddition[] = [];
                Object.entries(childAddState).forEach(([groupId, opts]) => {
                    Object.entries(opts).forEach(([optionId, qty]) => {
                        if (qty > 0) childSelectedAdditions.push({ groupId, optionId, qty });
                    });
                });
                const childModifiers = buildModifierLabels(child.item, childAddState);
                if (childSelectedAdditions.length > 0 || childNote || childModifiers.length > 0) {
                   comboSelections.push({
                       itemId: child.item.id,
                       selectedAdditions: childSelectedAdditions,
                       modifiers: childModifiers.length ? childModifiers : undefined,
                       note: childNote
                   });
                }
            }
        });
        
        const hasCustom = !!modal.note || comboSelections.length > 0;
        
        if (modal.editingLineId) {
          setCart(prev => prev.map(l =>
            l.lineId === modal.editingLineId
              ? { ...l, qty: modal.qty, note: modal.note || undefined, comboSelections }
              : l
          ));
        } else if (!hasCustom) {
            setCart(prev => {
                const cleanIdx = prev.findIndex(
                  l => l.item.id === modal.item.id && !l.note && !(l.comboSelections?.length)
                );
                if (cleanIdx !== -1) {
                  return prev.map((l, i) => i === cleanIdx ? { ...l, qty: l.qty + modal.qty } : l);
                }
                return [...prev, { lineId: `${modal.item.id}-${Date.now()}`, item: modal.item, qty: modal.qty, comboSelections: comboSelections.length ? comboSelections : undefined }];
            });
        } else {
             setCart(prev => [...prev, {
                lineId: `${modal.item.id}-${Date.now()}`,
                item: modal.item,
                qty: modal.qty,
                note: modal.note || undefined,
                comboSelections: comboSelections.length ? comboSelections : undefined,
             }]);
        }
    } else {
        const selectedAdditions: SelectedAddition[] = [];
        Object.entries(modal.addState).forEach(([groupId, opts]) => {
          Object.entries(opts).forEach(([optionId, qty]) => {
            if (qty > 0) selectedAdditions.push({ groupId, optionId, qty });
          });
        });
        const modifiers  = buildModifierLabels(modal.item, modal.addState);
        const hasCustom  = !!modal.note || selectedAdditions.length > 0;

        if (modal.editingLineId) {
          setCart(prev => prev.map(l =>
            l.lineId === modal.editingLineId
              ? { ...l, qty: modal.qty, note: modal.note || undefined, selectedAdditions, modifiers: modifiers.length ? modifiers : undefined }
              : l
          ));
        } else if (!hasCustom) {
          setCart(prev => {
            const cleanIdx = prev.findIndex(
              l => l.item.id === modal.item.id && !l.note && !(l.modifiers?.length),
            );
            if (cleanIdx !== -1) {
              return prev.map((l, i) => i === cleanIdx ? { ...l, qty: l.qty + modal.qty } : l);
            }
            return [...prev, { lineId: `${modal.item.id}-${Date.now()}`, item: modal.item, qty: modal.qty }];
          });
        } else {
          setCart(prev => [...prev, {
            lineId:             `${modal.item.id}-${Date.now()}`,
            item:               modal.item,
            qty:                modal.qty,
            note:               modal.note || undefined,
            selectedAdditions,
            modifiers:          modifiers.length ? modifiers : undefined,
          }]);
        }
    }
    setModal(null);
  }

  // Derived cart state
  const cartByKitchen = useMemo(() => {
    const groups: Record<string, CartLine[]> = {};
    cart.forEach(line => {
      if (!groups[line.item.kitchen]) groups[line.item.kitchen] = [];
      groups[line.item.kitchen].push(line);
    });
    return groups;
  }, [cart]);

  const totalAmount = cart.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const totalQty    = cart.reduce((sum, l) => sum + l.qty, 0);
  const nowTime     = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const activeCat   = FOOD_CATEGORIES.find(c => c.id === activeCategoryId);

  const SORT_OPTIONS = [
    { id: "default",    label: "Default order" },
    { id: "name",       label: "Name A – Z" },
    { id: "price-asc",  label: "Price: Low to High" },
    { id: "price-desc", label: "Price: High to Low" },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-white"
      style={{
        transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
        transform: open ? "translateY(0)" : "translateY(100%)",
        pointerEvents: open ? "auto" : "none",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes cat-slide-in { from { opacity:0; transform: translateY(-4px); } to { opacity:1; transform: translateY(0); } }
        .food-card:hover .food-card-overlay { opacity: 0.07 !important; }
      `}</style>

      {/* ═══ TOP HEADER ═══════════════════════════════════════════ */}
      <header
        className="shrink-0 flex items-center gap-3 border-b border-gray-200 bg-white px-4"
        style={{ height: 52, boxShadow: "0 1px 0 #e5e7eb" }}
      >
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95 transition-all font-medium shrink-0"
          style={{ fontSize: 13 }}
        >
          <ChevronLeft size={15} />
          Back to Details
        </button>

        <div style={{ width: 1, height: 26, backgroundColor: "#e5e7eb", flexShrink: 0 }} />

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 flex-1"
          style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", height: 34, maxWidth: 380, minWidth: 180 }}
        >
          <Search size={13} style={{ color: "#9ca3af", flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Type to search food…"
            className="flex-1 bg-transparent outline-none min-w-0"
            style={{ fontSize: 13, color: "#111827", caretColor: "#0d9488" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              style={{ fontSize: 16, lineHeight: 1 }}
            >×</button>
          )}
        </div>

        {/* Sort */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            style={{ fontSize: 12, height: 34, backgroundColor: sortOpen ? "#f9fafb" : "white" }}
          >
            <SlidersHorizontal size={13} />
            Sort
            <ChevronDown size={11} style={{ opacity: 0.6, marginLeft: 1 }} />
          </button>
          {sortOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-[120] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
              style={{ minWidth: 190, animation: "cat-slide-in 0.13s ease" }}
            >
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSort(opt.id as typeof sort); setSortOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  style={{ fontSize: 12, fontWeight: sort === opt.id ? 600 : 400, color: sort === opt.id ? "#0d9488" : "#374151" }}
                >
                  {opt.label}
                  {sort === opt.id && <Check size={12} className="text-teal-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Booking info */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
        >
          <span style={{ fontSize: 10, color: "#15803d", fontWeight: 800, letterSpacing: "0.04em" }}>
            #{bookingRef}
          </span>
          <span style={{ fontSize: 11, color: "#166534", fontWeight: 500 }}>· {bookingName}</span>
        </div>
      </header>

      {/* ═══ BODY: 3 COLUMNS ═══════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Category Sidebar ── */}
        <div
          className="shrink-0 flex flex-col overflow-y-auto border-r border-gray-100"
          style={{ width: 156, backgroundColor: "#fafafa" }}
        >
          <div className="px-3 pt-3 pb-1">
            <p className="text-gray-400" style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Categories
            </p>
          </div>
          {FOOD_CATEGORIES.map(cat => {
            const isActive = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategoryId(cat.id); setSearch(""); }}
                className="w-full flex items-center gap-2.5 px-3 py-3 text-left transition-all"
                style={{
                  backgroundColor: isActive ? "#fff1f2" : "transparent",
                  borderRight: `3px solid ${isActive ? "#f43f5e" : "transparent"}`,
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{cat.emoji}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#be123c" : "#4b5563",
                    lineHeight: 1.3,
                  }}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Food Grid ── */}
        <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: "#f8fafc" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2" style={{ fontSize: 15 }}>
              <span style={{ fontSize: 20 }}>{activeCat?.emoji}</span>
              {activeCat?.name}
            </h2>
            <span className="text-gray-400" style={{ fontSize: 12 }}>{filteredItems.length} items</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <span style={{ fontSize: 48 }}>🔍</span>
              <p className="mt-3 font-medium" style={{ fontSize: 14 }}>No items found</p>
              <p style={{ fontSize: 12 }}>Try a different search or category</p>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))" }}>
              {filteredItems.map(item => {
                const totalQtyForItem = cart
                  .filter(l => l.item.id === item.id)
                  .reduce((s, l) => s + l.qty, 0);
                const inCart = totalQtyForItem > 0;
                const cat    = FOOD_CATEGORIES.find(c => c.id === item.categoryId);
                const isCombo = item.type === "combo";
                const outOfStock = isCombo ? isComboOutOfStock(item as ComboItem) : item.outOfStock;
                const hasAdds = !isCombo && (item.additions?.length ?? 0) > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => !outOfStock && handleItemClick(item)}
                    disabled={outOfStock}
                    className={`food-card relative flex flex-col text-left rounded-2xl overflow-hidden transition-all ${outOfStock ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-lg active:scale-[0.97]'}`}
                    style={{
                      border: `2px solid ${inCart && !outOfStock ? "#3b82f6" : "transparent"}`,
                      boxShadow: inCart && !outOfStock
                        ? "0 0 0 2px rgba(59,130,246,0.25), 0 4px 12px rgba(0,0,0,0.08)"
                        : !outOfStock ? "0 1px 4px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)" : "none",
                      backgroundColor: outOfStock ? "#f9fafb" : "white",
                    }}
                  >
                    {/* Image */}
                    <div
                      className="relative flex items-center justify-center overflow-hidden"
                      style={{
                        height: 100,
                        background: `linear-gradient(135deg, ${cat?.gradient[0] ?? "#f9fafb"}, ${cat?.gradient[1] ?? "#f3f4f6"})`,
                        fontSize: 48,
                      }}
                    >
                      {item.emoji}
                      <div
                        className="food-card-overlay absolute inset-0 bg-blue-500 transition-opacity duration-150"
                        style={{ opacity: inCart && !outOfStock ? 0.07 : 0 }}
                      />
                      {/* "+" badge for items with additions */}
                      {hasAdds && !outOfStock && (
                        <div
                          className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-white font-bold"
                          style={{ fontSize: 9, backgroundColor: "rgba(0,0,0,0.45)" }}
                        >
                          OPTIONS
                        </div>
                      )}
                      
                      {isCombo && !outOfStock && (
                        <div
                          className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-white font-bold"
                          style={{ fontSize: 9.5, backgroundColor: "#ef4444", boxShadow: "0 2px 4px rgba(239,68,68,0.4)", zIndex: 10 }}
                        >
                          SAVE 20%
                        </div>
                      )}

                      {outOfStock && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
                        >
                           <span className="px-2 py-1 bg-gray-800 text-white rounded font-bold" style={{ fontSize: 10 }}>SOLD OUT</span>
                        </div>
                      )}
                    </div>

                    {/* Qty badge */}
                    {inCart && !outOfStock && (
                      <div
                        className="absolute flex items-center justify-center rounded-full text-white font-bold shadow-lg"
                        style={{
                          top: 8, right: 8,
                          width: 26, height: 26,
                          backgroundColor: "#3b82f6",
                          fontSize: 12,
                          boxShadow: "0 2px 8px rgba(59,130,246,0.5)",
                        }}
                      >
                        {totalQtyForItem}
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-2.5 flex-1">
                      <p className="text-gray-800 font-semibold leading-tight mb-1" style={{ fontSize: 12 }}>
                        {item.name}
                      </p>
                      <p className="font-bold" style={{ fontSize: 12, color: "#0d9488" }}>
                        {formatVND(item.price)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Cart Sidebar ── */}
        <div className="shrink-0 flex flex-col border-l border-gray-200 bg-white" style={{ width: 300 }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="font-bold text-gray-800" style={{ fontSize: 14 }}>Current Order</span>
            {totalQty > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-white font-bold"
                style={{ fontSize: 11, backgroundColor: "#8b5cf6" }}
              >
                {totalQty}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 px-6 py-8">
                <EmptyCartSvg />
                <p className="font-semibold text-gray-500" style={{ fontSize: 13 }}>No Data to Display</p>
                <p className="text-center text-gray-400" style={{ fontSize: 11, lineHeight: 1.6 }}>
                  Click on food items in the grid to add them to this order
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-4">
                {/* Batch timestamp header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
                >
                  <span style={{ fontSize: 11, color: "#166534" }}>🕐 {nowTime}</span>
                  <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>· QuangNguyên</span>
                  <span
                    className="ml-auto px-1.5 py-0.5 rounded-full"
                    style={{ fontSize: 9.5, fontWeight: 700, backgroundColor: "#dcfce7", color: "#15803d" }}
                  >
                    DRAFT
                  </span>
                </div>

                {/* Kitchen groups */}
                {Object.entries(cartByKitchen).map(([kitchen, lines]) => {
                  const km = KITCHEN_META[kitchen] ?? { bg: "#f9fafb", text: "#374151", border: "#e5e7eb", dot: "#9ca3af" };
                  return (
                    <div key={kitchen} className="space-y-1">
                      {/* Kitchen header */}
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: km.bg, border: `1px solid ${km.border}` }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: km.dot }} />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: km.text, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          {kitchen}
                        </span>
                      </div>

                      {/* Line items — click to edit */}
                      {lines.map(line => (
                        <div
                          key={line.lineId}
                          className="flex flex-col gap-1 py-1.5 px-1 rounded-lg group hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => openModal(line.item, line)}
                          title="Click to edit this item"
                        >
                          {/* Main line */}
                          <div className="flex items-start gap-2">
                            {/* Qty stepper */}
                            <div className="flex items-center shrink-0">
                              <button
                                onClick={e => { e.stopPropagation(); decrementLine(line.lineId); }}
                                className="w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                                style={{ fontSize: 14, lineHeight: 1 }}
                              >−</button>
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold mx-0.5"
                                style={{ backgroundColor: "#8b5cf6", color: "#fff", fontSize: 12 }}
                              >
                                {line.qty}
                              </div>
                              <button
                                onClick={e => { e.stopPropagation(); incrementLine(line.lineId); }}
                                className="w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                                style={{ fontSize: 14, lineHeight: 1 }}
                              >+</button>
                            </div>

                            {/* Name + modifiers + note + price */}
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 font-semibold truncate" style={{ fontSize: 12 }}>
                                {line.item.name}
                              </p>
                              {line.modifiers?.map((mod, mi) => (
                                <p key={mi} className="text-gray-400 truncate" style={{ fontSize: 10.5 }}>
                                  · {mod}
                                </p>
                              ))}
                              {line.note && (
                                <p className="text-purple-400 italic truncate" style={{ fontSize: 10.5 }}>
                                  💬 {line.note}
                                </p>
                              )}
                              <p style={{ fontSize: 11, color: "#0d9488", fontWeight: 600 }}>
                                {formatVND(line.item.price * line.qty)}
                              </p>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={e => { e.stopPropagation(); removeCompletely(line.lineId); }}
                              className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Nested Combo Items */}
                          {line.item.type === "combo" && (
                            <div className="ml-9 space-y-1 mt-1 border-l-2 border-gray-100 pl-2">
                              {line.item.includedItems?.map((child, ci) => {
                                const childSel = line.comboSelections?.find(s => s.itemId === child.item.id);
                                return (
                                  <div key={child.item.id + ci} className="flex flex-col">
                                    <div className="flex items-start justify-between">
                                      <p className="text-gray-600 font-medium" style={{ fontSize: 11 }}>
                                        <span className="text-gray-400 mr-1">↪</span>
                                        {child.fixedQuantity * line.qty} x {child.item.name}
                                      </p>
                                    </div>
                                    {childSel?.modifiers?.map((mod, mi) => (
                                      <p key={mi} className="text-gray-400 ml-4" style={{ fontSize: 10 }}>
                                        • {mod}
                                      </p>
                                    ))}
                                    {childSel?.note && (
                                      <div className="flex items-center gap-1 mt-0.5 ml-4">
                                        <span className="text-purple-400 italic" style={{ fontSize: 10 }}>
                                          💬 {childSel.note}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-200 p-3 space-y-2 bg-white">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-gray-500 font-medium" style={{ fontSize: 12 }}>
                Total ({totalQty} items)
              </span>
              <span className="font-extrabold" style={{ fontSize: 16, color: "#ef4444" }}>
                {formatVND(totalAmount)}
              </span>
            </div>

            <button
              onClick={() => onSaveOnly(cart)}
              disabled={cart.length === 0}
              className="w-full py-2.5 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontSize: 13,
                background: cart.length > 0 ? "linear-gradient(135deg, #6d28d9, #8b5cf6)" : "#e5e7eb",
                color: "white",
                boxShadow: cart.length > 0 ? "0 4px 12px rgba(139,92,246,0.3)" : "none",
              }}
            >
              Save
            </button>

            <button
              onClick={() => onSaveAndSend(cart)}
              disabled={cart.length === 0}
              className="w-full py-2.5 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontSize: 13,
                background: cart.length > 0 ? "linear-gradient(135deg, #0d9488, #10b981)" : "#e5e7eb",
                color: "white",
                boxShadow: cart.length > 0 ? "0 4px 14px rgba(16,185,129,0.35)" : "none",
              }}
            >
              Save &amp; Send to Kitchen 🔥
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-[100] flex items-center gap-2 animate-bounce">
          <Check size={16} className="text-green-400" />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toast}</span>
        </div>
      )}

      {/* ═══ Food Detail Modal ════════════════════════════════════ */}
      {modal && (
        <FoodDetailModal
          modal={modal}
          onClose={() => setModal(null)}
          onSave={handleModalSave}
          onUpdate={updateModal}
        />
      )}
    </div>
  );
}
