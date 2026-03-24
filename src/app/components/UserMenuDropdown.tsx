import React, { useEffect, useRef, useState } from "react";
import {
  User, Settings, CreditCard, HelpCircle, LogOut, Sun, Moon, X,
} from "lucide-react";

interface UserMenuDropdownProps {
  onClose: () => void;
  onProfile: () => void;
  onSettings: () => void;
}

export function UserMenuDropdown({ onClose, onProfile, onSettings }: UserMenuDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    // slight delay so the triggering click doesn't immediately close it
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const menuItems = [
    { icon: User,       label: "Profile",      sub: "quangnguyen@norra.ai", danger: false, action: () => { onProfile();  onClose(); } },
    { icon: Settings,   label: "Settings",     sub: null,                    danger: false, action: () => { onSettings(); onClose(); } },
    { icon: CreditCard, label: "Subscription", sub: null,                    danger: false, action: onClose },
    { icon: HelpCircle, label: "Help",         sub: null,                    danger: false, action: onClose },
    { icon: LogOut,     label: "Log out",      sub: null,                    danger: true,  action: onClose },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 z-[200] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      style={{
        width: 272,
        animation: "menuFadeIn 0.15s cubic-bezier(0.34,1.4,0.64,1)",
      }}
    >
      <style>{`
        @keyframes menuFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      {/* Menu items */}
      <div className="py-1.5">
        {menuItems.map(({ icon: Icon, label, sub, danger, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left hover:bg-gray-50 group"
          >
            {/* Icon circle */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{
                backgroundColor: danger ? "#fff1f2" : "#f1f5f9",
              }}
            >
              <Icon
                size={15}
                className="transition-colors"
                style={{ color: danger ? "#ef4444" : "#64748b" }}
              />
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <div
                className="truncate"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: danger ? "#ef4444" : "#1e293b",
                }}
              >
                {label}
              </div>
              {sub && (
                <div className="text-gray-400 truncate" style={{ fontSize: 11 }}>
                  {sub}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-gray-100" />

      {/* Footer — account info + color scheme */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {/* Account number */}
        <div>
          <span className="text-gray-400" style={{ fontSize: 11 }}>Account# </span>
          <span className="text-gray-600" style={{ fontSize: 11, fontWeight: 600 }}>15383</span>
        </div>

        {/* Color scheme toggle */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400" style={{ fontSize: 11 }}>Color scheme</span>
          <div
            className="flex items-center rounded-full p-0.5 gap-0.5"
            style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
          >
            {/* Light / Sun */}
            <button
              onClick={() => setColorScheme("light")}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: colorScheme === "light" ? "white" : "transparent",
                boxShadow: colorScheme === "light" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              }}
              title="Light mode"
            >
              <Sun
                size={13}
                style={{
                  color: colorScheme === "light" ? "#f59e0b" : "#94a3b8",
                  strokeWidth: colorScheme === "light" ? 2.5 : 1.5,
                }}
              />
            </button>

            {/* Dark / Moon */}
            <button
              onClick={() => setColorScheme("dark")}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: colorScheme === "dark" ? "white" : "transparent",
                boxShadow: colorScheme === "dark" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              }}
              title="Dark mode"
            >
              <Moon
                size={13}
                style={{
                  color: colorScheme === "dark" ? "#6366f1" : "#94a3b8",
                  strokeWidth: colorScheme === "dark" ? 2.5 : 1.5,
                  fill: colorScheme === "dark" ? "#6366f1" : "none",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}