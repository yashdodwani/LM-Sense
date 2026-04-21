"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ScanSearch,
  FlaskConical,
  Settings2,
  Plug,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/audit", label: "Bias Audit", icon: ScanSearch },
  { href: "/sandbox", label: "Prompt Sandbox", icon: FlaskConical },
  { href: "/pipeline", label: "Pipeline Config", icon: Settings2 },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-surface border-r border-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2.5 h-14 px-4 border-b border-border shrink-0",
        collapsed && "justify-center px-0"
      )}>
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0 shadow-glow-sm">
          <Zap size={14} className="text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-display font-700 text-white text-base tracking-tight">
            LMSense
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group relative",
                active
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-muted-fg hover:text-white hover:bg-surface-2",
                collapsed && "justify-center px-0 w-10 mx-auto"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0 transition-colors",
                  active ? "text-accent" : "text-muted group-hover:text-white"
                )}
              />
              {!collapsed && <span className="truncate">{label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface-2 border border-border rounded text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-muted hover:text-white hover:bg-surface-2 transition-all text-xs",
            collapsed && "justify-center px-0 w-10 mx-auto"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span></span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
