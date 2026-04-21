"use client";

import { useState } from "react";
import { Trash2, Mail, Users, CreditCard, Bell, Database } from "lucide-react";
import { teamMembers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type RoleType = "Admin" | "Engineer" | "Analyst" | "Viewer";

const ROLE_COLORS: Record<RoleType, string> = {
  Admin: "text-danger bg-danger-dim border-danger/20",
  Engineer: "text-accent bg-accent/10 border-accent/20",
  Analyst: "text-warning bg-warning-dim border-warning/20",
  Viewer: "text-muted bg-surface-2 border-border",
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex w-9 h-5 rounded-full transition-colors",
        checked ? "bg-accent" : "bg-surface-2 border border-border"
      )}
    >
      <span className={cn(
        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
        checked && "translate-x-4"
      )} />
    </button>
  );
}

const sections = [
  { key: "team", label: "Team", icon: Users },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "retention", label: "Data Retention", icon: Database },
];

export default function SettingsPage() {
  const [section, setSection] = useState("team");
  const [members, setMembers] = useState(teamMembers);
  const [invite, setInvite] = useState("");
  const [inviteRole, setInviteRole] = useState<RoleType>("Engineer");

  // Notifications
  const [notifs, setNotifs] = useState({
    biasDropAlert: true,
    auditComplete: true,
    quota80: true,
    quota100: false,
    slackWebhook: false,
  });
  const toggleNotif = (key: keyof typeof notifs) =>
    setNotifs((n) => ({ ...n, [key]: !n[key] }));

  // Retention
  const [retention, setRetention] = useState<"30" | "90" | "365" | "custom">("90");
  const [customDays, setCustomDays] = useState("180");

  const sendInvite = () => {
    if (!invite.trim()) return;
    setMembers((m) => [...m, {
      id: String(Date.now()), name: invite.split("@")[0], email: invite,
      role: inviteRole, joined: "2026-04-21",
    }]);
    setInvite("");
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-lg font-display font-bold text-white">Settings</h1>
        <p className="text-xs text-muted mt-1">Manage your team, billing, and platform configuration.</p>
      </div>

      <div className="flex gap-6">
        {/* Mini nav */}
        <div className="w-44 shrink-0 space-y-0.5">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all",
                section === key
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-white hover:bg-surface-2"
              )}
            >
              <Icon size={14} className={section === key ? "text-accent" : "text-muted"} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Team */}
          {section === "team" && (
            <div className="space-y-5">
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      {["Member", "Role", "Joined", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] text-muted uppercase tracking-widest font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{m.name}</p>
                              <p className="text-muted font-mono text-[10px]">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded border text-[10px] font-medium", ROLE_COLORS[m.role as RoleType])}>
                            {m.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-fg font-mono">{m.joined}</td>
                        <td className="px-4 py-3">
                          {m.role !== "Admin" && (
                            <button
                              onClick={() => setMembers((prev) => prev.filter((x) => x.id !== m.id))}
                              className="text-muted hover:text-danger transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invite */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs text-muted uppercase tracking-widest">Invite Team Member</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    <input
                      value={invite}
                      onChange={(e) => setInvite(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                      className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-accent/50 placeholder:text-muted"
                      placeholder="colleague@company.ai"
                    />
                  </div>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as RoleType)}
                    className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-white appearance-none focus:outline-none focus:border-accent/50"
                  >
                    {(["Engineer", "Analyst", "Viewer"] as RoleType[]).map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <button
                    onClick={sendInvite}
                    className="px-4 py-2 bg-accent hover:bg-accent-dim text-white text-xs font-medium rounded-lg transition-all"
                  >
                    Send Invite
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing */}
          {section === "billing" && (
            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest mb-1">Current Plan</p>
                    <p className="text-2xl font-display font-bold text-white">Enterprise</p>
                    <p className="text-xs text-muted mt-0.5">Billed annually · $2,400/yr</p>
                  </div>
                  <span className="px-2.5 py-1 bg-success-dim border border-success/20 text-success text-xs rounded-lg">Active</span>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                  {[
                    { label: "Monthly requests", val: "100,000", used: "24.8%" },
                    { label: "Team seats", val: "25 seats", used: "16%" },
                    { label: "Data retention", val: "365 days", used: null },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-muted">{item.label}</p>
                      <p className="text-sm font-medium text-white mt-0.5">{item.val}</p>
                      {item.used && (
                        <div className="mt-1.5 h-1 bg-surface-2 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: item.used }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button className="text-xs text-accent hover:text-accent-dim transition-colors">
                  Manage billing →
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {section === "notifications" && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <p className="text-sm font-medium text-white">Email & Alert Preferences</p>
              </div>
              <div className="divide-y divide-border">
                {[
                  { key: "biasDropAlert" as const, label: "Bias score drops below threshold", desc: "Immediate email + in-app notification" },
                  { key: "auditComplete" as const, label: "Audit job completed", desc: "In-app notification with summary" },
                  { key: "quota80" as const, label: "API quota at 80%", desc: "Email warning before hitting limits" },
                  { key: "quota100" as const, label: "API quota at 100%", desc: "Urgent email — requests will be blocked" },
                  { key: "slackWebhook" as const, label: "Slack webhook for high-severity flags", desc: "Post to Slack when live mode detects High severity" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm text-white">{label}</p>
                      <p className="text-xs text-muted mt-0.5">{desc}</p>
                    </div>
                    <Toggle checked={notifs[key]} onChange={() => toggleNotif(key)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Retention */}
          {section === "retention" && (
            <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
              <div>
                <p className="text-sm font-medium text-white">Audit Log Retention Policy</p>
                <p className="text-xs text-muted mt-1">Logs older than the selected period are automatically purged.</p>
              </div>
              <div className="space-y-2">
                {([
                  { val: "30", label: "30 days", desc: "Standard — lower storage cost" },
                  { val: "90", label: "90 days", desc: "Recommended for most teams" },
                  { val: "365", label: "1 year", desc: "Required for SOC 2 / GDPR audits" },
                  { val: "custom", label: "Custom", desc: "Set your own retention window" },
                ] as const).map(({ val, label, desc }) => (
                  <button
                    key={val}
                    onClick={() => setRetention(val)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all text-left",
                      retention === val
                        ? "bg-accent/10 border-accent/30"
                        : "border-border hover:border-border-2"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        retention === val ? "border-accent" : "border-muted"
                      )}>
                        {retention === val && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <div>
                        <span className={retention === val ? "text-white font-medium" : "text-muted-fg"}>{label}</span>
                        <p className="text-xs text-muted mt-0.5">{desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {retention === "custom" && (
                <div className="flex items-center gap-3 pl-7 animate-fade-in">
                  <input
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-24 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 font-mono"
                    type="number" min="1" max="3650"
                  />
                  <span className="text-sm text-muted">days</span>
                </div>
              )}
              <button className="px-5 py-2.5 bg-accent hover:bg-accent-dim text-white text-sm font-medium rounded-lg transition-all shadow-glow-sm">
                Save Policy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
