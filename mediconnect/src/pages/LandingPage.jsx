import { useState, useEffect } from "react";
import { C, F } from "../constants/theme.js";
import { I } from "../constants/icons.js";
import Icon from "../components/ui/Icon.jsx";
import Btn from "../components/ui/Btn.jsx";
import ECGLine from "../components/ui/ECGLine.jsx";
import ModalNouveauPatient from "../components/modals/ModalNouveauPatient.jsx";
import { useAuth } from "../api/AuthContext.jsx";

const IMG = {
  infirmiere:    "/images/im3.webp",
  medecinEnfant: "/images/im4.webp",
  medecinF:      "/images/med1.webp",
  medecinH:      "/images/med2.webp",
};

const useSimpleToast = () => {
  const [msg, setMsg] = useState(null);
  const toast = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };
  return { toast, msg };
};

/* ═══════════════════════════════════════
   NAVBAR
═══════════════════════════════════════ */
const Navbar = ({ setPage }) => {
  const [scrolled,     setScrolled]    = useState(false);
  const [modalPatient, setModalPatient] = useState(false);
  const { toast, msg }                 = useSimpleToast();
  const { isAuthenticated, user, logout, getDashboardPage } = useAuth();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      {msg && (
        <div style={{
          position: "fixed", top: 76, right: "1.5rem", zIndex: 9999,
          background: msg.type === "success" ? "#e5f7ef" : "#fef2f2",
          border: `1px solid ${msg.type === "success" ? "#17935a" : C.danger}40`,
          borderRadius: 10, padding: "0.65rem 1rem",
          fontSize: "0.82rem", fontWeight: 600,
          color: msg.type === "success" ? "#17935a" : C.danger,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}>
          {msg.text}
        </div>
      )}

      <ModalNouveauPatient open={modalPatient} onClose={() => setModalPatient(false)} toast={toast} />

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? C.borderLight : "transparent"}`,
        boxShadow: scrolled ? "0 1px 24px rgba(0,0,0,0.06)" : "none",
        transition: "all 0.22s",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem", display: "flex", alignItems: "center", height: 68 }}>

          {/* Logo */}
          <div onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer", flex: 1 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${C.primary}40` }}>
              <Icon d={I.heart} size={18} stroke="white" sw={2.2} />
            </div>
            <div>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.02rem", color: C.primaryDark, lineHeight: 1 }}>MediConnect</div>
              <div style={{ fontSize: "0.58rem", color: C.textLight, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sénégal</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", alignItems: "center" }}>
            {isAuthenticated ? (
              <>
                <span style={{ fontSize: "0.78rem", color: C.textMid, fontFamily: F.title }}>
                  {user?.prenom} {user?.nom}
                </span>
                <Btn size="sm" onClick={() => setPage(getDashboardPage(user?.role))}>Mon tableau de bord</Btn>
                <Btn variant="ghost" size="sm" onClick={async () => { await logout(); }}>Se déconnecter</Btn>
              </>
            ) : (
              <>
                <Btn variant="ghost" size="sm" onClick={() => setPage("login")}>Connexion</Btn>
                <Btn size="sm" onClick={() => setPage("register")} style={{ background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`, boxShadow: `0 4px 14px ${C.primary}38` }}>
                  Créer un compte
                </Btn>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

/* ═══════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════ */
const LandingPage = ({ setPage }) => {
  const features = [
    { icon: I.video,     title: "Téléconsultation",      desc: "Consultations vidéo HD avec adaptation automatique à la bande passante.", color: "#0d7a6e" },
    { icon: I.activity,  title: "IA Cardiologique",      desc: "Analyse automatique d'ECG par intelligence artificielle embarquée.",      color: "#e07228" },
    { icon: I.file,      title: "Dossier Médical",       desc: "DME conforme HL7 FHIR. Historique complet et ordonnances électroniques.", color: "#1660a8" },
    { icon: I.wifi,      title: "Mode Hors-ligne",       desc: "Architecture PWA offline-first. Fonctionne parfaitement sur 2G/3G.",     color: "#7050bc" },
    { icon: I.bell,      title: "Alertes Intelligentes", desc: "Alertes cliniques graduées avec routage vers le médecin disponible.",     color: "#c93535" },
    { icon: I.map,       title: "Cartographie",          desc: "Carte épidémiologique des pathologies par zone géographique.",           color: "#0a9182" },
    { icon: I.clipboard, title: "Ordonnances",           desc: "Génération, signature numérique et QR code de vérification.",            color: "#17935a" },
    { icon: I.shield,    title: "Sécurité & Conformité", desc: "Conforme loi n°2008-12. TLS 1.3, AES-256, MFA obligatoire.",            color: "#065f52" },
  ];

  const temoignages = [
    { photo: IMG.medecinH, nom: "Dr. Aminata Sow",   role: "Cardiologue · HGGY Dakar",           texte: "MediConnect a transformé ma pratique. Les ECG sont analysés en temps réel et la gestion des consultations à distance est parfaite." },
    { photo: IMG.medecinF, nom: "Dr. Moussa Diallo", role: "Médecin généraliste · Thiès",         texte: "Grâce aux alertes intelligentes, j'ai pu intervenir rapidement sur plusieurs cas critiques. Simple et très réactif." },
    { photo: IMG.infirmiere, nom: "Rokhaya Badji",   role: "Infirmière · Centre de Santé Pikine", texte: "La saisie des constantes est rapide, les transferts de patients se font en quelques clics. Je gagne un temps précieux." },
  ];

  const [hovCard, setHovCard] = useState(null);

  return (
    <div style={{ paddingTop: 68, fontFamily: F.body }}>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section style={{ minHeight: "calc(100vh - 68px)", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", background: "linear-gradient(145deg, #f0fcfa 0%, #e6f7f4 50%, #f5fbf9 100%)" }}>

        {/* Background dot pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #b2dbd5 1px, transparent 1px)", backgroundSize: "32px 32px", opacity: 0.35, pointerEvents: "none" }} />

        {/* Glow orb top-right */}
        <div style={{ position: "absolute", top: -150, right: -150, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.primaryPale} 0%, transparent 65%)`, pointerEvents: "none" }} />

        {/* ECG décoratif */}
        <div style={{ position: "absolute", bottom: 48, left: 0, right: 0, opacity: 0.1, pointerEvents: "none" }}>
          <ECGLine width={1400} color={C.primary} opacity={1} />
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3.5rem", alignItems: "center", width: "100%", position: "relative", zIndex: 1 }}>

          {/* Gauche */}
          <div className="fade-up-1">
            {/* Pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "white", border: `1.5px solid ${C.border}`, borderRadius: 100, padding: "0.3rem 0.9rem", marginBottom: "1.4rem", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent }} />
              <span style={{ fontSize: "0.71rem", fontWeight: 700, color: C.primaryDark, letterSpacing: "0.02em" }}>Plateforme nationale de télémédecine</span>
            </div>

            <h1 style={{ fontFamily: F.title, fontWeight: 800, lineHeight: 1.08, fontSize: "clamp(2.4rem, 4.2vw, 3.5rem)", color: C.text, letterSpacing: "-0.04em", marginBottom: "1.2rem" }}>
              La santé de qualité,{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                partout au Sénégal
              </span>
            </h1>

            <p style={{ fontSize: "1.05rem", color: C.textMid, lineHeight: 1.72, maxWidth: 470 }}>
              Consultez un médecin certifié, gérez votre dossier médical électronique et bénéficiez d'un suivi cardiologique assisté par IA.
            </p>

            <div style={{ display: "flex", gap: "0.8rem", marginTop: "2.2rem", flexWrap: "wrap" }}>
              <Btn size="lg" onClick={() => setPage("register")} icon={I.arrowR}
                style={{ background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`, boxShadow: `0 8px 28px ${C.primary}40`, border: "none" }}>
                Créer un compte
              </Btn>
              <Btn size="lg" variant="outline" onClick={() => setPage("login")}>
                Se connecter
              </Btn>
            </div>

            {/* Stats pills */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.7rem", marginTop: "2.8rem" }}>
              {[["500+", "Médecins"], ["50K+", "Patients"], ["4.9★", "Note"], ["24/7", "Dispo"]].map(([v, l]) => (
                <div key={l} style={{ background: "white", borderRadius: 14, padding: "0.95rem 1rem", border: `1px solid ${C.borderLight}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", textAlign: "center" }}>
                  <div style={{ fontFamily: F.title, fontSize: "1.35rem", fontWeight: 800, color: C.primary, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: "0.7rem", color: C.textLight, marginTop: "0.25rem", fontWeight: 500 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Droite — Photos */}
          <div className="fade-up-2" style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 420 }}>

            {/* Glow cercle derrière les photos */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle, ${C.primaryPale} 0%, transparent 70%)`, pointerEvents: "none" }} />

            {/* Photo principale */}
            <div style={{ width: 255, height: 320, borderRadius: 24, overflow: "hidden", boxShadow: `0 28px 64px ${C.primary}28, 0 4px 16px rgba(0,0,0,0.08)`, border: "3px solid white", position: "relative", zIndex: 2 }}>
              <img src={IMG.medecinH} alt="Médecin MediConnect" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
            </div>

            {/* Photo secondaire */}
            <div style={{ width: 185, height: 235, borderRadius: 20, overflow: "hidden", boxShadow: "0 16px 44px rgba(0,0,0,0.14)", border: "3px solid white", position: "absolute", right: 8, bottom: 0, zIndex: 3 }}>
              <img src={IMG.medecinF} alt="Médecin consultante" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
            </div>

            {/* Badge patients */}
            <div style={{ position: "absolute", bottom: 50, left: -10, zIndex: 4, background: "white", borderRadius: 14, padding: "0.7rem 1rem", boxShadow: "0 8px 28px rgba(0,0,0,0.12)", border: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.primaryPale, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={I.users} size={17} stroke={C.primary} sw={1.8} />
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: C.text, fontFamily: F.title, lineHeight: 1 }}>50 000+</div>
                <div style={{ fontSize: "0.63rem", color: C.textLight }}>patients suivis</div>
              </div>
            </div>

            {/* Badge "Consultation en cours" */}
            <div style={{ position: "absolute", top: 24, right: -4, zIndex: 4, background: "white", borderRadius: 12, padding: "0.55rem 0.85rem", boxShadow: "0 6px 22px rgba(0,0,0,0.1)", border: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1ecb78", flexShrink: 0 }} />
              <span style={{ fontSize: "0.67rem", fontWeight: 700, color: C.text }}>Consultation active</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          BANDE LOGOS PARTENAIRES
      ══════════════════════════════ */}
      <section style={{ padding: "1.4rem 2rem", background: "white", borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "3.5rem", flexWrap: "wrap" }}>
          {["HGGY Dakar", "Hôpital Principal", "CHU de Fann", "Hôpital Abass Ndao", "EPT Thiès"].map(p => (
            <span key={p} style={{ fontSize: "0.78rem", fontWeight: 700, color: C.textLight, letterSpacing: "0.04em", textTransform: "uppercase" }}>{p}</span>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          FONCTIONNALITÉS
      ══════════════════════════════ */}
      <section style={{ padding: "6rem 2rem", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: C.primaryPale, border: `1.5px solid ${C.border}`, borderRadius: 100, padding: "0.3rem 0.9rem", marginBottom: "0.9rem" }}>
              <Icon d={I.activity} size={12} stroke={C.primary} sw={2} />
              <span style={{ fontSize: "0.71rem", fontWeight: 700, color: C.primaryDark }}>Fonctionnalités</span>
            </div>
            <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: C.text, letterSpacing: "-0.03em" }}>
              Une plateforme complète pour la santé
            </h2>
            <p style={{ color: C.textMid, fontSize: "0.95rem", marginTop: "0.6rem", maxWidth: 480, margin: "0.6rem auto 0" }}>
              Tous les outils nécessaires pour digitaliser la prise en charge médicale au Sénégal.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
            {features.map((feat, i) => (
              <div key={feat.title}
                onMouseEnter={() => setHovCard(i)}
                onMouseLeave={() => setHovCard(null)}
                style={{
                  padding: "1.5rem",
                  borderRadius: 18,
                  background: "white",
                  border: `1.5px solid ${hovCard === i ? feat.color + "50" : C.borderLight}`,
                  boxShadow: hovCard === i ? `0 12px 32px ${feat.color}18, 0 2px 8px rgba(0,0,0,0.04)` : "0 1px 4px rgba(0,0,0,0.04)",
                  transition: "all 0.22s ease",
                  transform: hovCard === i ? "translateY(-5px)" : "none",
                  position: "relative", overflow: "hidden",
                }}>
                {/* Numéro watermark */}
                <div style={{ position: "absolute", top: -10, right: 10, fontFamily: F.title, fontSize: "4rem", fontWeight: 900, color: hovCard === i ? `${feat.color}10` : `${C.primary}06`, lineHeight: 1, userSelect: "none" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg, ${feat.color}20, ${feat.color}0a)`, border: `1.5px solid ${feat.color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.1rem" }}>
                  <Icon d={feat.icon} size={22} stroke={feat.color} sw={1.8} />
                </div>
                <h3 style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.94rem", color: C.text, marginBottom: "0.45rem" }}>{feat.title}</h3>
                <p style={{ fontSize: "0.8rem", color: C.textMid, lineHeight: 1.62 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          STATS BAND
      ══════════════════════════════ */}
      <section style={{ background: `linear-gradient(135deg, ${C.primaryDeep} 0%, ${C.primaryDark} 100%)`, padding: "3.5rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0", position: "relative" }}>
          {[
            { value: "500+",  label: "Médecins inscrits",         icon: I.user },
            { value: "50K+",  label: "Patients pris en charge",   icon: I.users },
            { value: "14",    label: "Régions couvertes",         icon: I.map },
            { value: "98 %",  label: "Satisfaction patient",      icon: I.award },
          ].map(({ value, label, icon }, i) => (
            <div key={label} style={{ textAlign: "center", padding: "0.5rem 1.5rem", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.12)" : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.9rem" }}>
                <Icon d={icon} size={18} stroke="rgba(255,255,255,0.7)" sw={1.8} />
              </div>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "2.2rem", color: "white", lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.48)", marginTop: "0.4rem", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          TÉMOIGNAGES
      ══════════════════════════════ */}
      <section style={{ padding: "6rem 2rem", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: C.primaryPale, border: `1.5px solid ${C.border}`, borderRadius: 100, padding: "0.3rem 0.9rem", marginBottom: "0.9rem" }}>
              <Icon d={I.heart} size={11} stroke={C.primary} sw={2} />
              <span style={{ fontSize: "0.71rem", fontWeight: 700, color: C.primaryDark }}>Témoignages</span>
            </div>
            <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", color: C.text, letterSpacing: "-0.03em" }}>
              Ils font confiance à MediConnect
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            {temoignages.map((t, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 22, border: `1.5px solid ${C.borderLight}`, padding: "1.8rem", display: "flex", flexDirection: "column", gap: "1rem", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
                {/* Stars */}
                <div style={{ display: "flex", gap: "0.2rem" }}>
                  {[...Array(5)].map((_, s) => (
                    <span key={s} style={{ color: "#f59e0b", fontSize: "0.85rem" }}>★</span>
                  ))}
                </div>
                {/* Quote */}
                <p style={{ fontSize: "0.86rem", color: C.textMid, lineHeight: 1.72, flex: 1 }}>
                  "{t.texte}"
                </p>
                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "0.85rem", borderTop: `1px solid ${C.borderLight}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: `2px solid ${C.border}`, flexShrink: 0 }}>
                    <img src={t.photo} alt={t.nom} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.88rem", color: C.text }}>{t.nom}</div>
                    <div style={{ fontSize: "0.72rem", color: C.textLight, marginTop: "0.1rem" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          COMMENT ÇA MARCHE
      ══════════════════════════════ */}
      <section style={{ padding: "6rem 2rem", background: C.bg }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: C.primaryPale, border: `1.5px solid ${C.border}`, borderRadius: 100, padding: "0.3rem 0.9rem", marginBottom: "0.9rem" }}>
              <Icon d={I.clipboard} size={11} stroke={C.primary} sw={2} />
              <span style={{ fontSize: "0.71rem", fontWeight: 700, color: C.primaryDark }}>Comment ça marche</span>
            </div>
            <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", color: C.text, letterSpacing: "-0.03em" }}>Simple en 4 étapes</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem", position: "relative" }}>
            {/* Ligne connectrice */}
            <div style={{ position: "absolute", top: 32, left: "12.5%", right: "12.5%", height: 2, background: `linear-gradient(90deg, ${C.primary}40, ${C.primary}, ${C.primaryLight}, ${C.primary}40)`, borderRadius: 1, zIndex: 0 }} />

            {[
              { num: "01", title: "Inscription",  desc: "Créez votre compte médecin ou infirmier en quelques minutes.",           icon: I.user,      accent: C.primary },
              { num: "02", title: "Prise de RDV", desc: "Réservez un créneau en ligne ou assignez un rendez-vous patient.",       icon: I.calendar,  accent: "#1660a8" },
              { num: "03", title: "Consultation", desc: "Rejoignez la session vidéo ou saisissez les constantes sur place.",      icon: I.video,     accent: "#e07228" },
              { num: "04", title: "Suivi",        desc: "Accédez aux ordonnances, résultats et historique depuis n'importe où.", icon: I.clipboard, accent: "#17935a" },
            ].map((s, i) => (
              <div key={s.num} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: i % 2 === 0 ? `linear-gradient(135deg, ${s.accent}, ${s.accent}cc)` : "white",
                  border: `2.5px solid ${s.accent}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1.3rem",
                  boxShadow: `0 6px 20px ${s.accent}30`,
                }}>
                  <Icon d={s.icon} size={26} stroke={i % 2 === 0 ? "white" : s.accent} sw={1.8} />
                </div>
                <div style={{ fontFamily: F.title, fontSize: "0.62rem", fontWeight: 700, color: s.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>Étape {s.num}</div>
                <h3 style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1rem", color: C.text, marginBottom: "0.5rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.8rem", color: C.textMid, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          PHOTOS + IMPACT
      ══════════════════════════════ */}
      <section style={{ padding: "5.5rem 2rem", background: `linear-gradient(135deg, ${C.primaryDeep}, ${C.primaryDark})`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center", position: "relative" }}>

          {/* Photos */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1, height: 310, borderRadius: 22, overflow: "hidden", border: "2px solid rgba(255,255,255,0.14)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <img src={IMG.medecinEnfant} alt="Médecin et patient" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, height: 245, borderRadius: 20, overflow: "hidden", border: "2px solid rgba(255,255,255,0.14)", boxShadow: "0 16px 44px rgba(0,0,0,0.35)", marginBottom: 24 }}>
              <img src={IMG.infirmiere} alt="Infirmière MediConnect" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
            </div>
          </div>

          {/* Texte */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 100, padding: "0.3rem 0.8rem", marginBottom: "1.2rem" }}>
              <span style={{ fontSize: "0.69rem", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Notre impact</span>
            </div>
            <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "white", letterSpacing: "-0.02em", lineHeight: 1.22 }}>
              Des soins accessibles pour chaque Sénégalais
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", lineHeight: 1.72, marginTop: "1rem", marginBottom: "2rem" }}>
              De Dakar à Kédougou, nos médecins et infirmiers connectés transforment l'accès aux soins dans toutes les régions du Sénégal.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { value: "14 régions",  label: "couvertes à travers le Sénégal" },
                { value: "< 30 min",    label: "délai moyen pour une consultation" },
                { value: "98 %",        label: "de satisfaction patient rapportée" },
              ].map(s => (
                <div key={s.value} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 3, height: 38, borderRadius: 2, background: C.accent, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.15rem", color: "white", lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          CTA
      ══════════════════════════════ */}
      <section style={{ padding: "5.5rem 2rem", background: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #d4ede9 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.45, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.primaryPale} 0%, transparent 65%)`, pointerEvents: "none" }} />

        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: `0 8px 28px ${C.primary}40` }}>
            <Icon d={I.heart} size={28} stroke="white" sw={2} />
          </div>
          <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)", color: C.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Prêt à rejoindre{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              MediConnect ?
            </span>
          </h2>
          <p style={{ marginTop: "0.9rem", color: C.textMid, fontSize: "1rem", lineHeight: 1.72, maxWidth: 480, margin: "0.9rem auto 0" }}>
            Rejoignez des milliers de professionnels de santé et patients qui font confiance à MediConnect Sénégal.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.2rem", flexWrap: "wrap" }}>
            <Btn size="lg" onClick={() => setPage("register")} icon={I.arrowR}
              style={{ background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`, border: "none", boxShadow: `0 8px 28px ${C.primary}40` }}>
              Créer un compte
            </Btn>
            <Btn size="lg" variant="outline" onClick={() => setPage("login")}>
              Se connecter
            </Btn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer style={{ background: C.primaryDeep, padding: "3rem 2rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "2.5rem", marginBottom: "2.5rem" }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.9rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={I.heart} size={16} stroke="#1ecb88" sw={2} />
                </div>
                <span style={{ fontFamily: F.title, fontWeight: 800, color: "white", fontSize: "0.95rem" }}>MediConnect</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.7, maxWidth: 220 }}>
                Plateforme nationale de télémédecine pour un accès universel aux soins de santé au Sénégal.
              </p>
            </div>
            {/* Links */}
            {[
              { title: "Plateforme", links: ["Fonctionnalités", "Tarifs", "Sécurité", "API"] },
              { title: "Légal",      links: ["Conditions d'utilisation", "Confidentialité", "Loi n°2008-12", "Cookies"] },
              { title: "Contact",    links: ["Support technique", "Partenariats", "Presse", "Carrières"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.9rem" }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {col.links.map(l => (
                    <span key={l} style={{ fontSize: "0.77rem", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>{l}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.72rem" }}>© 2025 SIPREC-SEN · École Polytechnique de Thiès · Hôpital Général de Grand Yoff</p>
            <div style={{ display: "flex", gap: "0.7rem" }}>
              {["🇸🇳 Sénégal", "FR", "WO"].map(l => (
                <span key={l} style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export { Navbar, LandingPage };
