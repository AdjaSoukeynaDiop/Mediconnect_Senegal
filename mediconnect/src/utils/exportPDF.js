/**
 * Génération PDF d'ordonnances médicales avec jsPDF
 * Palette : teal (#0d7a6e / #044840) + accent vert (#1ecb88)
 */

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

const TEAL_DEEP   = [4,   72,  64];
const TEAL        = [13,  122, 110];
const TEAL_LIGHT  = [230, 247, 245];
const ACCENT      = [30,  203, 136];
const DANGER      = [201, 53,  53];
const DANGER_LIGHT= [253, 235, 235];
const WARNING     = [224, 114, 40];
const WARNING_LIGHT=[255, 247, 235];
const DARK        = [12,  40,  38];
const GRAY        = [106, 158, 152];
const LIGHT_BORDER= [204, 233, 229];
const WHITE       = [255, 255, 255];

function expirationInfo(dateExp) {
  if (!dateExp) return null;
  const diff = Math.ceil((new Date(dateExp) - new Date()) / 86400000);
  if (diff < 0)  return { color: DANGER,  bg: DANGER_LIGHT,  text: `Expiree le ${fmtDate(dateExp)}` };
  if (diff <= 7) return { color: WARNING, bg: WARNING_LIGHT, text: `Expire dans ${diff} jour(s) - ${fmtDate(dateExp)}` };
  return           { color: TEAL,   bg: TEAL_LIGHT,   text: `Valable jusqu'au ${fmtDate(dateExp)}` };
}

function drawHeader(doc, W) {
  doc.setFillColor(...TEAL_DEEP);
  doc.rect(0, 0, W, 20, "F");

  // MC badge
  doc.setFillColor(...ACCENT);
  doc.roundedRect(14, 5, 10, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...TEAL_DEEP);
  doc.text("MC", 19, 11.5, { align: "center" });

  // Brand name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text("MediConnect", 27, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(160, 210, 205);
  doc.text("Plateforme medicale connectee", 27, 15.5);

  // Date on right
  doc.setFontSize(7);
  doc.setTextColor(160, 210, 205);
  doc.text(
    `Edite le ${new Date().toLocaleDateString("fr-FR")}`,
    W - 14, 11,
    { align: "right" }
  );
}

