"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "../../lib/utils";

/** Measures the height of a DOM element via ResizeObserver — used for animated height transitions. */
export function useMeasure() {
  const [bounds, setBounds] = React.useState({ height: 0, width: 0 })
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setBounds({ height: entry.contentRect.height, width: entry.contentRect.width })
      }
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  return [ref, bounds]
}

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("inline-flex h-10 items-center justify-center rounded-md bg-gray-200 p-1 text-gray-500", className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm",
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2", className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export {
  Tabs, TabsList, TabsTrigger, TabsContent,
  Tabs as AnimatedTabs,
  TabsList as AnimatedTabsList,
  TabsTrigger as AnimatedTabsTrigger,
  TabsContent as AnimatedTabsContent,
}
