// Purpose: Paginated audit log table. Columns: Request ID, Model, Action,
// Score Before, Score After, Bias Types, Created At. Rows are expandable.

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Download, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import type { AuditEntry } from "@/lib/types";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { AuditRowDetail } from "@/components/audit/AuditRowDetail";

interface AuditTableProps {
  entries: AuditEntry[];
  total: number;
  pages: number;
  page: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const ACTION_COLOURS: Record<string, string> = {
  rewrite: "bg-blue-50 text-blue-700",
  flag: "bg-amber-50 text-amber-700",
  block: "bg-red-50 text-red-700",
  pass: "bg-emerald-50 text-emerald-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(entries: AuditEntry[]) {
  const headers = ["ID", "Model", "Action", "Score Before", "Score After", "Bias Types", "Created At"];
  const rows = entries.map((e) => [
    e.request_id,
    e.model,
    e.action_taken,
    e.bias_score_before.overall.toFixed(1),
    e.bias_score_after.overall.toFixed(1),
    e.bias_types_detected.join("; "),
    e.created_at,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lmsense-audit.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  );
}

export function AuditTable({
  entries,
  total,
  pages,
  page,
  loading,
  onPageChange,
}: AuditTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleRow(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Table toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{total}</span> entries
        </p>
        <button
          onClick={() => exportCSV(entries)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500">
              <th className="w-6 px-4 py-3" />
              <th className="px-4 py-3">Request ID</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Before</th>
              <th className="px-4 py-3">After</th>
              <th className="px-4 py-3">Bias Types</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : entries.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <AlertTriangle size={24} className="opacity-50" />
                        <p className="text-sm">No entries match the current filters</p>
                      </div>
                    </td>
                  </tr>
                )
                : entries.map((entry) => (
                    <>
                      <tr
                        key={entry.id}
                        onClick={() => toggleRow(entry.id)}
                        className={clsx(
                          "cursor-pointer transition-colors hover:bg-indigo-50/30",
                          expandedId === entry.id && "bg-indigo-50/20",
                        )}
                      >
                        {/* Expand icon */}
                        <td className="pl-4 pr-2 py-3 text-gray-400">
                          {expandedId === entry.id ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </td>
                        {/* Request ID */}
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {entry.request_id.slice(0, 12)}…
                        </td>
                        {/* Model */}
                        <td className="px-4 py-3">
                          <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                            {entry.model}
                          </span>
                        </td>
                        {/* Action */}
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                              ACTION_COLOURS[entry.action_taken] ?? "bg-gray-100 text-gray-600",
                            )}
                          >
                            {entry.action_taken}
                          </span>
                        </td>
                        {/* Score before */}
                        <td className="px-4 py-3">
                          <ScoreBadge score={entry.bias_score_before.overall} size="sm" />
                        </td>
                        {/* Score after */}
                        <td className="px-4 py-3">
                          <ScoreBadge score={entry.bias_score_after.overall} size="sm" />
                        </td>
                        {/* Bias types */}
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {entry.bias_types_detected.join(", ") || "—"}
                        </td>
                        {/* Created at */}
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {formatDate(entry.created_at)}
                        </td>
                      </tr>
                      {expandedId === entry.id && (
                        <tr key={`${entry.id}-detail`}>
                          <td colSpan={8} className="p-0">
                            <AuditRowDetail entry={entry} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-1 border-t border-gray-100 px-5 py-3">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={clsx(
                "h-8 w-8 rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-100",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
