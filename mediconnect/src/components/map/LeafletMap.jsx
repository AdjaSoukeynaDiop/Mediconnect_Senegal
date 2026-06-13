import { useState, useEffect, useRef } from "react";
import { C } from "../../constants/theme.js";

// ── Geocodage par région sénégalaise ──────────────────────────────────────────
const REGION_COORDS = {
  "dakar":       [14.693, -17.444],
  "thiès":       [14.789, -16.924],
  "thies":       [14.789, -16.924],
  "saint-louis": [16.019, -16.489],
  "diourbel":    [14.655, -16.236],
  "kaolack":     [14.152, -16.074],
  "fatick":      [14.339, -16.411],
  "kaffrine":    [14.106, -15.551],
  "tambacounda": [13.770, -13.667],
  "ziguinchor":  [12.565, -16.272],
  "kolda":       [12.898, -14.951],
  "louga":       [15.619, -16.224],
  "matam":       [15.659, -13.255],
  "kédougou":    [12.556, -12.175],
  "kedougou":    [12.556, -12.175],
  "sédhiou":     [12.708, -15.557],
  "sedhiou":     [12.708, -15.557],
};

// Hôpitaux de référence (fallback si BDD sans coordonnées)
const HOPITAUX_FALLBACK = [
  { nom: "HGGY — Cardiologie",        latitude: 14.6938, longitude: -17.4432, typeEtablissement: "PUBLIC" },
  { nom: "CHU de Fann",                latitude: 14.6851, longitude: -17.4603, typeEtablissement: "PUBLIC" },
  { nom: "Hôpital Principal de Dakar", latitude: 14.692,  longitude: -17.4498, typeEtablissement: "PUBLIC" },
  { nom: "HR de Thiès",                latitude: 14.7895, longitude: -16.9235, typeEtablissement: "PUBLIC" },
  { nom: "HR de Saint-Louis",          latitude: 16.02,   longitude: -16.489,  typeEtablissement: "PUBLIC" },
  { nom: "CHR de Kaolack",             latitude: 14.153,  longitude: -16.074,  typeEtablissement: "PUBLIC" },
  { nom: "HR de Ziguinchor",           latitude: 12.565,  longitude: -16.272,  typeEtablissement: "PUBLIC" },
  { nom: "CHR de Tambacounda",         latitude: 13.77,   longitude: -13.667,  typeEtablissement: "PUBLIC" },
];

const resolveRegion = (regionStr) =>
  REGION_COORDS[(regionStr ?? "").toLowerCase().trim()] ?? null;

const jLat = (id) => (((Number(id) || 0) % 11) - 5) * 0.009;
const jLng = (id) => (((Number(id) || 0) % 13) - 6) * 0.009;

const calcAge = (dateNaissance) => {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  return beforeBirthday ? age - 1 : age;
};

