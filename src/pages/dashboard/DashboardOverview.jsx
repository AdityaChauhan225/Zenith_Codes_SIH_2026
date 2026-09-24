/**
 * DashboardOverview — Main dashboard landing page.
 *
 * Composes stat cards from the kit's OverviewPage + custom widgets
 * in a responsive grid. Each widget is a self-contained component
 * from src/components/widgets/.
 */
import React from "react";
import { OverviewPage } from "../../ui-kit";
import { RiskLevelWidget } from "../../components/widgets/RiskLevelWidget";
import { RecentAlertsWidget } from "../../components/widgets/RecentAlertsWidget";
import { ForecastWidget } from "../../components/widgets/ForecastWidget";
import {
  AlertTriangle,
  MapPin,
  Radio,
  CloudRain,
} from "lucide-react";

/* ── Mock stat card data ── */
const stats = [
  {
    label: "Active Alerts",
    value: "3",
    change: "+1 from yesterday",
    changeType: "up",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "red",
  },
  {
    label: "Monitored Regions",
    value: "24",
    icon: <MapPin className="h-4 w-4" />,
    color: "blue",
  },
  {
    label: "IoT Sensors Online",
    value: "142",
    change: "98.6% uptime",
    changeType: "neutral",
    icon: <Radio className="h-4 w-4" />,
    color: "emerald",
  },
  {
    label: "Avg Rainfall (24h)",
    value: "47mm",
    change: "+12mm from avg",
    changeType: "up",
    icon: <CloudRain className="h-4 w-4" />,
    color: "amber",
  },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* ── Kit's OverviewPage for stat cards ── */}
      <OverviewPage
        title="Dashboard"
        stats={stats}
        activities={[]}
        quickLinks={[]}
        accentColor="#145C8C"
      />

      {/* ── Widget Grid ── */}
      <div className="px-6 pb-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Level — takes 1 column */}
          <RiskLevelWidget level="orange" region="Chamoli, Uttarakhand" />

          {/* Recent Alerts — takes 1 column */}
          <RecentAlertsWidget />

          {/* Forecast — takes 1 column */}
          <ForecastWidget />
        </div>
      </div>
    </div>
  );
}
