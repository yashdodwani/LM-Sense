"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  PlayCircle, FlaskConical, Download, Wifi, WifiOff, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  trendData, biasCategories, recentActivity, connectedModels,
} from "@/lib/mock-data";
import { cn, biasScoreColor, severityColor } from "@/lib/utils";

const OVERALL_SCORE = 77;

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#1E2028" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-3xl font-display font-bold leading-none", biasScoreColor(score))}>
          {score}
        </span>
        <span className="text-[10px] text-muted mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

const MODEL_COLORS: Record<string, string> = {
  "GPT-4o": "#3B82F6",
  "Claude Sonnet": "#8B5CF6",
  "Gemini": "#10B981",
};

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const chartData = trendData[timeRange];

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Overall score card */}
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-5">
          <ScoreRing score={OVERALL_SCORE} />
          <div>
            <p className="text-xs text-muted uppercase tracking-widest mb-1">Overall Fairness Score</p>
            <p className={cn("text-2xl font-display font-bold", biasScoreColor(OVERALL_SCORE))}>
              {OVERALL_SCORE >= 80 ? "Good" : OVERALL_SCORE >= 60 ? "Moderate" : "Critical"}
            </p>
            <p className="text-xs text-muted-fg mt-1">Across 3 connected models</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-success">
              <TrendingUp size={12} />
              <span>+4.2 pts from last week</span>
            </div>
          </div>
        </div>

        {/* Active connections */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Active Connections</p>
          <div className="space-y-2.5">
            {connectedModels.map((m) => (
              <div key={m.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    m.status === "connected" ? "bg-success shadow-[0_0_4px_#22C55E]" : "bg-danger"
                  )} />
                  <div>
                    <p className="text-sm font-medium text-white">{m.name}</p>
                    <p className="text-[10px] text-muted">{m.provider}</p>
                  </div>
                </div>
                <span className={cn("text-sm font-mono font-medium", biasScoreColor(m.score))}>
                  {m.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Quick Actions</p>
          <div className="space-y-2">
            <Link href="/audit" className="flex items-center gap-3 w-full px-3 py-2.5 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-lg text-sm text-accent font-medium transition-all group">
              <PlayCircle size={15} />
              Run New Audit
            </Link>
            <Link href="/sandbox" className="flex items-center gap-3 w-full px-3 py-2.5 bg-surface-2 hover:bg-border rounded-lg text-sm text-white transition-all">
              <FlaskConical size={15} className="text-muted" />
              Open Sandbox
            </Link>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 bg-surface-2 hover:bg-border rounded-lg text-sm text-white transition-all">
              <Download size={15} className="text-muted" />
              Download Last Report
            </button>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white">Bias Score Trend</p>
          <div className="flex gap-1">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition-all",
                  timeRange === r
                    ? "bg-accent/15 text-accent border border-accent/25"
                    : "text-muted hover:text-white"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" />
            <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[40, 100]} tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#12141A", border: "1px solid #1E2028", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#9CA3AF" }}
            />
            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
            {Object.entries(MODEL_COLORS).map(([model, color]) => (
              <Line key={model} type="monotone" dataKey={model} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bias categories */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Top Bias Categories</p>
          <div className="flex flex-wrap gap-2">
            {biasCategories.map((cat) => (
              <Link
                key={cat.label}
                href="/audit"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface-2 hover:border-accent/40 hover:bg-accent/5 transition-all group"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: cat.color, boxShadow: `0 0 4px ${cat.color}` }}
                />
                <span className="text-xs text-muted-fg group-hover:text-white">{cat.label}</span>
                <span
                  className="text-xs font-mono font-medium px-1.5 py-0.5 rounded-md"
                  style={{ color: cat.color, backgroundColor: `${cat.color}15` }}
                >
                  {cat.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Recent Flagged Outputs</p>
          <div className="space-y-0">
            {recentActivity.slice(0, 4).map((item, i) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 py-2 text-xs",
                  i < recentActivity.length - 1 && "border-b border-border"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{item.query}</p>
                  <p className="text-muted mt-0.5 font-mono">{item.model} · {item.timestamp.slice(11)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-muted-fg">{item.biasType}</span>
                  <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-medium", severityColor(item.severity))}>
                    {item.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