const LeafletMap = ({ mapLayer = "patients", patients = [], medecins = [], hopitaux = [] }) => {
  const mapRef        = useRef(null);
  const leafletRef    = useRef(null);
  const layerGroupRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [loadError,     setLoadError]     = useState(false);
  const [markerCount,   setMarkerCount]   = useState(0);

  // Charge Leaflet CSS + JS une seule fois
  useEffect(() => {
    if (!document.getElementById("leaflet-css-link")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css-link";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (window.L) { setLeafletLoaded(true); return; }
    const script   = document.createElement("script");
    script.src     = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload  = () => setLeafletLoaded(true);
    script.onerror = () => setLoadError(true);
    document.head.appendChild(script);
  }, []);

  // Rafraîchit la couche dès que le layer, patients, medecins ou hopitaux changent
  // Les données sont passées EXPLICITEMENT en paramètre pour éviter les closures stales
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = window.L;

    if (!leafletRef.current) {
      leafletRef.current = L.map(mapRef.current, {
        center: [14.4974, -14.4524], zoom: 7, scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors", maxZoom: 18,
      }).addTo(leafletRef.current);
      layerGroupRef.current = L.layerGroup().addTo(leafletRef.current);
    }

    const count = renderLayer(L, mapLayer, patients, medecins, hopitaux);
    setMarkerCount(count);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletLoaded, mapLayer, patients, medecins, hopitaux]);

  // renderLayer reçoit les données en paramètre → plus de problème de closure
  const renderLayer = (L, layer, pts, meds, hops) => {
    if (!layerGroupRef.current) return 0;
    layerGroupRef.current.clearLayers();
    let count = 0;

    // ── Layer : patients ─────────────────────────────────────────────────
    if (layer === "patients") {
      const byRegion = {};
      pts.forEach(p => {
        const key = (p.region ?? "").toLowerCase().trim();
        if (!key) return;
        if (!byRegion[key]) byRegion[key] = [];
        byRegion[key].push(p);
      });

      Object.entries(byRegion).forEach(([regionKey, regionPts]) => {
        const coords = REGION_COORDS[regionKey];
        if (!coords) return;
        const n     = regionPts.length;
        const color = "#0a9182";
        L.circle(coords, {
          color, fillColor: color, fillOpacity: 0.15, weight: 2,
          radius: Math.sqrt(n) * 3500,
        })
          .addTo(layerGroupRef.current)
          .bindPopup(`<strong>${regionPts[0].region}</strong><br>Patients : <b>${n}</b>`);
        L.marker(coords, {
          icon: L.divIcon({
            className: "",
            html: `<div style="background:${color};color:white;font-family:sans-serif;font-size:11px;font-weight:700;padding:2px 7px;border-radius:100px;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${n}</div>`,
            iconAnchor: [0, 0],
          }),
        }).addTo(layerGroupRef.current).bindTooltip(regionPts[0].region ?? "", { direction: "top" });
      });

      pts.forEach(p => {
        const coords = resolveRegion(p.region);
        if (!coords) return;
        const lat  = coords[0] + jLat(p.id);
        const lng  = coords[1] + jLng(p.id);
        const col  = p.actif ? "#0a9182" : "#9ca3af";
        const age  = calcAge(p.dateNaissance);
        const popup = `
          <div style="font-family:sans-serif;min-width:155px;line-height:1.5">
            <strong>${p.prenom ?? ""} ${p.nom ?? ""}</strong>
            <br><span style="color:#888;font-size:11px">${p.numPatient ?? ""}${age ? ` · ${age} ans` : ""}</span>
            ${p.commune ? `<br><span style="font-size:11px">${p.commune}, ${p.region ?? ""}</span>` : ""}
            <br><span style="font-size:10px;color:${col}">${p.actif ? "● Actif" : "○ Inactif"}</span>
          </div>`;
        L.circleMarker([lat, lng], {
          radius: 6, color: col, fillColor: col, fillOpacity: 0.85, weight: 2,
        })
          .addTo(layerGroupRef.current)
          .bindPopup(popup);
        count++;
      });

    // ── Layer : hôpitaux (données réelles, fallback hardcodé) ─────────────
    } else if (layer === "hopitaux") {
      const withCoords = hops.filter(h => h.latitude != null && h.longitude != null);
      const toRender   = withCoords.length > 0 ? withCoords : HOPITAUX_FALLBACK;

      toRender.forEach(h => {
        const isPrivee  = h.typeEtablissement === "PRIVEE";
        const bgColor   = isPrivee ? "#7050bc" : "#1254a0";
        const typeLabel = isPrivee ? "Privé" : "Public";
        const popup = `
          <div style="font-family:sans-serif;min-width:160px;line-height:1.6">
            <strong style="font-size:13px">${h.nom ?? "Hôpital"}</strong>
            <br><span style="color:#888;font-size:11px">${typeLabel}</span>
            ${h.telephone ? `<br><span style="font-size:11px">📞 ${h.telephone}</span>` : ""}
            <br><span style="color:#aaa;font-size:10px">${Number(h.latitude).toFixed(4)}, ${Number(h.longitude).toFixed(4)}</span>
          </div>`;
        L.marker([h.latitude, h.longitude], {
          icon: L.divIcon({
            className: "",
            html: `<div style="background:${bgColor};color:white;font-weight:700;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-size:13px">H</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14],
          }),
        }).addTo(layerGroupRef.current)
          .bindPopup(popup)
          .bindTooltip(h.nom ?? "Hôpital", { direction: "top" });
        count++;
      });

    // ── Layer : médecins ──────────────────────────────────────────────────
    } else if (layer === "medecins") {
      meds.filter(m => resolveRegion(m.adresse?.region) !== null).forEach(m => {
        const base  = resolveRegion(m.adresse?.region);
        const lat   = base[0] + jLat(m.id);
        const lng   = base[1] + jLng(m.id);
        const color = m.disponible ? "#7050bc" : "#bcaae6";
        const popup = `
          <div style="font-family:sans-serif;min-width:170px;line-height:1.5">
            <strong style="font-size:13px">Dr. ${m.prenom ?? ""} ${m.nom ?? ""}</strong>
            ${m.specialite    ? `<br><span style="color:#555;font-size:11px">${m.specialite}</span>` : ""}
            ${m.section       ? `<span style="color:#888;font-size:11px"> · ${m.section}</span>` : ""}
            ${m.etablissement ? `<br><span style="color:#1254a0;font-size:11px">🏥 ${m.etablissement}</span>` : ""}
            ${m.adresse?.commune ? `<br><span style="color:#aaa;font-size:10px">${m.adresse.commune}, ${m.adresse.region}</span>` : ""}
            <br><span style="font-size:10px;color:${m.disponible ? "#17935a" : "#9ca3af"}">${m.disponible ? "● Disponible" : "○ Indisponible"}</span>
          </div>`;
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="background:${color};color:white;font-weight:700;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.25);font-size:10px;font-family:sans-serif">Dr</div>`,
            iconSize: [26, 26], iconAnchor: [13, 13],
          }),
        }).addTo(layerGroupRef.current)
          .bindPopup(popup)
          .bindTooltip(`Dr. ${m.prenom ?? ""} ${m.nom ?? ""}`, { direction: "top" });
        count++;
      });

    // ── Layer : zones à risque (statique) ─────────────────────────────────
    } else {
      const zones = [
        { name: "Dakar — Médina",    lat: 14.694, lng: -17.443, col: "#c93535", r: 8000  },
        { name: "Pikine/Guédiawaye", lat: 14.773, lng: -17.391, col: "#e07228", r: 10000 },
        { name: "Kaolack",           lat: 14.152, lng: -16.074, col: "#e07228", r: 9000  },
        { name: "Thiès",             lat: 14.789, lng: -16.924, col: "#d4c820", r: 7000  },
        { name: "Saint-Louis",       lat: 16.019, lng: -16.489, col: "#d4c820", r: 6000  },
      ];
      zones.forEach(z => {
        L.circle([z.lat, z.lng], { color: z.col, fillColor: z.col, fillOpacity: 0.22, weight: 2, radius: z.r })
          .addTo(layerGroupRef.current)
          .bindPopup(`<strong>${z.name}</strong>`);
        count++;
      });
    }

    return count;
  };

  // Message affiché sous la carte quand aucun marqueur n'est placé
  const emptyMessages = {
    patients: "Aucun patient géolocalisé — la région doit être renseignée dans le profil patient pour apparaître sur la carte.",
    medecins: "Aucun médecin géolocalisé — la région d'adresse doit être renseignée dans le profil médecin.",
    hopitaux: null, // fallback hardcodé, toujours des marqueurs
    risque:   null,
  };

  return (
    <div>
      <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.borderLight}` }}>
        {loadError ? (
          <div style={{ height: 440, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fef2f2", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>⚠️</span>
            <span style={{ fontSize: "0.85rem", color: "#b91c1c", fontWeight: 600 }}>Impossible de charger la carte</span>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Vérifiez votre connexion Internet (Leaflet.js via unpkg.com)</span>
          </div>
        ) : !leafletLoaded ? (
          <div style={{ height: 440, display: "flex", alignItems: "center", justifyContent: "center", background: C.primaryPale, fontSize: "0.85rem", color: C.textMid }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block", width: 20, height: 20, border: `2px solid ${C.border}`, borderTopColor: C.primary, borderRadius: "50%", marginRight: "0.6rem" }} />
            Chargement de la carte…
          </div>
        ) : null}
        <div ref={mapRef} style={{ width: "100%", height: 440, display: leafletLoaded && !loadError ? "block" : "none" }} />
      </div>

      {/* Message quand aucun marqueur n'est placé pour la couche active */}
      {leafletLoaded && !loadError && markerCount === 0 && emptyMessages[mapLayer] && (
        <div style={{ marginTop: "0.5rem", padding: "0.6rem 1rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: "0.78rem", color: "#92400e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>ℹ️</span>
          {emptyMessages[mapLayer]}
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
