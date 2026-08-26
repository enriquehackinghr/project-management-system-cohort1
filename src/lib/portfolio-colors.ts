export const PORTFOLIO_COLORS = [
  "#e04e1b",
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#d97706",
  "#0f766e",
  "#db2777",
  "#475569",
];

export function nextPortfolioColor(used: string[]) {
  const taken = new Set(used.map((color) => color.toLowerCase()));
  return (
    PORTFOLIO_COLORS.find((color) => !taken.has(color.toLowerCase())) ??
    PORTFOLIO_COLORS[used.length % PORTFOLIO_COLORS.length]
  );
}