function drawFooter(doc, W, H) {
  doc.setFillColor(...TEAL_DEEP);
  doc.rect(0, H - 9, W, 9, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(150, 200, 195);
  doc.text(
    "MediConnect - Document medical confidentiel - Usage exclusif du patient designe",
    W / 2, H - 3.5,
    { align: "center" }
  );
}

/**
 * Exporte une liste d'ordonnances en PDF et déclenche le téléchargement.
 * @param {Array}  ordonnances  - tableau d'objets RendezVousResponse
 * @param {string} [nomPatient] - nom du patient pour le nom de fichier
 */
export async function exportOrdonnancesPDF(ordonnances, nomPatient = "patient") {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W  = doc.internal.pageSize.getWidth();   // 210 mm
  const H  = doc.internal.pageSize.getHeight();  // 297 mm
  const LM = 14; // left margin
  const RM = 14; // right margin
  const CW = W - LM - RM;

  const sorted = [...ordonnances].sort(
    (a, b) => new Date(b.dateEmission ?? b.createdAt) - new Date(a.dateEmission ?? a.createdAt)
  );

  sorted.forEach((ordo, idx) => {
    if (idx > 0) doc.addPage();

    drawHeader(doc, W);
    drawFooter(doc, W, H);

    let y = 27;

    // ── Titre + référence ─────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...DARK);
    doc.text("ORDONNANCE MEDICALE", LM, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(
      `Ref. N°${ordo.id}  |  Emise le ${fmtDate(ordo.dateEmission)}`,
      LM, y + 6
    );

    // ── Médecin (droite) ──────────────────────────────────────────────────────
    const docName = `Dr. ${ordo.prenomMedecin ?? ""} ${ordo.nomMedecin ?? ""}`.trim();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(docName, W - RM, y, { align: "right" });

    let yd = y + 5;
    if (ordo.specialiteMedecin) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text(ordo.specialiteMedecin, W - RM, yd, { align: "right" });
      yd += 4.5;
    }
    if (ordo.hopitalMedecin) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text(ordo.hopitalMedecin, W - RM, yd, { align: "right" });
    }

    // ── Séparateur ────────────────────────────────────────────────────────────
    y += 13;
    doc.setDrawColor(...LIGHT_BORDER);
    doc.setLineWidth(0.6);
    doc.line(LM, y, W - RM, y);

    // ── Encadré patient ───────────────────────────────────────────────────────
    y += 5;
    doc.setFillColor(...TEAL_LIGHT);
    doc.roundedRect(LM, y, CW, 13, 2, 2, "F");
    doc.setFillColor(...TEAL);
    doc.roundedRect(LM, y, 2.5, 13, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text("PATIENT", LM + 6, y + 4.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(
      `${ordo.prenomPatient ?? ""} ${ordo.nomPatient ?? ""}`.trim() || "—",
      LM + 6, y + 10.5
    );

    // ── Section prescription ─────────────────────────────────────────────────
    y += 19;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...TEAL);
    doc.text("MEDICAMENTS PRESCRITS", LM, y);

    y += 1.5;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.8);
    doc.line(LM, y, LM + 52, y);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...LIGHT_BORDER);
    doc.line(LM + 52, y, W - RM, y);
    y += 5;

    const lignes = Array.isArray(ordo.lignes) ? ordo.lignes : [];

    if (lignes.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      doc.text("Aucune ligne de prescription enregistree.", LM, y);
      y += 8;
    } else {
      lignes.forEach((l, i) => {
        if (y > H - 65) { doc.addPage(); drawHeader(doc, W); drawFooter(doc, W, H); y = 27; }

        // Puce numérotée
        doc.setFillColor(...TEAL);
        doc.roundedRect(LM, y - 2, 5.5, 5.5, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(...WHITE);
        doc.text(String(i + 1), LM + 2.75, y + 2, { align: "center" });

        // Nom + dosage
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...DARK);
        const medText = l.dosage
          ? `${l.medicament ?? "Medicament"} - ${l.dosage}`
          : (l.medicament ?? "Medicament");
        doc.text(medText, LM + 8, y + 2.5);
        y += 7;

        if (l.posologie) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(...GRAY);
          doc.text(`Posologie : ${l.posologie}`, LM + 8, y);
          y += 5;
        }
        if (l.dureeJours) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(...GRAY);
          doc.text(`Duree : ${l.dureeJours}`, LM + 8, y);
          y += 5;
        }
        if (l.instructions) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          const lines = doc.splitTextToSize(l.instructions, CW - 10);
          doc.text(lines, LM + 8, y);
          y += lines.length * 4.5;
        }
        y += 5;
      });
    }

    // ── Pied de page (expiration + signature) ────────────────────────────────
    const footerTop = H - 42;
    doc.setDrawColor(...LIGHT_BORDER);
    doc.setLineWidth(0.5);
    doc.line(LM, footerTop, W - RM, footerTop);

    // Badge expiration
    const expInfo = expirationInfo(ordo.dateExpiration);
    if (expInfo) {
      doc.setFillColor(...expInfo.bg);
      doc.roundedRect(LM, footerTop + 5, 95, 8, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...expInfo.color);
      doc.text(expInfo.text, LM + 5, footerTop + 10.5);
    }

    // Cadre signature (droite)
    const sigX = W - RM - 50;
    const sigY = footerTop + 4;
    doc.setDrawColor(...LIGHT_BORDER);
    doc.setLineWidth(0.4);
    doc.roundedRect(sigX, sigY, 50, 22, 2, 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text("Signature / Cachet", sigX + 25, sigY + 8, { align: "center" });

    if (ordo.signatureNumerique) {
      doc.setFillColor(...TEAL_LIGHT);
      doc.roundedRect(sigX + 2, sigY + 12, 46, 7, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...TEAL);
      doc.text("Signature numerique verifiee", sigX + 25, sigY + 16.5, { align: "center" });
    }
  });

  const dateStr = new Date().toISOString().split("T")[0];
  const safeName = nomPatient.replace(/\s+/g, "-").toLowerCase();
  doc.save(`ordonnances-${safeName}-${dateStr}.pdf`);
}
