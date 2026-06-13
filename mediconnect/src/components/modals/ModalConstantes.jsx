import { useState } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import Modal from "../ui/Modal.jsx";
import Btn from "../ui/Btn.jsx";

const FIELDS = [
  ["Tension systolique",  "sys",    "mmHg"],
  ["Tension diastolique", "dia",    "mmHg"],
  ["Fréq. cardiaque",     "fc",     "bpm"],
  ["SpO₂",               "spo2",   "%"],
  ["Température",         "temp",   "°C"],
  ["Poids",               "poids",  "kg"],
  ["Taille",              "taille", "cm"],
];

const ModalConstantes = ({ open, onClose, toast, patient }) => {
  const [form, setForm] = useState({ sys:"",dia:"",fc:"",spo2:"",temp:"",poids:"",taille:"",obs:"" });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const imc    = form.poids && form.taille ? (form.poids / ((form.taille / 100) ** 2)).toFixed(1) : "—";
  const highTA = parseInt(form.sys) > 140 || parseInt(form.dia) > 90;

  const save = () => {
    if (!form.sys || !form.dia) { toast("TA obligatoire", "warning"); return; }
    toast("Constantes enregistrées", "success");
    onClose();
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title={`Constantes — ${patient?.nom || "Patient"}`}
      width={520}
      footer={<><Btn variant="outline" onClick={onClose}>Annuler</Btn><Btn onClick={save} icon={I.check}>Enregistrer</Btn></>}
    >
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
        {FIELDS.map(([lbl, key, unit]) => (
          <div key={key}>
            <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600, color:C.textMid, marginBottom:"0.3rem", fontFamily:F.title }}>{lbl}</label>
            <div style={{ display:"flex", border:`1.5px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
              <input
                type="number" value={form[key]} onChange={set(key)}
                style={{ flex:1, border:"none", outline:"none", padding:"0.6rem 0.75rem", fontSize:"0.88rem", color:C.text }}
              />
              <div style={{ padding:"0 0.65rem", background:C.bg, display:"flex", alignItems:"center", fontSize:"0.68rem", color:C.textLight, borderLeft:`1px solid ${C.borderLight}` }}>{unit}</div>
            </div>
          </div>
        ))}
        <div>
          <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600, color:C.textMid, marginBottom:"0.3rem", fontFamily:F.title }}>IMC calculé</label>
          <div style={{ padding:"0.6rem 0.75rem", border:`1.5px solid ${C.borderLight}`, borderRadius:10, background:C.bg, fontSize:"0.88rem", color:C.textMid }}>{imc} kg/m²</div>
        </div>
      </div>

      {highTA && (form.sys || form.dia) && (
        <div style={{ background:"#fdeaea", border:"1px solid #f5bcbc", borderRadius:10, padding:"0.7rem 0.9rem", marginTop:"0.75rem", fontSize:"0.78rem", color:C.danger }}>
          ⚠ Tension artérielle élevée — une alerte sera générée automatiquement.
        </div>
      )}

      <div style={{ marginTop:"0.75rem" }}>
        <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600, color:C.textMid, marginBottom:"0.3rem", fontFamily:F.title }}>Observations</label>
        <textarea
          value={form.obs} onChange={set("obs")} placeholder="Observations cliniques…"
          style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:10, padding:"0.65rem 0.85rem", fontSize:"0.85rem", resize:"vertical", minHeight:64, outline:"none", fontFamily:F.body, color:C.text }}
        />
      </div>
    </Modal>
  );
};

export default ModalConstantes;
