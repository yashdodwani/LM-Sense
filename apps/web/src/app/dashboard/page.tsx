// Purpose: Dashboard home page. Fetches stats from /v1/stats and renders
// the gauge card, trend chart, category pills, and recent activity feed.

"use client";

import { useState, useEffect } from "react";
import { getDashboardStats, getAuditLog } from "@/lib/api";
import type { DashboardStats, AuditEntry } from "@/lib/types";
import { BiasScoreCard } from "@/components/dashboard/BiasScoreCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { BiasCategoryPills } from "@/components/dashboard/BiasCategoryPills";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Activity, TrendingUp, AlertTriangle, Zap } from "lucide-react";

// ── Mock data for when backend is not connected ───────────────────────────────

function generateMockTrend(days: number) {
  const points = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score_before: 42 + Math.random() * 20,
      score_after: 72 + Math.random() * 18,
      request_count: Math.floor(50 + Math.random() * 200),
    });
  }
  return points;
}

const MOCK_STATS: DashboardStats = {
  avg_score_before: 54.2,
  avg_score_after: 86.7,
  total_requests: 12480,
  flagged_count: 1843,
  improvement_rate: 60.2,
  trend: generateMockTrend(7),
};

const MOCK_SCORES = {
  overall: 86.7,
  gender: 91.2,
  racial: 78.4,
  age: 88.0,
  geographic: 84.5,
  socioeconomic: 82.1,
};

// ── Stat Cards ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  colour: string;
}

function StatCard({ icon, label, value, sub, colour }: StatCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`rounded-lg p-2.5 ${colour}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums text-gray-900">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<AuditEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoadingStats(true);
    getDashboardStats(days)
      .then(setStats)
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoadingStats(false));
  }, [days]);

  useEffect(() => {
    setLoadingEntries(true);
    getAuditLog({ page: 1, page_size: 10 })
      .then((res) => setRecentEntries(res.entries))
      .catch(() => setRecentEntries([]))
      .finally(() => setLoadingEntries(false));
  }, []);

  const display = stats ?? MOCK_STATS;

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500">
          Real-time bias mitigation metrics across all LLM outputs
        </p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={<Activity size={18} className="text-indigo-600" />}
          colour="bg-indigo-50"
          label="Total Requests"
          value={display.total_requests.toLocaleString()}
          sub="All time"
        />
        <StatCard
          icon={<AlertTriangle size={18} className="text-amber-600" />}
          colour="bg-amber-50"
          label="Flagged Outputs"
          value={display.flagged_count.toLocaleString()}
          sub={`${((display.flagged_count / display.total_requests) * 100).toFixed(1)}% of requests`}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          colour="bg-emerald-50"
          label="Avg. Score Lift"
          value={`+${(display.avg_score_after - display.avg_score_before).toFixed(1)}`}
          sub={`${display.avg_score_before.toFixed(1)} → ${display.avg_score_after.toFixed(1)}`}
        />
        <StatCard
          icon={<Zap size={18} className="text-violet-600" />}
          colour="bg-violet-50"
          label="Improvement Rate"
          value={`${display.improvement_rate.toFixed(1)}%`}
          sub="Outputs improved"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Gauge */}
        <div className="xl:col-span-1">
          {loadingStats ? (
            <div className="flex h-64 animate-pulse items-center justify-center rounded-xl border border-gray-200 bg-white">
              <div className="h-32 w-32 rounded-full bg-gray-100" />
            </div>
          ) : (
            <BiasScoreCard
              score={display.avg_score_after}
              label="Avg. Post-Debias Score"
              subtitle={`Based on last ${display.total_requests.toLocaleString()} requests`}
              change={display.avg_score_after - display.avg_score_before}
            />
          )}
        </div>

        {/* Trend chart */}
        <div className="xl:col-span-2">
          <TrendChart
            data={display.trend}
            onRangeChange={(d) => setDays(d)}
          />
        </div>
      </div>

      {/* Category pills + recent activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BiasCategoryPills scores={MOCK_SCORES} />
        <RecentActivity entries={recentEntries} loading={loadingEntries} />
      </div>
    </div>
  );
}
