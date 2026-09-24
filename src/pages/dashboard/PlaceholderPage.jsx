/**
 * PlaceholderPage — Generic empty state for dashboard routes
 * that haven't been built yet.
 */
import React from "react";
import { Card, CardContent } from "../../ui-kit";
import { Construction } from "lucide-react";

export default function PlaceholderPage({ title = "Coming Soon" }) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-neutral-500 mb-6">
        This section is under development.
      </p>
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4">
              <Construction className="h-7 w-7 text-neutral-500" />
            </div>
            <h3 className="text-base font-bold text-neutral-300 mb-2">
              Feature not yet implemented
            </h3>
            <p className="text-sm text-neutral-500 max-w-md leading-relaxed">
              This page will be built in a future iteration. The navigation
              entry is already wired so the layout does not need to change
              when the feature is added.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
