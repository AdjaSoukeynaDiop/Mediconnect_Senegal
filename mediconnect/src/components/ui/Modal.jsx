import { C, F } from "../../constants/theme.js";
import Icon from "./Icon.jsx";
import { I } from "../../constants/icons.js";

const Modal = ({ open, onClose, title, children, footer, width = 560 }) => {
  if (!open) return null;
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(6,46,41,0.55)", backdropFilter: "blur(5px)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: "white", borderRadius: 20,
        width, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 28px 72px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          padding: "1.3rem 1.6rem 1rem",
          borderBottom: `1px solid ${C.borderLight}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "white", zIndex: 2,
          borderRadius: "20px 20px 0 0",
        }}>
          <span style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1rem", color: C.text }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
              background: "white", display: "flex", alignItems: "center", justifyContent: "center",
              color: C.textLight, cursor: "pointer",
            }}
          >
            <Icon d={I.x} size={14} sw={2} />
          </button>
        </div>

        <div style={{ padding: "1.3rem 1.6rem" }}>{children}</div>

        {footer && (
          <div style={{
            padding: "0.9rem 1.6rem 1.3rem",
            borderTop: `1px solid ${C.borderLight}`,
            display: "flex", justifyContent: "flex-end", gap: "0.7rem",
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
