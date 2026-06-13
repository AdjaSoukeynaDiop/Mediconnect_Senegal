import { useState } from "react";
import { C, F } from "../../constants/theme.js";
import Icon from "./Icon.jsx";
import { I } from "../../constants/icons.js";

const InputField = ({ label, type = "text", value, onChange, placeholder, icon, required, options, ...rest }) => {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  const isPass = type === "password";

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontWeight: 600, fontSize: "0.8rem",
        color: C.textMid, marginBottom: "0.35rem", fontFamily: F.title,
      }}>
        {label}
        {required && <span style={{ color: C.danger }}> *</span>}
      </label>

      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon d={icon} size={15} stroke={focused ? C.primary : C.textLight} sw={1.8} />
          </div>
        )}

        {options ? (
          <select
            value={value} onChange={onChange}
            style={{
              width: "100%", padding: "0.68rem 0.85rem", borderRadius: 10,
              border: `1.5px solid ${focused ? C.primary : C.border}`, outline: "none",
              fontSize: "0.88rem", color: C.text, background: "white",
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={isPass ? (show ? "text" : "password") : type}
            value={value} onChange={onChange} placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...rest}
            style={{
              width: "100%",
              padding: `0.68rem ${isPass ? "2.8rem" : "0.85rem"} 0.68rem ${icon ? "2.5rem" : "0.85rem"}`,
              borderRadius: 10, border: `1.5px solid ${focused ? C.primary : C.border}`,
              outline: "none", fontSize: "0.88rem", color: C.text, background: "white",
              transition: "border-color 0.15s",
              boxShadow: focused ? `0 0 0 3px ${C.primary}18` : "none",
            }}
          />
        )}

        {isPass && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: C.textLight,
            }}
          >
            <Icon d={show ? I.eyeOff : I.eye} size={15} sw={1.8} />
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
