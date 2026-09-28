/**
 * RecentAlertsWidget — Displays a feed of recent flood/landslide alerts
 * with severity-coloured indicators.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  EXAMPLE WIDGET — Replace mock data with real alert feed API.  │
 * └─────────────────────────────────────────────────────────────────┘
 */
import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "../../ui-kit";
import { Bell } from "lucide-react";

const MOCK_ALERTS = [
  {
    id: 1,
    region: "Chamoli, Uttarakhand",
    severity: "orange",
    variant: "severity-orange",
    message: "Heavy rainfall forecast. Soil saturation at 87%. Prepare evacuation routes.",
    time: "14 min ago",
    dotColor: "bg-orange-400",
  },
  {
    id: 2,
    region: "Kinnaur, Himachal Pradesh",
    severity: "yellow",
    variant: "severity-yellow",
    message: "Moderate rainfall. Stream levels rising. Monitor conditions.",
    time: "1 hr ago",
    dotColor: "bg-yellow-400",
  },
  {
    id: 3,
    region: "Pithoragarh, Uttarakhand",
    severity: "red",
    variant: "severity-red",
    message: "Flash flood in progress on Kali River tributary. Evacuate low-lying areas.",
    time: "2 hr ago",
    dotColor: "bg-red-400",
  },
  {
    id: 4,
    region: "Wayanad, Kerala",
    severity: "green",
    variant: "severity-green",
    message: "Alert downgraded. Rainfall subsided. Conditions returning to normal.",
    time: "4 hr ago",
    dotColor: "bg-emerald-400",
  },
];

export function RecentAlertsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Bell className="h-4 w-4 text-[#1B7A8C]" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {MOCK_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition"
            >
              <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${alert.dotColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white truncate">
                    {alert.region}
                  </span>
                  <Badge variant={alert.variant} className="shrink-0">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {alert.message}
                </p>
              </div>
              <span className="text-[10px] text-neutral-600 shrink-0 whitespace-nowrap">
                {alert.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
