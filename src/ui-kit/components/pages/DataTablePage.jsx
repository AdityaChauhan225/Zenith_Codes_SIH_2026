/**
 * DataTablePage — Universal searchable/filterable data table page template.
 *
 * Props:
 *   title       — page heading
 *   subtitle    — optional subheading
 *   columns     — array of { key, label, render?: (row) => ReactNode }
 *   rows        — array of data objects
 *   filters     — array of { label, value } for tab/pill filters (optional)
 *   activeFilter— currently active filter value
 *   onFilter    — (value) => void
 *   searchQuery — controlled search string
 *   onSearch    — (query) => void
 *   actions     — ReactNode rendered top-right (e.g. "Add New" button)
 *   emptyText   — text when no rows (default: "No data found.")
 *   loading     — bool
 */
import React from "react";
import { Search } from "lucide-react";

export function DataTablePage({
  title = "Data",
  subtitle,
  columns = [],
  rows = [],
  filters = [],
  activeFilter,
  onFilter,
  searchQuery = "",
  onSearch,
  actions,
  emptyText = "No data found.",
  loading = false,
}) {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onSearch && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 w-full"
            />
          </div>
        )}
        {filters.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => onFilter && onFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeFilter === f.value
                    ? "bg-[#145C8C] text-black"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-[#145C8C] border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-neutral-500 text-sm">{emptyText}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {rows.map((row, i) => (
                  <tr key={row.id ?? i} className="hover:bg-neutral-800/30 transition">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-neutral-300 whitespace-nowrap">
                        {col.render ? col.render(row) : row[col.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
