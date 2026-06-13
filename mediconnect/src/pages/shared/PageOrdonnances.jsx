import { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import { C, F } from "../../constants/theme.js";
import { I }    from "../../constants/icons.js";
import {
  getOrdonnancesByMedecin,
  getOrdonnancesByPatient,
  signerOrdonnance,
} from "../../api/ordonnances.api.js";
import { useAuth }        from "../../api/AuthContext.jsx";
import StatCard           from "../../components/ui/StatCard.jsx";
import { Card, CardHead } from "../../components/ui/Card.jsx";
import { Badge }          from "../../components/ui/TagBadge.jsx";
import Btn                from "../../components/ui/Btn.jsx";
import Icon               from "../../components/ui/Icon.jsx";
import ModalOrdonnance    from "../../components/modals/ModalOrdonnance.jsx";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const isExpired = (iso) => iso ? new Date(iso) < new Date() : false;
const isActive  = (iso) => iso ? new Date(iso) >= new Date() : false;

const COLORS = ["#1660a8","#17935a","#e08833","#8e44ad","#c0392b","#16a085","#d35400"];
const avatarColor = (str = "") => COLORS[(str.charCodeAt(0) || 0) % COLORS.length];
const initials = (prenom = "", nom = "") =>
  `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";

// ── QR Code asynchrone ───────────────────────────────────────────────────────
const QRImg = ({ value, size = 80, style }) => {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(`MEDICONNECT:ORD:${value}`, { width: size * 2, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
      .then(setSrc).catch(() => {});
  }, [value, size]);
  return src ? <img src={src} alt="QR vérification" width={size} height={size} style={style} /> : null;
};

// ── Composant PrintZone ───────────────────────────────────────────────────────
const PrintZone = ({ ordo }) => (
  <div id="ordo-print-zone" style={{ fontFamily: "Georgia, serif", color: "#000", padding: "1cm" }}>
    {/* En-tête */}
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "0.75cm", marginBottom: "0.75cm" }}>
      <div>
        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>ORDONNANCE MÉDICALE</div>
        <div style={{ fontSize: "0.8rem", marginTop: "0.2rem", color: "#555" }}>
          N° {ordo.id} — Émise le {fmtDate(ordo.dateEmission)}
        </div>
      </div>
      <div style={{ textAlign: "right", fontSize: "0.82rem" }}>
        <div style={{ fontWeight: 700 }}>Dr. {ordo.prenomMedecin} {ordo.nomMedecin}</div>
        {ordo.specialiteMedecin && <div style={{ color: "#555" }}>{ordo.specialiteMedecin}</div>}
        {ordo.hopitalMedecin    && <div style={{ color: "#555" }}>{ordo.hopitalMedecin}</div>}
        {ordo.signatureNumerique && <div style={{ color: "#17935a" }}>✔ Signature numérique vérifiée</div>}
      </div>
    </div>

    {/* Patient */}
    <div style={{ marginBottom: "0.75cm", padding: "0.4cm", border: "1px solid #ccc", borderRadius: 4 }}>
      <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>Patient</div>
      <div style={{ fontSize: "0.9rem" }}>{ordo.prenomPatient} {ordo.nomPatient}</div>
    </div>

    {/* Lignes */}
    <div style={{ marginBottom: "0.75cm" }}>
      <div style={{ fontWeight: 600, marginBottom: "0.4rem", borderBottom: "1px solid #ccc", paddingBottom: "0.2rem" }}>
        Prescription
      </div>
      {(ordo.lignes ?? []).map((l, i) => (
        <div key={i} style={{ marginBottom: "0.5cm", paddingLeft: "0.4cm" }}>
          <div style={{ fontWeight: 700 }}>
            {i + 1}. {l.medicament}
            {l.dosage ? ` — Dosage : ${l.dosage}` : ""}
          </div>
          {l.posologie   && <div style={{ fontSize: "0.85rem", marginLeft: "1rem" }}>Posologie : {l.posologie}</div>}
          {l.dureeJours  && <div style={{ fontSize: "0.85rem", marginLeft: "1rem" }}>Durée : {l.dureeJours}</div>}
          {l.instructions && <div style={{ fontSize: "0.82rem", marginLeft: "1rem", fontStyle: "italic", color: "#555" }}>{l.instructions}</div>}
        </div>
      ))}
      {(ordo.lignes ?? []).length === 0 && (
        <div style={{ color: "#999", fontStyle: "italic", fontSize: "0.85rem" }}>Aucune ligne de prescription.</div>
      )}
    </div>

    {/* Expiration + signature + QR */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #ccc", paddingTop: "0.5cm", fontSize: "0.82rem" }}>
      <div>
        <div>Valable jusqu'au : <strong>{fmtDate(ordo.dateExpiration)}</strong></div>
        {ordo.signatureNumerique && ordo.qrCode && (
          <div style={{ marginTop: "0.4cm", display: "flex", alignItems: "center", gap: "0.4cm" }}>
            <QRImg value={ordo.qrCode} size={72} />
            <div>
              <div style={{ fontSize: "0.65rem", color: "#555", fontWeight: 700 }}>Code de vérification</div>
              <div style={{ fontSize: "0.58rem", fontFamily: "monospace", color: "#777", wordBreak: "break-all", maxWidth: 140 }}>{ordo.qrCode}</div>
              <div style={{ fontSize: "0.58rem", color: "#17935a", marginTop: 2 }}>✔ Signature numérique vérifiée</div>
            </div>
          </div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ height: 40, width: 120, border: "1px dashed #999", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "0.72rem" }}>
          Cachet / Signature
        </div>
      </div>
    </div>
  </div>
);

// ── Composant principal ───────────────────────────────────────────────────────
const PageOrdonnances = ({ toast }) => {
  const { user } = useAuth();

  const [ordonnances,  setOrdonnances]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [expandedId,   setExpandedId]   = useState(null);
  const [signingId,    setSigningId]    = useState(null);
  const [printOrdo,    setPrintOrdo]    = useState(null);
  const [modalOrdo,    setModalOrdo]    = useState(false);
  const styleRef = useRef(null);

  // ── Print via injection CSS ──────────────────────────────────────────────
  useEffect(() => {
    if (!printOrdo) return;

    const style = document.createElement("style");
    style.textContent = `
      @page { margin: 0; size: A4; }
      @media print {
        body * { visibility: hidden !important; }
        #ordo-print-zone, #ordo-print-zone * { visibility: visible !important; }
        #ordo-print-zone {
          position: fixed !important;
          left: 0; top: 0;
          width: 100%;
          background: white;
          padding: 1.5cm 2cm;
          box-sizing: border-box;
        }
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;

    const timer = setTimeout(() => {
      window.print();
      style.remove();
      styleRef.current = null;
      setPrintOrdo(null);
    }, 150);

    return () => {
      clearTimeout(timer);
      style.remove();
      styleRef.current = null;
    };
  }, [printOrdo]);

  // ── Chargement ────────────────────────────────────────────────────────────
  const loadOrdonnances = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      const role = user?.role;
      if (role === "PATIENT" && user?.userId) {
        res = await getOrdonnancesByPatient(user.userId);
      } else if (user?.userId) {
        res = await getOrdonnancesByMedecin(user.userId);
      } else {
        res = [];
      }
      const arr = res?.data ?? res;
      setOrdonnances(Array.isArray(arr) ? arr : []);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast(err.apiMessage ?? "Erreur lors du chargement des ordonnances", "error");
      }
      setOrdonnances([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { loadOrdonnances(); }, [loadOrdonnances]);

  // ── Signer ────────────────────────────────────────────────────────────────
  const handleSigner = async (ordo) => {
    setSigningId(ordo.id);
    try {
      const res = await signerOrdonnance(ordo.id);
      const updated = res?.data ?? res;
      setOrdonnances((prev) => prev.map((o) => o.id === updated.id ? updated : o));
      toast("Ordonnance signée numériquement", "success");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la signature", "error");
    } finally {
      setSigningId(null);
    }
  };

  // ── Nouvelle ordonnance ───────────────────────────────────────────────────
  const handleOrdoCreated = (ordo) => {
    setOrdonnances((prev) => [ordo, ...prev]);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const countSigned  = ordonnances.filter((o) => o.signatureNumerique).length;
  const countActive  = ordonnances.filter((o) => isActive(o.dateExpiration)).length;
  const countExpired = ordonnances.filter((o) => isExpired(o.dateExpiration)).length;

  // ── Skeleton ──────────────────────────────────────────────────────────────
  const SkeletonRow = () => (
    <tr>
      {[70, 140, 110, 70, 90, 70, 60].map((w, i) => (
        <td key={i}>
          <div style={{ height: 12, width: w, borderRadius: 6, background: C.bg, animation: "pulse 1.4s ease-in-out infinite" }} />
        </td>
      ))}
    </tr>
  );

  const sorted = [...ordonnances].sort((a, b) =>
    new Date(b.dateEmission ?? b.createdAt) - new Date(a.dateEmission ?? a.createdAt)
  );

  return (
    <>
      {/* Zone d'impression (cachée à l'écran) */}
      {printOrdo && (
        <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
          <PrintZone ordo={printOrdo} />
        </div>
      )}

      <ModalOrdonnance
        open={modalOrdo}
        onClose={() => setModalOrdo(false)}
        toast={toast}
        onCreated={handleOrdoCreated}
      />

      {/* StatCards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard label="Total ordonnances"    value={ordonnances.length} sub={loading ? "Chargement…" : `${countActive} active(s)`}   color={C.primary}  icon={I.clipboard} />
        <StatCard label="Signées numériquement" value={countSigned}       sub={`${ordonnances.length ? Math.round(countSigned / ordonnances.length * 100) : 0}% du total`} color="#17935a"   icon={I.check} delta={{ up: true }} />
        <StatCard label="Actives"              value={countActive}        sub="Non expirées"           color="#1660a8"  icon={I.activity} />
        <StatCard label="Expirées"             value={countExpired}       sub="À renouveler"           color={C.danger} icon={I.bell} />
      </div>

      {/* Tableau */}
      <Card>
        <CardHead
          title="Ordonnances électroniques"
          sub={loading ? "Chargement…" : `${sorted.length} ordonnance(s)`}
          action={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={loadOrdonnances}
                disabled={loading}
                title="Actualiser"
                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "white", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon d={I.activity} size={14} stroke={loading ? C.textLight : C.textMid} sw={2} />
              </button>
              <Btn size="sm" icon={I.plus} onClick={() => setModalOrdo(true)}>Nouvelle ordonnance</Btn>
            </div>
          }
        />

        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Patient</th>
              <th>Médecin</th>
              <th>Médicaments</th>
              <th>Émise le</th>
              <th>Expiration</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !ordonnances.length
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : sorted.length === 0
                ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: C.textLight, fontSize: "0.84rem" }}>
                      <Icon d={I.clipboard} size={32} stroke={C.borderLight} sw={1.5} style={{ display: "block", margin: "0 auto 0.75rem" }} />
                      Aucune ordonnance trouvée
                    </td>
                  </tr>
                )
                : sorted.map((ordo) => {
                  const expired    = isExpired(ordo.dateExpiration);
                  const isExpanded = expandedId === ordo.id;
                  const isSigning  = signingId  === ordo.id;
                  const lignes     = Array.isArray(ordo.lignes) ? ordo.lignes : [];

                  return [
                    /* Ligne principale */
                    <tr
                      key={ordo.id}
                      onClick={() => setExpandedId(isExpanded ? null : ordo.id)}
                      style={{ cursor: "pointer", background: isExpanded ? C.primaryPale : undefined }}
                    >
                      {/* N° */}
                      <td style={{ fontFamily: "monospace", fontSize: "0.72rem", color: C.textMid }}>
                        #{ordo.id}
                      </td>

                      {/* Patient */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                            background: avatarColor(ordo.nomPatient ?? ""),
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontWeight: 700, fontSize: "0.65rem", fontFamily: F.title,
                          }}>
                            {initials(ordo.prenomPatient, ordo.nomPatient)}
                          </div>
                          <span style={{ fontSize: "0.8rem", color: C.text }}>
                            {ordo.prenomPatient} {ordo.nomPatient}
                          </span>
                        </div>
                      </td>

                      {/* Médecin */}
                      <td style={{ fontSize: "0.78rem", color: C.textMid }}>
                        Dr. {ordo.prenomMedecin} {ordo.nomMedecin}
                      </td>

                      {/* Nb médicaments */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.78rem", color: C.textMid }}>
                            {lignes.length} médicament{lignes.length > 1 ? "s" : ""}
                          </span>
                          <span style={{ display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                            <Icon d={I.chevR} size={11} stroke={C.textLight} sw={2} />
                          </span>
                        </div>
                      </td>

                      {/* Date émission */}
                      <td style={{ fontSize: "0.78rem", color: C.textMid, whiteSpace: "nowrap" }}>
                        {fmtDate(ordo.dateEmission)}
                      </td>

                      {/* Date expiration */}
                      <td>
                        <span style={{ fontSize: "0.78rem", color: expired ? C.danger : C.textMid, fontWeight: expired ? 600 : 400 }}>
                          {fmtDate(ordo.dateExpiration)}
                        </span>
                      </td>

                      {/* Statut */}
                      <td>
                        {ordo.signatureNumerique
                          ? <Badge variant="teal">Signée</Badge>
                          : <Badge variant="orange">Non signée</Badge>
                        }
                        {expired && (
                          <Badge variant="red" style={{ marginLeft: "0.25rem" }}>Expirée</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
                          {/* Imprimer */}
                          <button
                            title="Imprimer"
                            onClick={() => setPrintOrdo(ordo)}
                            style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <Icon d={I.download} size={12} sw={2} stroke={C.textMid} />
                          </button>

                          {/* Signer */}
                          {!ordo.signatureNumerique && (
                            <button
                              title="Signer numériquement"
                              disabled={isSigning}
                              onClick={() => handleSigner(ordo)}
                              style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: isSigning ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Icon d={I.check} size={12} sw={2} stroke={isSigning ? C.textLight : "#17935a"} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>,

                    /* Ligne étendue — lignes de prescription */
                    isExpanded && (
                      <tr key={`${ordo.id}-detail`} style={{ background: "#f8fbff" }}>
                        <td colSpan={8} style={{ padding: 0 }}>
                          <div style={{ padding: "0.85rem 1.25rem 1rem", borderTop: `1px solid ${C.borderLight}` }}>
                            {lignes.length === 0 ? (
                              <span style={{ fontSize: "0.8rem", color: C.textLight }}>
                                Aucune ligne de prescription enregistrée
                              </span>
                            ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr style={{ background: "transparent" }}>
                                    {["Médicament", "Posologie", "Durée", "Qté", "Instructions"].map((h) => (
                                      <th
                                        key={h}
                                        style={{ textAlign: "left", fontSize: "0.7rem", fontWeight: 600, color: C.textMid, padding: "0.25rem 0.6rem", borderBottom: `1px solid ${C.borderLight}`, fontFamily: F.title, textTransform: "uppercase", letterSpacing: "0.04em" }}
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {lignes.map((l, j) => (
                                    <tr key={j} style={{ background: "transparent" }}>
                                      <td style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text,    padding: "0.35rem 0.6rem" }}>
                                        <span style={{ color: C.primary, marginRight: "0.35rem" }}>•</span>
                                        {l.medicament}
                                      </td>
                                      <td style={{ fontSize: "0.78rem", color: C.textMid, padding: "0.35rem 0.6rem" }}>{l.posologie   ?? "—"}</td>
                                      <td style={{ fontSize: "0.78rem", color: C.textMid, padding: "0.35rem 0.6rem" }}>{l.dureeJours  ?? "—"}</td>
                                      <td style={{ fontSize: "0.78rem", color: C.textMid, padding: "0.35rem 0.6rem" }}>{l.dosage      ?? "—"}</td>
                                      <td style={{ fontSize: "0.76rem", color: C.textLight, fontStyle: "italic", padding: "0.35rem 0.6rem" }}>{l.instructions ?? "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}

                            {/* QR code de vérification (ordonnances signées) */}
                            {ordo.signatureNumerique && ordo.qrCode && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.6rem 0", padding: "0.6rem 0.85rem", background: "#f0faf5", borderRadius: 8, border: "1px solid #c3e6d1" }}>
                                <QRImg value={ordo.qrCode} size={64} style={{ flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#17935a" }}>QR Code de vérification</div>
                                  <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#555", wordBreak: "break-all" }}>{ordo.qrCode}</div>
                                  <div style={{ fontSize: "0.68rem", color: C.textLight, marginTop: "0.15rem" }}>Scanner pour authentifier cette ordonnance</div>
                                </div>
                              </div>
                            )}

                            {/* Bouton imprimer dans la zone étendue */}
                            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                              <Btn
                                variant="outline"
                                size="sm"
                                icon={I.download}
                                onClick={() => setPrintOrdo(ordo)}
                              >
                                Imprimer l'ordonnance
                              </Btn>
                              {!ordo.signatureNumerique && (
                                <Btn
                                  size="sm"
                                  icon={I.check}
                                  disabled={isSigning}
                                  onClick={() => handleSigner(ordo)}
                                >
                                  {isSigning ? "Signature…" : "Signer numériquement"}
                                </Btn>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })
            }
          </tbody>
        </table>
      </Card>
    </>
  );
};

export default PageOrdonnances;
