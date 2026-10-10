/**
 * AnnaSetu AI — Canonical Design Tokens
 * Source of truth: docs/design.md
 */

export const colors = {
  brand: {
    forest: "#1F5D46",
    deep: "#164333",
    leaf: "#3F8061",
    sage: "#DDEBE1",
    cream: "#FAF7EF",
    paper: "#FFFFFF",
    marigold: "#E8A83E",
    terracotta: "#B85D43",
  },
  ink: {
    primary: "#1C2923",
    secondary: "#59665F",
  },
  line: {
    default: "#DCE4DD",
  },
  state: {
    success: "#237447",
    warning: "#8A5A00",
    danger: "#B42318",
    info: "#175CD3",
  },
} as const;

export const typography = {
  fontFamily: {
    display: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export const radii = {
  sm: "8px",
  md: "12px",
  card: "16px",
  sheet: "20px",
  pill: "9999px",
} as const;
