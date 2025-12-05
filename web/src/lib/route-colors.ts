// Shared route color configuration for progress bar and other components
// These hex values correspond to Tailwind color classes used in Header.tsx

export const ROUTE_COLORS: Record<string, string> = {
  "/": "#059669", // emerald-600
  "/light": "#ea580c", // orange-600
  "/motion": "#2563eb", // blue-600
  "/sound": "#0891b2", // cyan-600
  "/vibration": "#3f3f46", // zinc-700
  "/gas": "#4b5563", // gray-600
  "/flame": "#dc2626", // red-600
  "/soil-moisture": "#b45309", // amber-700
  "/temperature": "#f97316", // orange-500
  "/humidity": "#38bdf8", // sky-400
};

export const DEFAULT_ROUTE_COLOR = ROUTE_COLORS["/"];

export function getRouteColor(pathname: string): string {
  return ROUTE_COLORS[pathname] || DEFAULT_ROUTE_COLOR;
}
