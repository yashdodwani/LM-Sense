// Purpose: Filter bar for the audit log. Provides dropdowns for Bias Type,
// Severity, Model, and date range inputs. Emits filter state on Apply.

"use client";

import { useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import type { AuditFilters } from "@/lib/types";

interface AuditFiltersBarProps {
  onApply: (filters: AuditFilters) => void;
}

const BIAS_TYPES = ["", "gender", "racial", "age", "geographic", "socioeconomic"];
const SEVERITIES = ["", "low", "medium", "high", "critical"];
const MODELS = ["", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-5-sonnet", "gemini-1.5-pro"];

export function AuditFiltersBar({ onApply }: AuditFiltersBarProps) {
  const [biasType, setBiasType] = useState("");
  const [severity, setSeverity] = useState("");
  const [model, setModel] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function handleApply() {
    onApply({
      bias_type: biasType || undefined,
      severity: severity || undefined,
      model: model || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: 1,
    });
  }

  function handleReset() {
    setBiasType("");
    setSeverity("");
    setModel("");
    setDateFrom("");
    setDateTo("");
    onApply({ page: 1 });
  }

  const selectClass =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none min-w-[140px]";

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Filter size={14} />
        Filters
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Bias type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400">Bias Type</label>
          <select id="filter-bias-type" value={biasType} onChange={(e) => setBiasType(e.target.value)} className={selectClass}>
            {BIAS_TYPES.map((t) => (
              <option key={t} value={t}>{t || "All"}</option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400">Severity</label>
          <select id="filter-severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s || "All"}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400">Model</label>
          <select id="filter-model" value={model} onChange={(e) => setModel(e.target.value)} className={selectClass}>
            {MODELS.map((m) => (
              <option key={m} value={m}>{m || "All"}</option>
            ))}
          </select>
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400">From</label>
          <input
            id="filter-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={selectClass}
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400">To</label>
          <input
            id="filter-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="ml-auto flex gap-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw size={13} />
          Reset
        </button>
        <button
          id="apply-filters-button"
          onClick={handleApply}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
