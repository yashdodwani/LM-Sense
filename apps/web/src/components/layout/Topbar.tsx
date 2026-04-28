// Purpose: Top navigation bar for the LM-Sense dashboard.
// Displays current page breadcrumb, global search hint, and user account menu.

"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, ChevronDown, CircleUser } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/sandbox": "Prompt Sandbox",
  "/audit": "Audit Log",
  "/pipeline": "Pipeline Config",
  "/integrations": "Integrations & API Keys",
};

export function Topbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageLabel =
    Object.entries(routeLabels).find(([key]) =>
      pathname.startsWith(key),
    )?.[1] ?? "LM-Sense";

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Page title */}
      <h1 className="text-base font-semibold text-gray-900">{pageLabel}</h1>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Search hint */}
        <button className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-indigo-300 hover:bg-indigo-50 sm:flex">
          <Search size={14} />
          <span>Quick search…</span>
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-400">
            ⌘K
          </kbd>
        </button>

        {/* Notification bell */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100">
              <CircleUser size={16} className="text-indigo-600" />
            </div>
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              Admin
            </span>
            <ChevronDown
              size={14}
              className={clsx(
                "text-gray-400 transition-transform",
                menuOpen && "rotate-180",
              )}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              {[
                { label: "Account Settings", href: "#" },
                { label: "API Keys", href: "/integrations" },
                { label: "Documentation", href: "#" },
                { label: "Sign out", href: "#" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
