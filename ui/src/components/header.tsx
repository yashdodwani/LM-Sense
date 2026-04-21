"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/audit": "Bias Audit",
  "/sandbox": "Prompt Sandbox",
  "/pipeline": "Pipeline Config",
  "/integrations": "Integrations",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const page = breadcrumbMap[pathname] ?? "LMSense";

  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">LMSense</span>
        <ChevronRight size={13} className="text-border-2" />
        <span className="text-white font-medium">{page}</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-white transition-colors">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
            AJ
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white leading-none">Arjun Mehta</p>
            <p className="text-[10px] text-muted mt-0.5">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
