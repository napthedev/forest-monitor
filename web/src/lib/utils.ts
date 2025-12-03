// Format relative time (e.g., "2 seconds ago", "1 minute ago")
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 1) return "just now";
  if (diffInSeconds === 1) return "1 second ago";
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes === 1) return "1 minute ago";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return "1 hour ago";
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1 day ago";
  return `${diffInDays} days ago`;
}

// Format timestamp for display
export function formatTime(timestamp: string | number): string {
  const date = new Date(
    typeof timestamp === "string" ? parseInt(timestamp) : timestamp
  );
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Format timestamp for display with date
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Convert raw sensor value (0-4095) to percentage (0-100%)
// 0 = lightest (100%), 4095 = darkest (0%)
export function convertToPercentage(rawValue: number): number {
  return Math.round(((4095 - rawValue) / 4095) * 100 * 10) / 10;
}

// Determine light level description
export function getLightDescription(percentage: number | null): string {
  if (percentage === null) return "Unknown";
  if (percentage < 20) return "Very Dark";
  if (percentage < 40) return "Dim";
  if (percentage < 60) return "Moderate";
  if (percentage < 80) return "Bright";
  return "Very Bright";
}

// Get gradient color based on light level
export function getGradientColor(percentage: number | null): string {
  if (percentage === null) return "from-gray-400 to-gray-500";
  if (percentage < 30) return "from-orange-800 to-orange-700";
  if (percentage < 60) return "from-orange-700 to-amber-600";
  return "from-amber-600 to-orange-500";
}

// Convert raw gas sensor value (0-4095) to percentage (0-100%)
// Higher raw value = higher gas concentration = higher percentage
export function convertToGasPercentage(rawValue: number): number {
  return Math.round((rawValue / 4095) * 100 * 10) / 10;
}

// Determine gas level description
export function getGasDescription(percentage: number | null): string {
  if (percentage === null) return "Unknown";
  if (percentage < 25) return "Safe";
  if (percentage < 60) return "Moderate";
  if (percentage < 75) return "Elevated";
  return "Warning";
}

// Get gradient color based on gas level
export function getGasGradientColor(percentage: number | null): string {
  if (percentage === null) return "from-gray-400 to-gray-500";
  if (percentage < 25) return "from-gray-600 to-slate-500";
  if (percentage < 60) return "from-amber-600 to-yellow-500";
  return "from-red-600 to-orange-500";
}

// Flame sensor threshold: raw value below this indicates fire
// Raw value 0 = fire, 4095 = no fire
export const FLAME_RAW_THRESHOLD = 1000;

// Convert raw flame sensor value (0-4095) to percentage (0-100%)
// 0 = fire detected (100%), 4095 = no fire (0%)
export function convertToFlamePercentage(rawValue: number): number {
  return Math.round(((4095 - rawValue) / 4095) * 100 * 10) / 10;
}

// Check if raw flame value indicates fire (below threshold)
export function isFireDetected(rawValue: number): boolean {
  return rawValue < FLAME_RAW_THRESHOLD;
}

// Get the percentage threshold for fire alert
// This is the percentage equivalent of FLAME_RAW_THRESHOLD
export function getFlameAlertThreshold(): number {
  return Math.round(((4095 - FLAME_RAW_THRESHOLD) / 4095) * 100 * 10) / 10;
}

// Determine flame level description
export function getFlameDescription(percentage: number | null): string {
  if (percentage === null) return "Unknown";
  const threshold = getFlameAlertThreshold();
  if (percentage < 20) return "Safe";
  if (percentage < 50) return "Low Detection";
  if (percentage < threshold) return "Elevated";
  return "Fire Alert!";
}

// Get gradient color based on flame level
export function getFlameGradientColor(percentage: number | null): string {
  if (percentage === null) return "from-gray-400 to-gray-500";
  const threshold = getFlameAlertThreshold();
  if (percentage < 20) return "from-green-600 to-emerald-500";
  if (percentage < 50) return "from-yellow-600 to-amber-500";
  if (percentage < threshold) return "from-orange-600 to-red-500";
  return "from-red-700 to-rose-600";
}

// Convert raw soil moisture sensor value (0-4095) to percentage (0-100%)
// Raw value 0 = high moisture (100%), 4095 = very dry (0%)
export function convertToMoisturePercentage(rawValue: number): number {
  return Math.round(((4095 - rawValue) / 4095) * 100 * 10) / 10;
}

// Determine soil moisture level description
export function getMoistureDescription(percentage: number | null): string {
  if (percentage === null) return "Unknown";
  if (percentage < 20) return "Dry";
  if (percentage < 40) return "Low";
  if (percentage < 70) return "Optimal";
  if (percentage < 90) return "High";
  return "Saturated";
}

// Get gradient color based on soil moisture level
export function getMoistureGradientColor(percentage: number | null): string {
  if (percentage === null) return "from-gray-400 to-gray-500";
  if (percentage < 20) return "from-amber-800 to-yellow-700";
  if (percentage < 40) return "from-amber-700 to-yellow-600";
  if (percentage < 70) return "from-amber-600 to-yellow-500";
  if (percentage < 90) return "from-yellow-600 to-amber-500";
  return "from-blue-600 to-cyan-500";
}

// Sound sensor alert threshold: percentage above which alert is shown
export const SOUND_ALERT_THRESHOLD = 75;

// Convert raw sound sensor value (0-4095) to percentage (0-100%)
// Higher raw value = louder sound = higher percentage
export function convertToSoundPercentage(rawValue: number): number {
  return Math.round((rawValue / 4095) * 100 * 10) / 10;
}

// Check if sound level is above alert threshold
export function isSoundAlert(percentage: number | null): boolean {
  if (percentage === null) return false;
  return percentage >= SOUND_ALERT_THRESHOLD;
}

// Determine sound level description
export function getSoundDescription(percentage: number | null): string {
  if (percentage === null) return "Unknown";
  if (percentage < 25) return "Quiet";
  if (percentage < 50) return "Moderate";
  if (percentage < 75) return "Loud";
  return "Very Loud";
}

// Get gradient color based on sound level
export function getSoundGradientColor(percentage: number | null): string {
  if (percentage === null) return "from-gray-400 to-gray-500";
  if (percentage < 25) return "from-cyan-600 to-sky-500";
  if (percentage < 50) return "from-cyan-500 to-teal-500";
  if (percentage < 75) return "from-cyan-600 to-sky-600";
  return "from-cyan-700 to-teal-600";
}
