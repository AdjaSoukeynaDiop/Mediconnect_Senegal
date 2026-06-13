import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import Icon from "../../components/ui/Icon.jsx";
import ECGLine from "../../components/ui/ECGLine.jsx";

// ─── Photos placées dans public/images/ ───
const IMG = {
  medecinH:      "/images/med2.webp",   // médecin homme tablette  → grand portrait
  medecinF:      "/images/med1.webp",   // médecin femme tablette  → portrait secondaire
  infirmiere:    "/images/im3.webp",    // infirmière tenue bleue
  medecinEnfant: "/images/im4.webp",    // médecin + enfant
};

/* ════════════════════════════════════
   AUTH LAYOUT
   Panneau gauche : photos + branding
   Panneau droit  : formulaire (children)
════════════════════════════════════ */
const AuthLayout = ({ children, title, subtitle }) => (
  <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>

    {/* ── Panneau gauche avec photos ── */}
    <div style={{
      width: "45%",
      flexShrink: 0,
      background: `linear-gradient(155deg, ${C.primaryDeep} 0%, ${C.primaryDark} 60%, #043d30 100%)`,
      display: "flex",
      flexDirection: "column",
      padding: "2.5rem",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", zIndex: 2, position: "relative" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={I.heart} size={20} stroke="#1ecb88" sw={2} />
        </div>
        <div>
          <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.05rem", color: "white", lineHeight: 1 }}>MediConnect</div>
          <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.09em" }}>Sénégal</div>
        </div>
      </div>

      {/* Titre et sous-titre */}
      <div style={{ zIndex: 2, position: "relative", marginTop: "2.5rem" }}>
        <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: "white", lineHeight: 1.25, letterSpacing: "-0.02em" }}>{title}</h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", lineHeight: 1.6, marginTop: "0.6rem", maxWidth: 320 }}>{subtitle}</p>
      </div>

      {/* ── Collage photos ── */}
      <div style={{ flex: 1, position: "relative", zIndex: 2, marginTop: "2rem" }}>

        {/* Photo principale — médecin homme, grande */}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "58%",
          height: 260,
          borderRadius: 18,
          overflow: "hidden",
          border: "2.5px solid rgba(255,255,255,0.18)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
        }}>
          <img
            src={IMG.medecinH}
            alt="Médecin MediConnect"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
        </div>

        {/* Photo secondaire — médecin femme tablette */}
        <div style={{
          position: "absolute",
          right: 0,
          top: 20,
          width: "40%",
          height: 200,
          borderRadius: 16,
          overflow: "hidden",
          border: "2.5px solid rgba(255,255,255,0.18)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
        }}>
          <img
            src={IMG.medecinF}
            alt="Médecin consultante"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
        </div>

        {/* Photo infirmière */}
        <div style={{
          position: "absolute",
          left: "5%",
          top: 275,
          width: "44%",
          height: 190,
          borderRadius: 16,
          overflow: "hidden",
          border: "2.5px solid rgba(255,255,255,0.18)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
        }}>
          <img
            src={IMG.infirmiere}
            alt="Infirmière"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
        </div>

        {/* Photo médecin+enfant */}
        <div style={{
          position: "absolute",
          right: "2%",
          top: 235,
          width: "48%",
          height: 220,
          borderRadius: 16,
          overflow: "hidden",
          border: "2.5px solid rgba(255,255,255,0.18)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
        }}>
          <img
            src={IMG.medecinEnfant}
            alt="Médecin et patient"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
        </div>

        {/* Badge flottant "En ligne" */}
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: -10,
          background: "white",
          borderRadius: 12,
          padding: "0.6rem 1rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          zIndex: 4,
          whiteSpace: "nowrap",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1ecb78" }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.text, fontFamily: F.title }}>500+ médecins disponibles</span>
        </div>
      </div>

      {/* ECG décoratif en bas */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, opacity: 0.1, pointerEvents: "none" }}>
        <ECGLine width={600} color="white" opacity={1} />
      </div>

      {/* Statistiques en bas */}
      <div style={{ zIndex: 2, position: "relative", marginTop: "auto", paddingTop: "5rem", display: "flex", gap: "1.5rem" }}>
        {[
          { value: "50K+",  label: "Patients" },
          { value: "24/7",  label: "Disponible" },
          { value: "4.9★",  label: "Note" },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.1rem", color: "white", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* ── Panneau droit : formulaire ── */}
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 2rem", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
