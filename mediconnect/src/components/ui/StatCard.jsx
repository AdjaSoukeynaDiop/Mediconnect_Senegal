import { C, F } from "../../constants/theme.js";
import Icon from "./Icon.jsx";

const StatCard = ({ label, value, sub, color, icon, delta }) => (
  <div style={{
    background: "white", borderRadius: 16, padding: "1.2rem",
    border: `1px solid ${C.borderLight}`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: `${color}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon d={icon} size={17} stroke={color} sw={1.8} />
      </div>
      <span style={{ fontSize: "0.72rem", color: C.textLight, fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color }}>{value}</div>
    <div style={{ fontSize: "0.7rem", color: delta?.up ? "#17935a" : C.textLight, marginTop: "0.2rem" }}>
      {sub}
    </div>
  </div>
);

export default StatCard;
