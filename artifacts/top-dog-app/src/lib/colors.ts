export const COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
  yellow: "#eab308",
  gray: "#6b7280",
  black: "#111827",
  tan: "#d4a574",
  "light blue": "#7dd3fc",
  white: "#f9fafb",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  brown: "#78350f",
  clear: "transparent",
  none: "transparent",
};

export function getColorHex(colorName: string): string {
  if (!colorName) return "transparent";
  const normalized = colorName.toLowerCase().trim();
  return COLOR_MAP[normalized] || "#94a3b8"; // fallback to a generic gray
}
