import { C, F } from "../../constants/theme.js";

export const Card = ({ children, style = {} }) => (
  <div style={{
    background: "white", borderRadius: 16,
    border: `1px solid ${C.borderLight}`, overflow: "hidden",
    ...style,
  }}>
    {children}
  </div>
);

export const CardHead = ({ title, sub, action }) => (
  <div style={{
    padding: "1rem 1.2rem 0.8rem",
    borderBottom: `1px solid ${C.borderLight}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <div>
      <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.9rem", color: C.text }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: "0.7rem", color: C.textLight, marginTop: "0.1rem" }}>
          {sub}
        </div>
      )}
    </div>
    {action}
  </div>
);
