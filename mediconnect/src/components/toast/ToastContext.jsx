import React, { useState, useCallback, useContext } from "react";
import { C } from "../../constants/theme.js";
import Icon from "../ui/Icon.jsx";
import { I } from "../../constants/icons.js";

// Contexte exporté séparément pour que useToast puisse l'importer
export const ToastCtx = React.createContext(() => {});

export const useToast = () => useContext(ToastCtx);

const ToastContext = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      <div style={{
        position: "fixed", bottom: "1.5rem", right: "1.5rem",
        zIndex: 300, display: "flex", flexDirection: "column", gap: "0.5rem",
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.72rem 1.1rem", borderRadius: 12, fontSize: "0.82rem", fontWeight: 500,
              background: t.type === "success" ? "#17935a" : t.type === "warning" ? C.warning : C.danger,
              color: "white", boxShadow: "0 8px 28px rgba(0,0,0,0.2)", animation: "toastIn 0.25s ease",
            }}
          >
            <Icon d={t.type === "success" ? I.check : I.bell} size={15} stroke="white" sw={2.5} />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

export default ToastContext;
