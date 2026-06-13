import { useState, useEffect, useCallback } from "react";
import { C, F } from "../constants/theme.js";
import { I } from "../constants/icons.js";
import { useToast } from "../components/toast/ToastContext.jsx";
import { useAuth } from "../api/AuthContext.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import { Card, CardHead } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/TagBadge.jsx";
import Btn from "../components/ui/Btn.jsx";
import Icon from "../components/ui/Icon.jsx";
import PageCarto from "../pages/shared/PageCarto.jsx";
import { usePatients } from "../api/usePatients.js";
import {
  getMedecins,
  getMedecinsEnAttente as getMedecinsEnAttenteApi,
  validerMedecin,
  activerMedecin,
  desactiverMedecin,
} from "../api/medecins.api.js";
import { getInfirmiers, activerInfirmier, desactiverInfirmier } from "../api/infirmiers.api.js";
import { getAssistants, activerAssistant, desactiverAssistant } from "../api/assistants.api.js";
import { getHopitaux } from "../api/hopitaux.api.js";
import { getAdminStats, getAdminActivity, createHopital } from "../api/admin.api.js";

/* ════════════════════════════════════
   UTILITAIRE CSV
════════════════════════════════════ */
function downloadCSV(rows, columns, filename) {
  if (!rows.length) return;
  const header = columns.map(c => `"${c.label}"`).join(",");
  const body = rows.map(row =>
    columns.map(c => {
      const val = c.get(row) ?? "";
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  ).join("\n");
  const blob = new Blob(["﻿" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ════════════════════════════════════
   CHAMP ÉDITABLE inline
════════════════════════════════════ */
const EditableField = ({ value: initialValue, onSave, options }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const handleSave = () => { onSave(value); setEditing(false); };
  const handleCancel = () => { setValue(initialValue); setEditing(false); };

  if (!editing) return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontWeight: 500, color: C.text, fontSize: "0.8rem" }}>{value}</span>
      <button onClick={() => setEditing(true)} style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6, transition: "opacity 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
        <Icon d={I.settings} size={11} sw={2} />
      </button>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      {options ? (
        <select value={value} onChange={e => setValue(e.target.value)} style={{ border: `1.5px solid ${C.primary}`, borderRadius: 7, padding: "0.3rem 0.5rem", fontSize: "0.78rem", outline: "none", fontFamily: F.body, color: C.text, background: "white" }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" value={value} onChange={e => setValue(e.target.value)} autoFocus
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
          style={{ border: `1.5px solid ${C.primary}`, borderRadius: 7, padding: "0.3rem 0.6rem", fontSize: "0.78rem", outline: "none", fontFamily: F.body, color: C.text, minWidth: 160 }} />
      )}
      <button onClick={handleSave} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "#e5f7ef", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon d={I.check} size={12} stroke="#17935a" sw={2.5} />
      </button>
      <button onClick={handleCancel} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: `${C.danger}12`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon d={I.x} size={12} stroke={C.danger} sw={2.5} />
      </button>
    </div>
  );
};

/* ════════════════════════════════════
   MODAL AJOUT ÉTABLISSEMENT
════════════════════════════════════ */
const ModalAddEtab = ({ onClose, onSaved }) => {
  const toast = useToast();
  const [form, setForm] = useState({ nom: "", typeEtablissement: "PUBLIC", telephone: "", latitude: "", longitude: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) { toast("Le nom est obligatoire", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        typeEtablissement: form.typeEtablissement || null,
        telephone: form.telephone.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      const res = await createHopital(payload);
      toast(res.message ?? "Établissement créé", "success");
      onSaved(res.data);
      onClose();
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la création", "error");
    } finally {
      setSaving(false);
    }
  };

  const ipt = { border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0.5rem 0.7rem", fontSize: "0.82rem", fontFamily: F.body, color: C.text, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(3px)" }}>
      <div style={{ background: "white", borderRadius: 18, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
        <div style={{ padding: "1.2rem 1.5rem", background: `linear-gradient(135deg, ${C.primaryDeep}, ${C.primary})`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.title, fontWeight: 800, color: "white", fontSize: "1rem" }}>Ajouter un établissement</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", marginTop: "0.15rem" }}>Réseau hospitalier MediConnect</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <Icon d={I.x} size={13} stroke="white" sw={2.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "1.4rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.3rem" }}>Nom de l'établissement *</label>
            <input style={ipt} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="ex. Hôpital de la Paix" required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.3rem" }}>Type</label>
              <select style={ipt} value={form.typeEtablissement} onChange={e => setForm(f => ({ ...f, typeEtablissement: e.target.value }))}>
                <option value="PUBLIC">Public</option>
                <option value="PRIVEE">Privé</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.3rem" }}>Téléphone</label>
              <input style={ipt} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="ex. 33 869 10 10" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.3rem" }}>Latitude</label>
              <input style={ipt} type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="ex. 14.693" />
            </div>
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.3rem" }}>Longitude</label>
              <input style={ipt} type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="ex. -17.447" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.3rem" }}>
            <button type="button" onClick={onClose} style={{ padding: "0.5rem 1rem", borderRadius: 8, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", fontSize: "0.82rem", color: C.textMid, fontFamily: F.body }}>
              Annuler
            </button>
            <button type="submit" disabled={saving} style={{ padding: "0.5rem 1.2rem", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${C.primaryDeep}, ${C.primary})`, color: "white", cursor: saving ? "default" : "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: F.body, opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {saving ? "Enregistrement…" : "Créer l'établissement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ════════════════════════════════════
   ADMIN DASHBOARD
════════════════════════════════════ */
const AdminDashboard = ({ setPage }) => {
  const { user: adminUser, logout } = useAuth();
  const [active, setActive] = useState("accueil");
  const toast = useToast();

  /* ── Données réelles ── */
  const { patients, loading: loadingPatients, activer: activerPat, desactiver: desactiverPat } = usePatients();
  const [medecins,          setMedecins]          = useState([]);
  const [medecinsEnAttente, setMedecinsEnAttente] = useState([]);
  const [loadingMedecins,   setLoadingMedecins]   = useState(false);
  const [infirmiers,        setInfirmiers]        = useState([]);
  const [loadingInfirmiers, setLoadingInfirmiers] = useState(false);
  const [assistants,        setAssistants]        = useState([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [hopitaux,          setHopitaux]          = useState([]);
  const [loadingHopitaux,   setLoadingHopitaux]   = useState(false);
  const [stats,             setStats]             = useState(null);
  const [loadingStats,      setLoadingStats]      = useState(false);
  const [activity,          setActivity]          = useState([]);
  const [loadingActivity,   setLoadingActivity]   = useState(false);
  const [showAddEtab,       setShowAddEtab]       = useState(false);
  const [copied,            setCopied]            = useState(null);

  const copyField = (value, key) => {
    navigator.clipboard?.writeText(value)
      .then(() => { setCopied(key); setTimeout(() => setCopied(null), 1800); })
      .catch(() => {});
  };

  /* ── Chargement médecins ── */
  const chargerMedecins = useCallback(async () => {
    setLoadingMedecins(true);
    try {
      const [med, att] = await Promise.all([getMedecins(), getMedecinsEnAttenteApi()]);
      setMedecins(Array.isArray(med) ? med : []);
      const attData = att?.data ?? att;
      setMedecinsEnAttente(Array.isArray(attData) ? attData : []);
    } catch {
      setMedecins([]);
      setMedecinsEnAttente([]);
    } finally {
      setLoadingMedecins(false);
    }
  }, []);

  /* ── Chargement global ── */
  useEffect(() => {
    chargerMedecins();

    const loadData = async () => {
      // Infirmiers
      setLoadingInfirmiers(true);
      try { const r = await getInfirmiers(); setInfirmiers(Array.isArray(r) ? r : []); }
      catch { setInfirmiers([]); }
      finally { setLoadingInfirmiers(false); }

      // Assistants
      setLoadingAssistants(true);
      try {
        const r = await getAssistants();
        const list = r?.data ?? r;
        setAssistants(Array.isArray(list) ? list : []);
      }
      catch { setAssistants([]); }
      finally { setLoadingAssistants(false); }

      // Hopitaux
      setLoadingHopitaux(true);
      try { const r = await getHopitaux(); setHopitaux(Array.isArray(r) ? r : []); }
      catch { setHopitaux([]); }
      finally { setLoadingHopitaux(false); }

      // Stats
      setLoadingStats(true);
      try { const r = await getAdminStats(); setStats(r); }
      catch { setStats(null); }
      finally { setLoadingStats(false); }

      // Activity
      setLoadingActivity(true);
      try { const r = await getAdminActivity(); setActivity(Array.isArray(r) ? r : []); }
      catch { setActivity([]); }
      finally { setLoadingActivity(false); }
    };

    loadData();
  }, [chargerMedecins]);

  /* ── Actions médecins ── */
  const handleValider = async (id) => {
    try { await validerMedecin(id); await chargerMedecins(); toast("Médecin validé — il peut maintenant se connecter", "success"); }
    catch (err) { toast(err.apiMessage ?? "Erreur lors de la validation", "error"); }
  };
  const handleActiverMedecin = async (id) => {
    try { await activerMedecin(id); await chargerMedecins(); toast("Compte médecin activé", "success"); }
    catch (err) { toast(err.apiMessage ?? "Erreur", "error"); }
  };
  const handleDesactiverMedecin = async (id) => {
    try { await desactiverMedecin(id); await chargerMedecins(); toast("Compte médecin désactivé", "warning"); }
    catch (err) { toast(err.apiMessage ?? "Erreur", "error"); }
  };

  /* ── Actions patients ── */
  const handleActiverPatient = async (id) => {
    try { await activerPat(id); toast("Compte patient activé", "success"); }
    catch (err) { toast(err.apiMessage ?? "Erreur", "error"); }
  };
  const handleDesactiverPatient = async (id) => {
    try { await desactiverPat(id); toast("Compte patient désactivé", "warning"); }
    catch (err) { toast(err.apiMessage ?? "Erreur", "error"); }
  };

  /* ── Actions assistants ── */
  const handleActiverAssistant = async (id) => {
    try {
      const res = await activerAssistant(id);
      const a = res?.data ?? res;
      setAssistants(prev => prev.map(x => x.id === id ? { ...x, ...a } : x));
      toast("Compte assistant activé", "success");
    } catch (err) { toast(err.apiMessage ?? "Erreur", "error"); }
  };
  const handleDesactiverAssistant = async (id) => {
    try {
      const res = await desactiverAssistant(id);
      const a = res?.data ?? res;
      setAssistants(prev => prev.map(x => x.id === id ? { ...x, ...a } : x));
      toast("Compte assistant désactivé", "warning");
    } catch (err) { toast(err.apiMessage ?? "Erreur", "error"); }
  };

  /* ── Actions infirmiers ── */
  const handleActiverInfirmier = async (id) => {
    try {
      const res = await activerInfirmier(id);
      const inf = res?.data ?? res;
      setInfirmiers(prev => prev.map(i => i.id === id ? { ...i, ...inf } : i));
      toast("Compte infirmier activé", "success");
    } catch (err) { toast(err.apiMessage ?? "Erreur", "error"); }
  };
  const handleDesactiverInfirmier = async (id) => {
    try {
      const res = await desactiverInfirmier(id);
      const inf = res?.data ?? res;
      setInfirmiers(prev => prev.map(i => i.id === id ? { ...i, ...inf } : i));
      toast("Compte infirmier désactivé", "warning");
    } catch (err) { toast(err.apiMessage ?? "Erreur", "error"); }
  };

  /* ── Profil admin ── */
  const adminInitiales = adminUser ? `${adminUser.prenom?.[0] ?? ""}${adminUser.nom?.[0] ?? ""}`.toUpperCase() || "AD" : "AD";
  const adminNom = adminUser ? `${adminUser.prenom ?? ""} ${adminUser.nom ?? ""}`.trim() || "Administrateur" : "Administrateur";

  /* ── Stats locales (fallback si API stats pas encore chargée) ── */
  const patientsActifs   = patients.filter(p => p.actif).length;
  const medecinsActifs   = medecins.filter(m => m.actif).length;
  const medecinsValides  = medecins.filter(m => m.verified).length;
  const pendingCount     = medecinsEnAttente.length;
  const infirmiersActifs = infirmiers.filter(i => i.actif).length;
  const assistantsActifs = assistants.filter(a => a.actif).length;

  /* ── Navigation ── */
  const nav = [
    { id: "accueil",        label: "Vue d'ensemble",  icon: I.pieChart },
    { id: "patients",       label: "Patients",         icon: I.users },
    { id: "medecins",       label: "Médecins",         icon: I.user },
    { id: "infirmiers",     label: "Infirmiers",       icon: I.activity },
    { id: "assistants",     label: "Assistants",       icon: I.user },
    { id: "validations",    label: "Validations",      icon: I.shield, badge: pendingCount },
    { id: "etablissements", label: "Établissements",   icon: I.layers },
    { id: "cartographie",   label: "Cartographie",     icon: I.map },
    { id: "statistiques",   label: "Statistiques",     icon: I.barChart },
    { id: "securite",       label: "Sécurité & Audit", icon: I.shield },
    { id: "parametres",     label: "Paramètres",       icon: I.settings },
  ];

  /* ── Paramètres éditables ── */
  const [params, setParams] = useState({
    nomPlateforme: "MediConnect Sénégal",
    version:       "v2.0.1 — SIPREC-SEN",
    environnement: "Production",
    pays:          "Sénégal",
    tlsVersion:    "TLS 1.3 — Actif",
    chiffrement:   "AES-256 — Actif",
    mfa:           "Oui — Tous profils médicaux",
    dureeSession:  "8 heures",
    fhir:          "R4 — Connecté",
    cnam:          "API v2 — Actif",
    ipres:         "API v1 — Actif",
    sms:           "Orange Sénégal — Actif",
  });
  const updateParam = (key) => (newVal) => {
    setParams(p => ({ ...p, [key]: newVal }));
    toast("Paramètre mis à jour", "success");
  };

  /* ── Couleurs avatar ── */
  const avatarColors = ["#d97030","#1660a8","#7050bc","#17935a","#0a7c6e","#6a9e98","#c74b8a","#2d7db0"];
  const avatarColor  = (id) => avatarColors[(id ?? 0) % avatarColors.length];
  const initiales    = (p) => `${p.prenom?.[0] ?? ""}${p.nom?.[0] ?? ""}`.toUpperCase() || "??";

  /* ── Couleur badge activité ── */
  const activityDot = (type) => {
    if (type === "success") return "#17935a";
    if (type === "warning") return C.warning;
    if (type === "info")    return "#1660a8";
    return C.textLight;
  };

  /* ════ RENDER ════ */
  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 252, flexShrink: 0, background: `linear-gradient(170deg, ${C.primaryDeep} 0%, ${C.primaryDark} 50%, ${C.primary} 100%)`, display: "flex", flexDirection: "column", height: "100vh", boxShadow: "4px 0 20px rgba(0,0,0,0.1)" }}>

        {/* Logo */}
        <div style={{ padding: "1.4rem 1.2rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={I.shield} size={18} stroke="#1ecb88" sw={2} />
          </div>
          <div>
            <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "0.95rem", color: "white" }}>MediConnect</div>
            <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Administration</div>
          </div>
        </div>

        {/* Profil admin */}
        <div style={{ margin: "0.9rem", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.75rem 0.9rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7050bc,#9c50e0)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.title, fontWeight: 800, color: "white", fontSize: "0.82rem", flexShrink: 0 }}>
              {adminInitiales}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "white", fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{adminNom}</div>
              <div style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.4)" }}>Super Administrateur</div>
            </div>
            <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#1ecb78", flexShrink: 0 }} />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.4rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.1rem", overflowY: "auto" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)}
              style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.58rem 0.7rem", borderRadius: 9, border: "none", background: active === n.id ? "rgba(255,255,255,0.14)" : "transparent", color: active === n.id ? "white" : "rgba(255,255,255,0.48)", fontSize: "0.82rem", fontWeight: active === n.id ? 600 : 400, cursor: "pointer", transition: "all 0.13s", width: "100%", textAlign: "left" }}>
              <Icon d={n.icon} size={16} sw={1.8} />
              {n.label}
              {n.badge > 0 && (
                <span style={{ marginLeft: "auto", background: C.danger, color: "white", borderRadius: 10, fontSize: "0.63rem", fontWeight: 700, padding: "0.1rem 0.42rem", minWidth: 18, textAlign: "center", flexShrink: 0 }}>
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Déconnexion */}
        <div style={{ padding: "0.55rem 0.8rem 0.7rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", cursor: "pointer", padding: "0.3rem 0.2rem" }}>
            <Icon d={I.arrowL} size={13} sw={2} /> Retour accueil
          </button>
          <button onClick={async () => { await logout(); setPage("home"); }}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(220,50,50,0.09)", border: "1px solid rgba(220,50,50,0.2)", borderRadius: 8, color: "#f87171", fontSize: "0.78rem", cursor: "pointer", padding: "0.3rem 0.55rem", width: "100%", fontWeight: 600 }}>
            <Icon d={I.x} size={13} sw={2} /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>

        {/* ══ ACCUEIL ══ */}
        {active === "accueil" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.8rem" }}>
              <div>
                <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text }}>Vue d'ensemble</h1>
                <p style={{ color: C.textLight, fontSize: "0.85rem", marginTop: "0.2rem" }}>
                  Administration SIPREC-SEN · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              {pendingCount > 0 && (
                <div onClick={() => setActive("validations")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1rem", background: `${C.danger}12`, border: `1px solid ${C.danger}40`, borderRadius: 10, cursor: "pointer" }}>
                  <Icon d={I.shield} size={14} stroke={C.danger} sw={2} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.danger }}>{pendingCount} médecin(s) en attente</span>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "0.8rem", marginBottom: "1.5rem" }}>
              <StatCard label="Patients"             value={loadingPatients   ? "…" : patients.length}   sub={`${patientsActifs} actifs`}                             color={C.primary}  icon={I.users}    delta={{ up: true }} />
              <StatCard label="Médecins"             value={loadingMedecins   ? "…" : medecins.length}   sub={`${medecinsActifs} actifs · ${medecinsValides} validés`} color="#1660a8"    icon={I.user}     delta={{ up: true }} />
              <StatCard label="Infirmiers"           value={loadingInfirmiers ? "…" : infirmiers.length} sub={`${infirmiersActifs} actifs`}                           color="#7050bc"    icon={I.activity} delta={{ up: true }} />
              <StatCard label="Assistants"           value={loadingAssistants ? "…" : assistants.length} sub={`${assistantsActifs} actifs`}                           color="#0a7c6e"    icon={I.user}     delta={{ up: true }} />
              <StatCard label="En attente validation" value={pendingCount}                               sub={pendingCount > 0 ? "Action requise" : "Tous validés"}   color={pendingCount > 0 ? C.danger : "#17935a"} icon={I.shield} />
            </div>

            {pendingCount > 0 && (
              <Card style={{ marginBottom: "1.2rem", border: `1px solid ${C.danger}30` }}>
                <CardHead title={`${pendingCount} médecin(s) en attente de validation`} sub="Ces médecins ne peuvent pas se connecter avant validation"
                  action={<Btn size="sm" variant="outline" onClick={() => setActive("validations")}>Voir tout</Btn>} />
                {medecinsEnAttente.slice(0, 3).map((m, i) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 1.2rem", borderBottom: i < Math.min(pendingCount, 3) - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${C.danger}15`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.title, fontWeight: 800, color: C.danger, fontSize: "0.75rem", flexShrink: 0 }}>
                      {`${m.prenom?.[0] ?? ""}${m.nom?.[0] ?? ""}`.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>Dr. {m.prenom} {m.nom}</div>
                      <div style={{ fontSize: "0.7rem", color: C.textLight }}>{m.specialite} · {m.etablissement} · N° {m.numOrdre}</div>
                    </div>
                    <Btn size="sm" icon={I.check} onClick={() => handleValider(m.id)}>Valider</Btn>
                  </div>
                ))}
              </Card>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
              <Card>
                <CardHead title="Activité récente" sub={loadingActivity ? "Chargement…" : "Dernières inscriptions et actions"} />
                {loadingActivity ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: C.textLight, fontSize: "0.82rem" }}>Chargement…</div>
                ) : activity.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: C.textLight, fontSize: "0.82rem" }}>Aucune activité enregistrée</div>
                ) : activity.slice(0, 6).map((log, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.65rem 1.2rem", borderBottom: i < 5 ? `1px solid ${C.borderLight}` : "none" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: activityDot(log.type), flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 500, color: C.text }}>{log.action}</div>
                      <div style={{ fontSize: "0.68rem", color: C.textLight }}>{log.userName}</div>
                    </div>
                    <span style={{ fontSize: "0.67rem", color: C.textLight, whiteSpace: "nowrap" }}>{fmtDateTime(log.timestamp)}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <CardHead title="Répartition" sub="Utilisateurs et comptes" />
                <div style={{ padding: "1rem 1.2rem" }}>
                  {[
                    ["Patients actifs",    patientsActifs,               C.primary,  patients.length   || 1],
                    ["Patients inactifs",  patients.length - patientsActifs, C.warning, patients.length || 1],
                    ["Médecins validés",   medecinsValides,              "#17935a",  medecins.length   || 1],
                    ["Médecins en attente", pendingCount,                C.danger,   medecins.length   || 1],
                    ["Infirmiers actifs",  infirmiersActifs,             "#7050bc",  infirmiers.length || 1],
                    ["Assistants actifs",  assistantsActifs,             "#0a7c6e",  assistants.length || 1],
                  ].map(([lbl, n, col, total]) => (
                    <div key={lbl} style={{ marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
                        <span style={{ color: C.textMid }}>{lbl}</span>
                        <span style={{ fontWeight: 600, color: C.text }}>{n}</span>
                      </div>
                      <div style={{ height: 6, background: C.bg, borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${Math.min(100, Math.round((n / total) * 100))}%`, background: col, borderRadius: 3, transition: "width 1s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* ══ PATIENTS ══ */}
        {active === "patients" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Patients</h1>
                <p style={{ color: C.textLight, fontSize: "0.82rem", marginTop: "0.2rem" }}>Gestion des comptes patients</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Btn variant="outline" icon={I.download}
                  onClick={() => downloadCSV(patients, [
                    { label: "Prénom",          get: p => p.prenom },
                    { label: "Nom",             get: p => p.nom },
                    { label: "N° Patient",      get: p => p.numPatient },
                    { label: "Email",           get: p => p.email },
                    { label: "Téléphone",       get: p => p.telephone },
                    { label: "Date Naissance",  get: p => fmtDate(p.dateNaissance) },
                    { label: "Sexe",            get: p => p.sexe },
                    { label: "Statut",          get: p => p.actif ? "Actif" : "Inactif" },
                  ], `patients-${new Date().toISOString().split("T")[0]}.csv`)}>
                  Exporter CSV
                </Btn>
                <Btn variant="outline" icon={I.refresh} onClick={() => window.location.reload()}>Actualiser</Btn>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
              <StatCard label="Total patients"  value={patients.length}                  sub="Dossiers créés"     color={C.primary} icon={I.users} />
              <StatCard label="Actifs"          value={patientsActifs}                   sub={`${patients.length ? Math.round((patientsActifs/patients.length)*100) : 0}% du total`} color="#17935a" icon={I.check} delta={{ up: true }} />
              <StatCard label="Inactifs"        value={patients.length - patientsActifs} sub="Comptes suspendus"  color={C.warning} icon={I.x} />
            </div>

            <Card>
              <CardHead title="Liste des patients" sub={loadingPatients ? "Chargement…" : `${patients.length} patient(s)`} />
              {loadingPatients ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.textLight, fontSize: "0.85rem" }}>Chargement des patients…</div>
              ) : patients.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.textLight, fontSize: "0.85rem" }}>Aucun patient enregistré.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {["Patient", "N° Patient", "Email", "Téléphone", "Né(e) le", "Statut", "Actions"].map(h => (
                          <th key={h} style={{ padding: "0.7rem 1.1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.borderLight}`, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.bg}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${avatarColor(p.id)}22`, display: "flex", alignItems: "center", justifyContent: "center", color: avatarColor(p.id), fontWeight: 800, fontSize: "0.72rem", fontFamily: F.title, flexShrink: 0 }}>
                                {initiales(p)}
                              </div>
                              <div>
                                <div style={{ fontSize: "0.83rem", fontWeight: 600, color: C.text }}>{p.prenom} {p.nom}</div>
                                {p.sexe && <div style={{ fontSize: "0.68rem", color: C.textLight }}>{p.sexe === "MASCULIN" ? "Homme" : "Femme"}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            {p.numPatient ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.83rem", color: C.text }}>{p.numPatient}</span>
                                <button onClick={() => copyField(p.numPatient, `num-${p.id}`)} title="Copier" style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.border}`, background: copied === `num-${p.id}` ? "#e5f7ef" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                                  <Icon d={copied === `num-${p.id}` ? I.check : I.clipboard} size={12} stroke={copied === `num-${p.id}` ? "#17935a" : C.textMid} sw={2} />
                                </button>
                              </div>
                            ) : <span style={{ color: C.textLight, fontSize: "0.78rem" }}>—</span>}
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem" }}>
                            {p.email ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                {p.email}
                                <button onClick={() => copyField(p.email, `mail-${p.id}`)} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.border}`, background: copied === `mail-${p.id}` ? "#e5f7ef" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Icon d={copied === `mail-${p.id}` ? I.check : I.clipboard} size={11} stroke={copied === `mail-${p.id}` ? "#17935a" : C.textMid} sw={2} />
                                </button>
                              </div>
                            ) : <span style={{ color: C.textLight }}>—</span>}
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem", color: p.telephone ? C.text : C.textLight }}>{p.telephone || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem", color: C.textMid, fontFamily: "monospace" }}>{fmtDate(p.dateNaissance)}</td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <Badge variant={p.actif ? "green" : "gray"}>{p.actif ? "Actif" : "Inactif"}</Badge>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <button onClick={() => p.actif ? handleDesactiverPatient(p.id) : handleActiverPatient(p.id)}
                              title={p.actif ? "Désactiver" : "Activer"}
                              style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${p.actif ? C.danger + "50" : "#17935a50"}`, background: p.actif ? `${C.danger}08` : "#e5f7ef", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon d={p.actif ? I.x : I.check} size={13} stroke={p.actif ? C.danger : "#17935a"} sw={2} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ══ MÉDECINS ══ */}
        {active === "medecins" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Médecins</h1>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Btn variant="outline" icon={I.download}
                  onClick={() => downloadCSV(medecins, [
                    { label: "Prénom",        get: m => m.prenom },
                    { label: "Nom",           get: m => m.nom },
                    { label: "Email",         get: m => m.email },
                    { label: "Téléphone",     get: m => m.telephone },
                    { label: "N° Ordre",      get: m => m.numOrdre },
                    { label: "Spécialité",    get: m => m.specialite },
                    { label: "Établissement", get: m => m.etablissement },
                    { label: "Validé",        get: m => m.verified ? "Oui" : "Non" },
                    { label: "Statut",        get: m => m.actif ? "Actif" : "Inactif" },
                  ], `medecins-${new Date().toISOString().split("T")[0]}.csv`)}>
                  Exporter CSV
                </Btn>
                <Btn variant="outline" icon={I.refresh} onClick={chargerMedecins}>Actualiser</Btn>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
              <StatCard label="Total médecins"  value={medecins.length}  sub="Inscrits"             color={C.primary} icon={I.user} />
              <StatCard label="Actifs"          value={medecinsActifs}   sub="Peuvent se connecter" color="#17935a"   icon={I.check} delta={{ up: true }} />
              <StatCard label="Validés"         value={medecinsValides}  sub="Profil vérifié"       color="#1660a8"   icon={I.shield} delta={{ up: true }} />
              <StatCard label="En attente"      value={pendingCount}     sub="Non encore validés"   color={pendingCount > 0 ? C.danger : "#17935a"} icon={I.shield} />
            </div>

            <Card>
              <CardHead title="Liste des médecins" sub={loadingMedecins ? "Chargement…" : `${medecins.length} médecin(s)`} />
              {loadingMedecins ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.textLight }}>Chargement…</div>
              ) : medecins.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.textLight }}>Aucun médecin enregistré.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {["Médecin", "N° Ordre", "Spécialité", "Établissement", "Validation", "Statut", "Actions"].map(h => (
                          <th key={h} style={{ padding: "0.7rem 1.1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.borderLight}`, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {medecins.map(m => (
                        <tr key={m.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.bg}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${avatarColor(m.id)}22`, display: "flex", alignItems: "center", justifyContent: "center", color: avatarColor(m.id), fontWeight: 800, fontSize: "0.72rem", fontFamily: F.title, flexShrink: 0 }}>
                                {`${m.prenom?.[0] ?? ""}${m.nom?.[0] ?? ""}`.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: "0.83rem", fontWeight: 600, color: C.text }}>Dr. {m.prenom} {m.nom}</div>
                                <div style={{ fontSize: "0.7rem", color: C.textLight }}>{m.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem", fontFamily: "monospace", fontSize: "0.78rem", color: C.textMid }}>{m.numOrdre || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem", color: C.textMid }}>{m.specialite || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem" }}>{m.etablissement || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <Badge variant={m.verified ? "green" : "red"}>{m.verified ? "Validé" : "En attente"}</Badge>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <Badge variant={m.actif ? "green" : "gray"}>{m.actif ? "Actif" : "Inactif"}</Badge>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                              {!m.verified && (
                                <button onClick={() => handleValider(m.id)} title="Valider le profil"
                                  style={{ padding: "0.25rem 0.6rem", borderRadius: 7, border: `1px solid #17935a50`, background: "#e5f7ef", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, color: "#17935a", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  <Icon d={I.check} size={11} stroke="#17935a" sw={2.5} /> Valider
                                </button>
                              )}
                              <button onClick={() => m.actif ? handleDesactiverMedecin(m.id) : handleActiverMedecin(m.id)}
                                title={m.actif ? "Désactiver" : "Activer"}
                                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${m.actif ? C.danger + "50" : "#17935a50"}`, background: m.actif ? `${C.danger}08` : "#e5f7ef", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon d={m.actif ? I.x : I.check} size={13} stroke={m.actif ? C.danger : "#17935a"} sw={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ══ INFIRMIERS ══ */}
        {active === "infirmiers" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Infirmiers</h1>
                <p style={{ color: C.textLight, fontSize: "0.82rem", marginTop: "0.2rem" }}>Gestion des comptes infirmiers</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Btn variant="outline" icon={I.download}
                  onClick={() => downloadCSV(infirmiers, [
                    { label: "Prénom",          get: i => i.prenom },
                    { label: "Nom",             get: i => i.nom },
                    { label: "Email",           get: i => i.email },
                    { label: "Téléphone",       get: i => i.telephone },
                    { label: "Service",         get: i => i.serviceAffecte },
                    { label: "Hôpital",         get: i => i.hopital },
                    { label: "Statut",          get: i => i.actif ? "Actif" : "Inactif" },
                    { label: "Inscrit le",      get: i => fmtDate(i.createdAt) },
                  ], `infirmiers-${new Date().toISOString().split("T")[0]}.csv`)}>
                  Exporter CSV
                </Btn>
                <Btn variant="outline" icon={I.refresh} onClick={async () => {
                  setLoadingInfirmiers(true);
                  try { const r = await getInfirmiers(); setInfirmiers(Array.isArray(r) ? r : []); } catch {}
                  finally { setLoadingInfirmiers(false); }
                }}>Actualiser</Btn>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
              <StatCard label="Total infirmiers" value={infirmiers.length}                   sub="Inscrits"          color="#7050bc"  icon={I.activity} />
              <StatCard label="Actifs"           value={infirmiersActifs}                    sub="Peuvent se connecter" color="#17935a" icon={I.check} delta={{ up: true }} />
              <StatCard label="Inactifs"         value={infirmiers.length - infirmiersActifs} sub="Comptes suspendus" color={C.warning} icon={I.x} />
            </div>

            <Card>
              <CardHead title="Liste des infirmiers" sub={loadingInfirmiers ? "Chargement…" : `${infirmiers.length} infirmier(s)`} />
              {loadingInfirmiers ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.textLight }}>Chargement…</div>
              ) : infirmiers.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.textLight }}>Aucun infirmier enregistré.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {["Infirmier", "Email", "Téléphone", "Service", "Hôpital", "Inscrit le", "Statut", "Actions"].map(h => (
                          <th key={h} style={{ padding: "0.7rem 1.1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.borderLight}`, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {infirmiers.map(i => (
                        <tr key={i.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.bg}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#7050bc22", display: "flex", alignItems: "center", justifyContent: "center", color: "#7050bc", fontWeight: 800, fontSize: "0.72rem", fontFamily: F.title, flexShrink: 0 }}>
                                {`${i.prenom?.[0] ?? ""}${i.nom?.[0] ?? ""}`.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: "0.83rem", fontWeight: 600, color: C.text }}>{i.prenom} {i.nom}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem", color: C.textMid }}>{i.email || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem", color: C.textMid }}>{i.telephone || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem" }}>{i.serviceAffecte || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem" }}>{i.hopital || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.75rem", color: C.textLight, fontFamily: "monospace" }}>{fmtDate(i.createdAt)}</td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <Badge variant={i.actif ? "green" : "gray"}>{i.actif ? "Actif" : "Inactif"}</Badge>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <button onClick={() => i.actif ? handleDesactiverInfirmier(i.id) : handleActiverInfirmier(i.id)}
                              title={i.actif ? "Désactiver" : "Activer"}
                              style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${i.actif ? C.danger + "50" : "#17935a50"}`, background: i.actif ? `${C.danger}08` : "#e5f7ef", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon d={i.actif ? I.x : I.check} size={13} stroke={i.actif ? C.danger : "#17935a"} sw={2} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ══ ASSISTANTS ══ */}
        {active === "assistants" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Assistants médicaux</h1>
                <p style={{ color: C.textLight, fontSize: "0.82rem", marginTop: "0.2rem" }}>Gestion des comptes assistants</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Btn variant="outline" icon={I.download}
                  onClick={() => downloadCSV(assistants, [
                    { label: "Prénom",      get: a => a.prenom },
                    { label: "Nom",         get: a => a.nom },
                    { label: "Email",       get: a => a.email },
                    { label: "Téléphone",   get: a => a.telephone },
                    { label: "Service",     get: a => a.serviceAffecte },
                    { label: "Hôpital",     get: a => a.hopital },
                    { label: "Statut",      get: a => a.actif ? "Actif" : "Inactif" },
                    { label: "Inscrit le",  get: a => fmtDate(a.createdAt) },
                  ], `assistants-${new Date().toISOString().split("T")[0]}.csv`)}>
                  Exporter CSV
                </Btn>
                <Btn variant="outline" icon={I.refresh} onClick={async () => {
                  setLoadingAssistants(true);
                  try { const r = await getAssistants(); const list = r?.data ?? r; setAssistants(Array.isArray(list) ? list : []); } catch {}
                  finally { setLoadingAssistants(false); }
                }}>Actualiser</Btn>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
              <StatCard label="Total assistants" value={assistants.length}                    sub="Inscrits"             color="#0a7c6e"  icon={I.user} />
              <StatCard label="Actifs"           value={assistantsActifs}                     sub="Peuvent se connecter" color="#17935a"  icon={I.check} delta={{ up: true }} />
              <StatCard label="Inactifs"         value={assistants.length - assistantsActifs} sub="Comptes suspendus"    color={C.warning} icon={I.x} />
            </div>

            <Card>
              <CardHead title="Liste des assistants médicaux" sub={loadingAssistants ? "Chargement…" : `${assistants.length} assistant(s)`} />
              {loadingAssistants ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.textLight }}>Chargement…</div>
              ) : assistants.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.textLight }}>Aucun assistant enregistré.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {["Assistant", "Email", "Téléphone", "Service", "Hôpital", "Inscrit le", "Statut", "Actions"].map(h => (
                          <th key={h} style={{ padding: "0.7rem 1.1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.borderLight}`, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {assistants.map(a => (
                        <tr key={a.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.bg}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#0a7c6e22", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a7c6e", fontWeight: 800, fontSize: "0.72rem", fontFamily: F.title, flexShrink: 0 }}>
                                {`${a.prenom?.[0] ?? ""}${a.nom?.[0] ?? ""}`.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: "0.83rem", fontWeight: 600, color: C.text }}>{a.prenom} {a.nom}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem", color: C.textMid }}>{a.email || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem", color: C.textMid }}>{a.telephone || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem" }}>{a.serviceAffecte || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem" }}>{a.hopital || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.75rem", color: C.textLight, fontFamily: "monospace" }}>{fmtDate(a.createdAt)}</td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <Badge variant={a.actif ? "green" : "gray"}>{a.actif ? "Actif" : "Inactif"}</Badge>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <button onClick={() => a.actif ? handleDesactiverAssistant(a.id) : handleActiverAssistant(a.id)}
                              title={a.actif ? "Désactiver" : "Activer"}
                              style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${a.actif ? C.danger + "50" : "#17935a50"}`, background: a.actif ? `${C.danger}08` : "#e5f7ef", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon d={a.actif ? I.x : I.check} size={13} stroke={a.actif ? C.danger : "#17935a"} sw={2} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ══ VALIDATIONS ══ */}
        {active === "validations" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Validations médecins</h1>
                <p style={{ color: C.textLight, fontSize: "0.82rem", marginTop: "0.2rem" }}>
                  Ces médecins ont complété leur inscription mais ne peuvent pas se connecter avant validation
                </p>
              </div>
              <Btn variant="outline" icon={I.refresh} onClick={chargerMedecins}>Actualiser</Btn>
            </div>

            {loadingMedecins ? (
              <div style={{ padding: "3rem", textAlign: "center", color: C.textLight }}>Chargement…</div>
            ) : medecinsEnAttente.length === 0 ? (
              <Card>
                <div style={{ padding: "3rem", textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e5f7ef", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                    <Icon d={I.check} size={26} stroke="#17935a" sw={2.5} />
                  </div>
                  <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1rem", color: C.text, marginBottom: "0.3rem" }}>Aucun médecin en attente</div>
                  <div style={{ fontSize: "0.8rem", color: C.textLight }}>Tous les médecins inscrits ont été validés.</div>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHead title={`${pendingCount} profil(s) en attente`} sub="Vérifiez le numéro d'ordre auprès du Conseil de l'Ordre avant de valider" />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {["Médecin", "Email", "N° Ordre", "Spécialité", "Établissement", "Inscrit le", "Action"].map(h => (
                          <th key={h} style={{ padding: "0.7rem 1.1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.borderLight}`, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {medecinsEnAttente.map((m, i) => (
                        <tr key={m.id} style={{ borderBottom: i < medecinsEnAttente.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
                          onMouseEnter={e => e.currentTarget.style.background = `${C.danger}04`}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}>
                          <td style={{ padding: "0.85rem 1.1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.danger}15`, display: "flex", alignItems: "center", justifyContent: "center", color: C.danger, fontWeight: 800, fontSize: "0.75rem", fontFamily: F.title, flexShrink: 0 }}>
                                {`${m.prenom?.[0] ?? ""}${m.nom?.[0] ?? ""}`.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: "0.83rem", fontWeight: 600, color: C.text }}>Dr. {m.prenom} {m.nom}</div>
                                <div style={{ fontSize: "0.68rem", color: C.textLight }}>{m.telephone || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.85rem 1.1rem", fontSize: "0.78rem", color: C.textMid }}>{m.email || "—"}</td>
                          <td style={{ padding: "0.85rem 1.1rem", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700, color: C.text }}>{m.numOrdre || "—"}</td>
                          <td style={{ padding: "0.85rem 1.1rem", fontSize: "0.78rem" }}>{m.specialite || "—"}</td>
                          <td style={{ padding: "0.85rem 1.1rem", fontSize: "0.78rem" }}>{m.etablissement || "—"}</td>
                          <td style={{ padding: "0.85rem 1.1rem", fontSize: "0.75rem", color: C.textLight, fontFamily: "monospace" }}>{fmtDate(m.createdAt)}</td>
                          <td style={{ padding: "0.85rem 1.1rem" }}>
                            <button onClick={() => handleValider(m.id)}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#17935a,#0e6040)", color: "white", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
                              onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                              <Icon d={I.check} size={13} stroke="white" sw={2.5} /> Valider le profil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ══ ÉTABLISSEMENTS ══ */}
        {active === "etablissements" && (
          <>
            {showAddEtab && (
              <ModalAddEtab
                onClose={() => setShowAddEtab(false)}
                onSaved={(newHop) => setHopitaux(prev => [...prev, newHop].sort((a,b) => a.nom.localeCompare(b.nom)))}
              />
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Établissements partenaires</h1>
                <p style={{ color: C.textLight, fontSize: "0.82rem", marginTop: "0.2rem" }}>Réseau hospitalier MediConnect</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Btn variant="outline" icon={I.download}
                  onClick={() => downloadCSV(hopitaux, [
                    { label: "Nom",       get: h => h.nom },
                    { label: "Type",      get: h => h.typeEtablissement },
                    { label: "Téléphone", get: h => h.telephone },
                    { label: "Latitude",  get: h => h.latitude },
                    { label: "Longitude", get: h => h.longitude },
                  ], `etablissements-${new Date().toISOString().split("T")[0]}.csv`)}>
                  Exporter CSV
                </Btn>
                <Btn icon={I.plus} onClick={() => setShowAddEtab(true)}>Ajouter</Btn>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
              <StatCard label="Établissements" value={loadingHopitaux ? "…" : hopitaux.length}               sub="Dans le réseau"  color={C.primary} icon={I.layers} />
              <StatCard label="Publics"        value={hopitaux.filter(h => h.typeEtablissement === "PUBLIC").length}  sub="Établissements publics" color="#1660a8" icon={I.shield} />
              <StatCard label="Privés"         value={hopitaux.filter(h => h.typeEtablissement === "PRIVEE").length}  sub="Établissements privés"  color="#7050bc" icon={I.layers} />
            </div>

            <Card>
              <CardHead title="Réseau hospitalier" sub={loadingHopitaux ? "Chargement…" : `${hopitaux.length} établissement(s) enregistré(s)`} />
              {loadingHopitaux ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.textLight }}>Chargement…</div>
              ) : hopitaux.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.85rem", color: C.textLight, marginBottom: "0.8rem" }}>Aucun établissement enregistré.</div>
                  <Btn icon={I.plus} onClick={() => setShowAddEtab(true)}>Ajouter le premier établissement</Btn>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {["Établissement", "Type", "Téléphone", "Coordonnées GPS", "Actions"].map(h => (
                          <th key={h} style={{ padding: "0.7rem 1.1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.borderLight}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hopitaux.map((h, i) => (
                        <tr key={h.id ?? i} style={{ borderBottom: `1px solid ${C.borderLight}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.bg}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}>
                          <td style={{ padding: "0.75rem 1.1rem", fontWeight: 500, fontSize: "0.83rem", color: C.text }}>{h.nom}</td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            {h.typeEtablissement
                              ? <Badge variant={h.typeEtablissement === "PUBLIC" ? "blue" : "gray"}>{h.typeEtablissement === "PUBLIC" ? "Public" : "Privé"}</Badge>
                              : <span style={{ color: C.textLight, fontSize: "0.78rem" }}>—</span>
                            }
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem", color: C.textMid }}>{h.telephone || "—"}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.73rem", color: C.textLight, fontFamily: "monospace" }}>
                            {h.latitude && h.longitude ? `${h.latitude}, ${h.longitude}` : "—"}
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <Badge variant="green">Actif</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ══ CARTOGRAPHIE ══ */}
        {active === "cartographie" && <PageCarto toast={toast} />}

        {/* ══ STATISTIQUES ══ */}
        {active === "statistiques" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Statistiques de la plateforme</h1>
              {loadingStats && <span style={{ fontSize: "0.78rem", color: C.textLight }}>Chargement des données…</span>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
              <StatCard label="Consultations"  value={loadingStats ? "…" : (stats?.medical?.consultations ?? 0)} sub="Total enregistrées"  color={C.primary}  icon={I.activity}  delta={{ up: true }} />
              <StatCard label="Ordonnances"    value={loadingStats ? "…" : (stats?.medical?.ordonnances ?? 0)}   sub="Total émises"        color="#17935a"    icon={I.clipboard} delta={{ up: true }} />
              <StatCard label="Rendez-vous"    value={loadingStats ? "…" : (stats?.medical?.rendezVous ?? 0)}    sub="Total planifiés"     color="#1660a8"    icon={I.zap}       delta={{ up: true }} />
              <StatCard label="Transferts"     value={loadingStats ? "…" : (stats?.medical?.transferts ?? 0)}    sub="Total initiés"       color="#7050bc"    icon={I.arrowR}    delta={{ up: true }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
              <Card>
                <CardHead title="Répartition utilisateurs" sub="Données en temps réel" />
                <div style={{ padding: "1rem 1.2rem" }}>
                  {[
                    ["Patients actifs",    stats?.patients?.actifs ?? patientsActifs,    C.primary,  (stats?.patients?.total ?? patients.length) || 1],
                    ["Patients inactifs",  stats?.patients?.inactifs ?? (patients.length - patientsActifs), C.warning, (stats?.patients?.total ?? patients.length) || 1],
                    ["Médecins validés",   stats?.medecins?.valides ?? medecinsValides,  "#17935a",  (stats?.medecins?.total ?? medecins.length) || 1],
                    ["Médecins en attente",stats?.medecins?.enAttente ?? pendingCount,   C.danger,   (stats?.medecins?.total ?? medecins.length) || 1],
                    ["Infirmiers actifs",  stats?.infirmiers?.actifs ?? infirmiersActifs, "#7050bc",  (stats?.infirmiers?.total ?? infirmiers.length) || 1],
                    ["Assistants actifs",  stats?.assistants?.actifs ?? assistantsActifs, "#0a7c6e",  (stats?.assistants?.total ?? assistants.length) || 1],
                  ].map(([lbl, n, col, total]) => (
                    <div key={lbl} style={{ marginBottom: "0.85rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
                        <span style={{ color: C.textMid }}>{lbl}</span>
                        <span style={{ fontWeight: 600, color: C.text }}>{n ?? 0}</span>
                      </div>
                      <div style={{ height: 6, background: C.bg, borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${Math.min(100, Math.round(((n ?? 0) / total) * 100))}%`, background: col, borderRadius: 3, transition: "width 1s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHead title="Activité médicale" sub="Données en temps réel" />
                <div style={{ padding: "1rem 1.2rem" }}>
                  {[
                    ["Consultations",  stats?.medical?.consultations ?? 0,  C.primary],
                    ["Ordonnances",    stats?.medical?.ordonnances ?? 0,    "#17935a"],
                    ["Rendez-vous",    stats?.medical?.rendezVous ?? 0,     "#1660a8"],
                    ["Transferts",     stats?.medical?.transferts ?? 0,     "#7050bc"],
                    ["Examens",        stats?.medical?.examens ?? 0,        C.warning],
                    ["Alertes",        stats?.medical?.alertes ?? 0,        C.danger],
                  ].map(([lbl, val, col]) => {
                    const maxVal = Math.max(
                      stats?.medical?.consultations ?? 1,
                      stats?.medical?.ordonnances ?? 1,
                      stats?.medical?.rendezVous ?? 1,
                      stats?.medical?.transferts ?? 1,
                      1
                    );
                    return (
                      <div key={lbl} style={{ marginBottom: "0.8rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.28rem" }}>
                          <span style={{ color: C.textMid }}>{lbl}</span>
                          <span style={{ fontWeight: 600, fontFamily: "monospace", color: C.text }}>{val}</span>
                        </div>
                        <div style={{ height: 5, background: C.bg, borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${Math.min(100, Math.round((val / maxVal) * 100))}%`, background: col, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* ══ SÉCURITÉ & AUDIT ══ */}
        {active === "securite" && (
          <>
            <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text, marginBottom: "1.5rem" }}>Sécurité & Journal d'activité</h1>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
              <StatCard label="Utilisateurs total"     value={loadingStats ? "…" : ((stats?.patients?.total ?? 0) + (stats?.medecins?.total ?? 0) + (stats?.infirmiers?.total ?? 0) + (stats?.assistants?.total ?? 0))} sub="Tous rôles confondus" color={C.primary}  icon={I.users}   delta={{ up: true }} />
              <StatCard label="Comptes actifs"         value={loadingStats ? "…" : ((stats?.patients?.actifs ?? 0) + (stats?.medecins?.actifs ?? 0) + (stats?.infirmiers?.actifs ?? 0) + (stats?.assistants?.actifs ?? 0))} sub="Connectés au système" color="#17935a"   icon={I.check}   delta={{ up: true }} />
              <StatCard label="En attente validation"  value={loadingStats ? "…" : (stats?.medecins?.enAttente ?? pendingCount)} sub="Médecins à valider"   color={pendingCount > 0 ? C.warning : "#17935a"} icon={I.shield} />
              <StatCard label="Alertes non acquittées" value={loadingStats ? "…" : (stats?.medical?.alertesNonAcquittees ?? 0)} sub="Requièrent attention"  color={C.danger}    icon={I.zap} />
            </div>

            <Card>
              <CardHead
                title="Journal d'activité"
                sub={loadingActivity ? "Chargement…" : `${activity.length} événement(s) enregistré(s)`}
                action={
                  <Btn size="sm" variant="outline" icon={I.download}
                    onClick={() => downloadCSV(activity, [
                      { label: "Action",    get: l => l.action },
                      { label: "Utilisateur", get: l => l.userName },
                      { label: "Rôle",      get: l => l.userRole },
                      { label: "Type",      get: l => l.type },
                      { label: "Date",      get: l => fmtDateTime(l.timestamp) },
                    ], `journal-activite-${new Date().toISOString().split("T")[0]}.csv`)}>
                    Exporter CSV
                  </Btn>
                }
              />
              {loadingActivity ? (
                <div style={{ padding: "2rem", textAlign: "center", color: C.textLight }}>Chargement du journal…</div>
              ) : activity.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: C.textLight }}>Aucun événement enregistré.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {["Action", "Utilisateur", "Rôle", "Type", "Date & Heure"].map(h => (
                          <th key={h} style={{ padding: "0.7rem 1.1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.borderLight}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((log, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.bg}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.8rem", fontWeight: 500, color: C.text }}>{log.action}</td>
                          <td style={{ padding: "0.75rem 1.1rem", fontSize: "0.78rem", color: C.textMid }}>{log.userName}</td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <Badge variant={log.userRole === "MEDECIN" ? "blue" : (log.userRole === "INFIRMIER" || log.userRole === "ASSISTANT") ? "gray" : "green"}>
                              {log.userRole}
                            </Badge>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem" }}>
                            <Badge variant={log.type === "success" ? "green" : log.type === "warning" ? "red" : "gray"}>
                              {log.type === "success" ? "Succès" : log.type === "warning" ? "Alerte" : "Info"}
                            </Badge>
                          </td>
                          <td style={{ padding: "0.75rem 1.1rem", fontFamily: "monospace", fontSize: "0.72rem", color: C.textLight }}>
                            {fmtDateTime(log.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ══ PARAMÈTRES ══ */}
        {active === "parametres" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Paramètres système</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.85rem", borderRadius: 8, background: C.primaryPale, border: `1px solid ${C.borderLight}` }}>
                <Icon d={I.settings} size={13} stroke={C.primary} sw={2} />
                <span style={{ fontSize: "0.75rem", color: C.primary, fontWeight: 600 }}>Cliquez sur l'icône pour modifier un champ</span>
              </div>
            </div>

            {[
              { title: "Configuration générale", rows: [
                { label: "Nom de la plateforme", key: "nomPlateforme" },
                { label: "Version",              key: "version" },
                { label: "Environnement",        key: "environnement", options: ["Production", "Staging", "Développement"] },
                { label: "Pays / région",         key: "pays" },
              ]},
              { title: "Sécurité", rows: [
                { label: "Chiffrement TLS",     key: "tlsVersion",   options: ["TLS 1.3 — Actif", "TLS 1.2 — Actif", "Désactivé"] },
                { label: "Chiffrement données",  key: "chiffrement",  options: ["AES-256 — Actif", "AES-128 — Actif", "Désactivé"] },
                { label: "MFA obligatoire",      key: "mfa",          options: ["Oui — Tous profils médicaux", "Oui — Administrateurs uniquement", "Non"] },
                { label: "Durée session",         key: "dureeSession", options: ["4 heures", "8 heures", "12 heures", "24 heures"] },
              ]},
              { title: "Intégrations", rows: [
                { label: "HL7 FHIR",     key: "fhir",  options: ["R4 — Connecté", "R3 — Connecté", "Déconnecté"] },
                { label: "CNAM Sénégal", key: "cnam",  options: ["API v2 — Actif", "API v1 — Actif", "Désactivé"] },
                { label: "IPRES",        key: "ipres", options: ["API v1 — Actif", "Désactivé"] },
                { label: "Système SMS",  key: "sms",   options: ["Orange Sénégal — Actif", "Free Sénégal — Actif", "Expresso — Actif", "Désactivé"] },
              ]},
            ].map(sec => (
              <Card key={sec.title} style={{ marginBottom: "1.2rem" }}>
                <div style={{ padding: "0.85rem 1.2rem", background: C.bg, borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.88rem", color: C.text }}>{sec.title}</span>
                  <span style={{ fontSize: "0.7rem", color: C.textLight }}>{sec.rows.length} paramètre(s)</span>
                </div>
                {sec.rows.map(({ label, key, options: opts }) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1.2rem", borderBottom: `1px solid ${C.borderLight}` }}>
                    <span style={{ fontSize: "0.82rem", color: C.text }}>{label}</span>
                    <EditableField value={params[key]} onSave={updateParam(key)} options={opts} />
                  </div>
                ))}
              </Card>
            ))}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Btn variant="outline" icon={I.download} onClick={() => {
                const blob = new Blob([JSON.stringify(params, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "config-mediconnect.json";
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                toast("Configuration exportée (JSON)", "success");
              }}>Exporter la configuration</Btn>
              <Btn icon={I.refresh} onClick={() => toast("Cache système vidé", "success")}>Vider le cache</Btn>
            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
