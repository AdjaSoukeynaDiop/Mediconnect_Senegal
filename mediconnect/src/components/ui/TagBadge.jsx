import { C, F } from "../../constants/theme.js";

export const Tag = ({ children, color = C.primary }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "0.3rem",
    padding: "0.22rem 0.7rem", borderRadius: 100,
    background: `${color}18`, color,
    fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.02em",
    fontFamily: F.title, whiteSpace: "nowrap",
  }}>
    {children}
  </span>
);

export const Badge = ({ children, variant = "teal" }) => {
  const colors = {
    teal:   [C.primaryPale, C.primary],
    green:  ["#e5f7ef", "#17935a"],
    orange: ["#fff0e6", C.warning],
    red:    ["#fdeaea", C.danger],
    blue:   ["#e6f3fc", "#1254a0"],
    gray:   [C.bg, C.textMid],
    purple: ["#ede8ff", "#7050bc"],
  };
  const [bg, col] = colors[variant] || colors.teal;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "0.15rem 0.55rem", borderRadius: 100,
      fontSize: "0.67rem", fontWeight: 600,
      background: bg, color: col, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
};
