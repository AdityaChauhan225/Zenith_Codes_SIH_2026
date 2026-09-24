/**
 * ForecastWidget — Placeholder widget for forecast data visualization.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  PLACEHOLDER WIDGET — This demonstrates the empty/loading      │
 * │  state pattern. Replace with a chart library (Recharts, etc.)  │
 * │  when forecast API is available.                                │
 * │                                                                 │
 * │  HOW TO ADD A NEW WIDGET:                                       │
 * │  1. Create a new file in src/components/widgets/               │
 * │  2. Use the kit's Card/CardHeader/CardContent components       │
 * │  3. Import and place it in DashboardOverview.jsx grid          │
 * └─────────────────────────────────────────────────────────────────┘
 */
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui-kit";
import { BarChart3, Radio } from "lucide-react";

export function ForecastWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BarChart3 className="h-4 w-4 text-[#1B7A8C]" />
          Forecast Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* ── Empty state — intentionally designed, not broken ── */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4">
            <Radio className="h-6 w-6 text-neutral-500" />
          </div>
          <h4 className="text-sm font-bold text-neutral-300 mb-2">
            Forecast data will appear here
          </h4>
          <p className="text-xs text-neutral-500 max-w-[280px] leading-relaxed">
            Once IoT sensors are connected and the prediction model is running,
            this widget will show 6-hour rainfall and flood risk forecasts for
            monitored regions.
          </p>
        </div>

        {/* ── Placeholder timeline bars ── */}
        <div className="mt-4 space-y-2">
          {["+1h", "+2h", "+3h", "+4h", "+5h", "+6h"].map((label) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[10px] text-neutral-600 w-6 font-mono">{label}</span>
              <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-neutral-700"
                  style={{ width: `${Math.random() * 30 + 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
