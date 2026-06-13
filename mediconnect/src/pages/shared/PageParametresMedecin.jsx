import { useState, useEffect, useCallback } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import { getMonProfilMedecin, updateMedecin }     from "../../api/medecins.api.js";
import { getMonProfilInfirmier, updateInfirmier } from "../../api/infirmiers.api.js";
import { getMonProfilAssistant, updateAssistant } from "../../api/assistants.api.js";
import { changePassword } from "../../api/auth.api.js";
import { useAuth } from "../../api/AuthContext.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/TagBadge.jsx";
import Btn from "../../components/ui/Btn.jsx";
import InputField from "../../components/ui/InputField.jsx";
import Icon from "../../components/ui/Icon.jsx";

// ── Helpers UI ─────────────────────────────────────────────────────────────────
const Toggle = ({ on, onChange, disabled }) => (
  <div
    onClick={disabled ? undefined : onChange}
    style={{
      width: 40, height: 22, borderRadius: 22,
      background: on ? C.primary : C.border,
      position: "relative",
      cursor: disabled ? "default" : "pointer",
      transition: "background .2s", flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <div style={{
      position: "absolute", width: 16, height: 16, borderRadius: "50%",
      background: "white", top: 3, left: on ? 21 : 3,
      transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
    }} />
  </div>
);

const Section = ({ title, children }) => (
  <Card style={{ marginBottom: "1.2rem" }}>
    <div style={{
      padding: "0.9rem 1.2rem", background: C.bg,
      borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <span style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.88rem", color: C.text }}>
        {title}
      </span>
    </div>
    {children}
  </Card>
);

const Row = ({ label, sub, right, last }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.85rem 1.2rem",
    borderBottom: last ? "none" : `1px solid ${C.borderLight}`,
  }}>
    <div>
      <div style={{ fontSize: "0.83rem", fontWeight: 500, color: C.text }}>{label}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: C.textLight, marginTop: "0.1rem" }}>{sub}</div>}
    </div>
    {right}
  </div>
);

const SpinBtn = ({ text }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
    <span style={{
      width: 14, height: 14,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "white", borderRadius: "50%",
      animation: "spin 0.7s linear infinite", display: "inline-block",
    }} />
    {text}
  </span>
);

const initPwdForm = () => ({ oldPassword: "", newPassword: "", confirmPassword: "" });

