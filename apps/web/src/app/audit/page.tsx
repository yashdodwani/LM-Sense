// Purpose: Audit log page. Renders filter bar + paginated table of flagged entries.
// Supports URL-driven filter state and CSV export.

"use client";

import { useState } from "react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { AuditFiltersBar } from "@/components/audit/AuditFilters";
import { AuditTable } from "@/components/audit/AuditTable";
import type { AuditFilters } from "@/lib/types";

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    page_size: 20,
  });

  const { entries, total, pages, loading } = useAuditLog(filters);

  function handleFilterApply(f: AuditFilters) {
    setFilters((prev) => ({ ...prev, ...f, page: 1 }));
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  return (
    <div className="space-y-5 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Audit Log</h2>
        <p className="text-sm text-gray-500">
          Review all flagged and debiased LLM outputs with full trace detail
        </p>
      </div>

      {/* Filters */}
      <AuditFiltersBar onApply={handleFilterApply} />

      {/* Table */}
      <AuditTable
        entries={entries}
        total={total}
        pages={pages}
        page={filters.page ?? 1}
        loading={loading}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
