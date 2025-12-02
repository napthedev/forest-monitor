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