// ── Page ───────────────────────────────────────────────────────────────────────
const PageParametresMedecin = ({ toast, userRole }) => {
  const { user } = useAuth();
  const roleEffectif = userRole ?? (user?.role?.toLowerCase() ?? "medecin");

  // ── Profil ─────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({
    nom: "", prenom: "", email: "", telephone: "", nomEtablissement: "", disponible: true,
  });
  const [saving, setSaving] = useState(false);
  const [dirty,  setDirty]  = useState(false);

  // ── Mot de passe ────────────────────────────────────────────────────────────
  const [pwdForm,     setPwdForm]     = useState(initPwdForm());
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwd,     setShowPwd]     = useState(false);

  // ── Toggles statiques ───────────────────────────────────────────────────────
  const [settings, setSettings] = useState({
    alertesCrit: true, sms: true, rappels: true, rapports: false,
    sync: true, cache: true, compress: true,
  });
  const toggle = (k) => setSettings((s) => ({ ...s, [k]: !s[k] }));

  // ── Chargement du profil ────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setDirty(false);
    try {
      let data;
      if (roleEffectif === "assistant") {
        data = await getMonProfilAssistant();
      } else if (roleEffectif === "infirmier") {
        data = await getMonProfilInfirmier();
      } else {
        data = await getMonProfilMedecin();
      }
      setProfile(data);
      setForm({
        nom:              data.nom              ?? "",
        prenom:           data.prenom           ?? "",
        email:            data.email            ?? "",
        telephone:        data.telephone        ?? "",
        nomEtablissement: roleEffectif === "medecin"
          ? (data.etablissement ?? "")
          : (data.serviceAffecte ?? data.hopital ?? ""),
        disponible:       data.disponible       ?? true,
      });
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors du chargement du profil", "error");
    } finally {
      setLoading(false);
    }
  }, [toast, roleEffectif]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Helpers form ────────────────────────────────────────────────────────────
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setDirty(true);
  };
  const setPwd = (k) => (e) => setPwdForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Sauvegarder le profil ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      toast("Nom et prénom obligatoires", "warning");
      return;
    }
    if (!form.email.trim()) {
      toast("L'email est obligatoire", "warning");
      return;
    }
    setSaving(true);
    try {
      let res;
      const profileId = profile?.id ?? user?.userId;
      if (roleEffectif === "assistant") {
        const payload = {
          nom:            form.nom.trim(),
          prenom:         form.prenom.trim(),
          email:          form.email.trim(),
          telephone:      form.telephone.trim() || undefined,
          serviceAffecte: form.nomEtablissement.trim() || undefined,
          nomHopital:     profile?.hopital ?? undefined,
          adresse:        profile?.region ? { region: profile.region, departement: profile.departement, commune: profile.commune } : undefined,
        };
        res = await updateAssistant(profileId, payload);
      } else if (roleEffectif === "infirmier") {
        const payload = {
          nom:            form.nom.trim(),
          prenom:         form.prenom.trim(),
          email:          form.email.trim(),
          telephone:      form.telephone.trim() || undefined,
          serviceAffecte: form.nomEtablissement.trim() || undefined,
          nomHopital:     profile?.hopital ?? undefined,
          adresse:        profile?.region ? { region: profile.region, departement: profile.departement, commune: profile.commune } : undefined,
        };
        res = await updateInfirmier(profileId, payload);
      } else {
        const payload = {
          nom:              form.nom.trim(),
          prenom:           form.prenom.trim(),
          email:            form.email.trim(),
          telephone:        form.telephone.trim()        || undefined,
          nomEtablissement: form.nomEtablissement.trim() || undefined,
          disponible:       form.disponible,
        };
        res = await updateMedecin(profileId, payload);
      }
      const updated = res?.data ?? res;
      setProfile((prev) => ({ ...prev, ...updated }));
      setDirty(false);
      toast("Profil mis à jour avec succès", "success");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la mise à jour du profil", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Changer le mot de passe ─────────────────────────────────────────────────
  const handleChangePwd = async () => {
    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      toast("Tous les champs sont obligatoires", "warning");
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast("Les nouveaux mots de passe ne correspondent pas", "warning");
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      toast("Le nouveau mot de passe doit contenir au moins 6 caractères", "warning");
      return;
    }
    setChangingPwd(true);
    try {
      await changePassword({
        oldPassword:     pwdForm.oldPassword,
        newPassword:     pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword,
      });
      setPwdForm(initPwdForm());
      toast("Mot de passe modifié avec succès", "success");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors du changement de mot de passe", "error");
    } finally {
      setChangingPwd(false);
    }
  };

  // ── Skeleton ────────────────────────────────────────────────────────────────
  const ProfileSkeleton = () => (
    <div style={{ padding: "1.2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ height: 54, background: C.bg, borderRadius: 8, animation: "pulse 1.4s ease-in-out infinite" }} />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: 54, background: C.bg, borderRadius: 8, animation: "pulse 1.4s ease-in-out infinite" }} />
      ))}
    </div>
  );

  return (
    <>
      {/* ── Profil utilisateur ──────────────────────────────────────────────── */}
      <Section title="Profil utilisateur">
        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div style={{ padding: "1.2rem" }}>
            {/* Infos read-only (numOrdre, spécialité, section) */}
            {(profile?.specialite || profile?.section || profile?.numOrdre) && (
              <div style={{
                display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center",
                padding: "0.65rem 0.95rem", marginBottom: "1.1rem",
                background: C.primaryPale, border: `1px solid ${C.borderLight}`, borderRadius: 10,
              }}>
                {profile?.specialite && <Badge variant="blue">{profile.specialite}</Badge>}
                {profile?.section    && <Badge variant="gray">{profile.section}</Badge>}
                {profile?.numOrdre   && (
                  <span style={{ fontSize: "0.72rem", color: C.textMid }}>
                    N° Ordre : {profile.numOrdre}
                  </span>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <InputField label="Prénom *" value={form.prenom} onChange={set("prenom")} placeholder="Amadou" required />
              <InputField label="Nom *"    value={form.nom}    onChange={set("nom")}    placeholder="Diallo"  required />
            </div>

            <InputField
              label="Email *" type="email"
              value={form.email} onChange={set("email")}
              placeholder="medecin@hopital.sn" required
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <InputField
                label="Téléphone"
                value={form.telephone} onChange={set("telephone")}
                placeholder="+221 77 000 00 00"
              />
              <InputField
                label={roleEffectif === "medecin" ? "Établissement" : "Service affecté"}
                value={form.nomEtablissement} onChange={set("nomEtablissement")}
                placeholder={roleEffectif === "medecin" ? "Hôpital Principal de Dakar" : "Service des urgences"}
              />
            </div>

            {/* Toggle disponibilité — médecin uniquement */}
            {roleEffectif === "medecin" && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.75rem 0.95rem",
                border: `1px solid ${C.borderLight}`, borderRadius: 10,
                marginBottom: "1.2rem", background: "white",
              }}>
                <div>
                  <div style={{ fontSize: "0.83rem", fontWeight: 500, color: C.text }}>Disponible</div>
                  <div style={{ fontSize: "0.72rem", color: C.textLight, marginTop: "0.1rem" }}>
                    Visible pour la prise de rendez-vous
                  </div>
                </div>
                <Toggle
                  on={form.disponible}
                  onChange={() => { setForm((f) => ({ ...f, disponible: !f.disponible })); setDirty(true); }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              {dirty && (
                <Btn variant="outline" onClick={loadProfile} disabled={saving}>
                  Annuler
                </Btn>
              )}
              <Btn icon={I.check} onClick={handleSave} disabled={saving || !dirty}>
                {saving ? <SpinBtn text="Enregistrement…" /> : "Enregistrer le profil"}
              </Btn>
            </div>
          </div>
        )}
      </Section>

      {/* ── Changement de mot de passe ───────────────────────────────────────── */}
      <Section title="Sécurité — Mot de passe">
        <div style={{ padding: "1.2rem" }}>
          <InputField
            label="Mot de passe actuel *"
            type={showPwd ? "text" : "password"}
            value={pwdForm.oldPassword}
            onChange={setPwd("oldPassword")}
            placeholder="••••••••"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <InputField
              label="Nouveau mot de passe *"
              type={showPwd ? "text" : "password"}
              value={pwdForm.newPassword}
              onChange={setPwd("newPassword")}
              placeholder="••••••••"
            />
            <InputField
              label="Confirmer le nouveau *"
              type={showPwd ? "text" : "password"}
              value={pwdForm.confirmPassword}
              onChange={setPwd("confirmPassword")}
              placeholder="••••••••"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.2rem" }}>
            <button
              onClick={() => setShowPwd((v) => !v)}
              style={{
                fontSize: "0.72rem", color: C.textMid, background: "none",
                border: "none", cursor: "pointer", padding: 0, fontFamily: F.body,
                display: "flex", alignItems: "center", gap: "0.3rem",
              }}
            >
              <Icon d={showPwd ? I.eyeOff : I.eye} size={13} stroke={C.textMid} sw={1.8} />
              {showPwd ? "Masquer" : "Afficher"} les mots de passe
            </button>
            <Btn icon={I.lock} onClick={handleChangePwd} disabled={changingPwd}>
              {changingPwd ? <SpinBtn text="Modification…" /> : "Modifier le mot de passe"}
            </Btn>
          </div>
        </div>
      </Section>

      {/* ── Notifications ────────────────────────────────────────────────────── */}
      <Section title="Notifications & Alertes">
        <Row label="Alertes critiques (temps réel)" sub="Push notifications pour tensions > 160 mmHg" right={<Toggle on={settings.alertesCrit} onChange={() => toggle("alertesCrit")} />} />
        <Row label="Alertes SMS de secours" sub="En cas d'absence de connexion internet" right={<Toggle on={settings.sms} onChange={() => toggle("sms")} />} />
        <Row label="Rappels rendez-vous" sub="24h et 1h avant chaque RDV" right={<Toggle on={settings.rappels} onChange={() => toggle("rappels")} />} />
        <Row label="Rapports hebdomadaires" sub="Résumé automatique envoyé chaque lundi" right={<Toggle on={settings.rapports} onChange={() => toggle("rapports")} />} last />
      </Section>

      {/* ── Mode hors-ligne ───────────────────────────────────────────────────── */}
      <Section title="Mode hors-ligne (Offline-First)">
        <Row label="Synchronisation automatique" sub="Sync au retour de connexion" right={<Toggle on={settings.sync} onChange={() => toggle("sync")} />} />
        <Row label="Cache local des dossiers" sub="Stockage IndexedDB · 47 MB utilisés" right={<Toggle on={settings.cache} onChange={() => toggle("cache")} />} />
        <Row label="Compression données ECG" sub="Réduction bande passante pour réseaux 2G/3G" right={<Toggle on={settings.compress} onChange={() => toggle("compress")} />} last />
      </Section>

      {/* ── Conformité & Sécurité ─────────────────────────────────────────────── */}
      <Section title="Conformité & Sécurité">
        <Row label="Journal d'audit" sub="Toutes les actions enregistrées (Loi n°2008-12)" right={<Badge variant="green">Actif</Badge>} />
        <Row label="Chiffrement TLS 1.3" sub="Données en transit" right={<Badge variant="green">Actif</Badge>} />
        <Row label="Chiffrement AES-256" sub="Données au repos" right={<Badge variant="green">Actif</Badge>} />
        <Row label="Version plateforme" sub="MediConnect Sénégal v2.0 — SIPREC-SEN" right={<Btn size="sm" variant="outline" onClick={() => toast("À jour — v2.0.1", "success")}>Vérifier MAJ</Btn>} last />
      </Section>
    </>
  );
};

export default PageParametresMedecin;
