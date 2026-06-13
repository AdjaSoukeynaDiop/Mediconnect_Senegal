import { useState, useEffect, useRef } from "react";
import { C, F } from "../../constants/theme.js";

/**
 * SearchableSelect — dropdown filtrable par frappe
 *
 * Props :
 *   items       [{id, nom}] ou [string]
 *   value       id ou string sélectionné
 *   onChange    (value) => void
 *   placeholder string
 *   disabled    bool
 *   label       string (optionnel, affiché au-dessus)
 *   required    bool
 */
const SearchableSelect = ({
  items = [],
  value,
  onChange,
  placeholder = "— Sélectionner —",
  disabled = false,
  label,
  required = false,
}) => {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref = useRef(null);

  const isObjectList = items.length > 0 && typeof items[0] === "object";

  const getId  = (item) => (isObjectList ? item.id  : item);
  const getNom = (item) => (isObjectList ? item.nom : item);

  const filtered = items.filter((item) =>
    getNom(item).toLowerCase().includes(query.toLowerCase())
  );

  const selectedItem = value
    ? items.find((item) => getId(item) === value)
    : null;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const labelStyle = {
    display: "block", fontWeight: 600, fontSize: "0.8rem",
    color: C.textMid, marginBottom: "0.35rem", fontFamily: F.title,
  };

  const triggerStyle = {
    width: "100%", padding: "0.68rem 0.85rem", borderRadius: 10,
    border: `1.5px solid ${C.border}`, outline: "none",
    fontSize: "0.88rem", background: disabled ? C.bg : "white",
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: "left", color: C.text, fontFamily: F.body,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    boxSizing: "border-box",
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      {label && (
        <label style={labelStyle}>
          {label} {required && <span style={{ color: "#e53e3e" }}>*</span>}
        </label>
      )}
      <div ref={ref} style={{ position: "relative" }}>
        {disabled ? (
          <div style={{ ...triggerStyle, cursor: "not-allowed" }}>
            <span>{selectedItem ? getNom(selectedItem) : <span style={{ color: C.textLight }}>{placeholder}</span>}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setOpen(!open); if (!open) setQuery(""); }}
            style={triggerStyle}
          >
            <span>
              {selectedItem
                ? getNom(selectedItem)
                : <span style={{ color: C.textLight }}>{placeholder}</span>
              }
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s", flexShrink: 0, marginLeft: "0.5rem" }}>
              <path d="M2 4 L6 8 L10 4" stroke={C.textLight} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {open && !disabled && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000,
            background: "white", border: `1.5px solid ${C.border}`, borderRadius: 10,
            boxShadow: "0 6px 30px rgba(0,0,0,0.13)", overflow: "hidden",
          }}>
            <div style={{ padding: "0.45rem 0.6rem", borderBottom: `1px solid ${C.borderLight}` }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                style={{
                  width: "100%", padding: "0.4rem 0.6rem",
                  border: `1px solid ${C.border}`, borderRadius: 7,
                  fontSize: "0.83rem", outline: "none", boxSizing: "border-box",
                  fontFamily: F.body,
                }}
              />
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "0.75rem", fontSize: "0.82rem", color: C.textLight, textAlign: "center" }}>
                  Aucun résultat
                </div>
              ) : (
                filtered.map((item) => {
                  const id  = getId(item);
                  const nom = getNom(item);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { onChange(id); setOpen(false); setQuery(""); }}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "0.5rem 0.85rem",
                        border: "none",
                        background: id === value ? C.primaryPale : "transparent",
                        color: id === value ? C.primary : C.text,
                        fontSize: "0.83rem", cursor: "pointer",
                        fontFamily: F.body,
                      }}
                    >
                      {nom}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
