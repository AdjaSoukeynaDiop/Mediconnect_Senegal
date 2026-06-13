import { useState } from "react";
import { C, F } from "../../constants/theme.js";
import Icon from "./Icon.jsx";

const Btn = ({ children, variant = "primary", size = "md", onClick, style = {}, icon, full = false, disabled = false }) => {
  const [hov, setHov] = useState(false);

  const pad = size === "lg" ? "0.85rem 1.8rem" : size === "sm" ? "0.42rem 0.9rem" : "0.62rem 1.3rem";
  const fs  = size === "lg" ? "1rem"           : size === "sm" ? "0.78rem"        : "0.85rem";

  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: "0.45rem", borderRadius: 10, fontWeight: 600, transition: "all 0.18s",
    width: full ? "100%" : undefined,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: F.title, padding: pad, fontSize: fs,
    opacity: disabled ? 0.6 : 1,
  };

  const v = {
    primary: { background: hov ? C.primaryDark : C.primary, color: "white", boxShadow: hov ? `0 6px 20px ${C.primary}55` : `0 2px 8px ${C.primary}33`, transform: hov ? "translateY(-1px)" : "none" },
    outline:  { background: hov ? C.primaryPale : "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, transform: hov ? "translateY(-1px)" : "none" },
    ghost:    { background: hov ? C.primaryPale : "transparent", color: C.textMid },
    white:    { background: hov ? "rgba(255,255,255,0.95)" : "white", color: C.primaryDark, boxShadow: hov ? "0 6px 20px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.08)", transform: hov ? "translateY(-1px)" : "none" },
    danger:   { background: hov ? "#a82828" : C.danger, color: "white" },
  };

  return (
    <button
      style={{ ...base, ...v[variant], ...style }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={disabled ? undefined : onClick}
    >
      {icon && <Icon d={icon} size={15} />}
      {children}
    </button>
  );
};

export default Btn;
