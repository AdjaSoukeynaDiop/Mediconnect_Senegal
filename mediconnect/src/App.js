// import { useState, useEffect, useRef, useCallback } from "react";
// import React from 'react';

// /* ─── LEAFLET CSS injection ─── */
// const leafletCSS = `
//   .leaflet-container { font-family: 'Outfit', sans-serif; z-index: 1; }
//   .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); font-family: 'Outfit', sans-serif; }
//   .leaflet-control-zoom a { font-family: sans-serif; }
// `;

// /* ─── ICONS ─── */
// const Icon = ({ d, size = 20, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
//     <path d={d} />
//   </svg>
// );
// const I = {
//   heart:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
//   video:"M23 7l-7 5 7 5V7z M1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
//   file:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
//   shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
//   map:"M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16",
//   bell:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
//   user:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
//   users:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
//   calendar:"M3 9h18 M16 2v4 M8 2v4 M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
//   activity:"M22 12h-4l-3 9L9 3l-3 9H2",
//   lock:"M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4",
//   mail:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
//   eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
//   eyeOff:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22",
//   chevR:"M9 18l6-6-6-6",
//   check:"M20 6L9 17l-5-5",
//   x:"M18 6L6 18 M6 6l12 12",
//   plus:"M12 5v14 M5 12h14",
//   clipboard:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z",
//   phone:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
//   arrowR:"M5 12h14 M12 5l7 7-7 7",
//   arrowL:"M19 12H5 M12 19l-7-7 7-7",
//   trending:"M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
//   award:"M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
//   zap:"M13 2L3 14h9l-1 8 10-12h-9l1-8z",
//   wifi:"M1.42 9a16 16 0 0 1 21.16 0 M5 12.55a11 11 0 0 1 14.08 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01",
//   globe:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
//   trash:"M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
//   refresh:"M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15",
//   download:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
//   settings:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
//   messageSquare:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
//   cpu:"M9 4h6 M9 20h6 M4 9v6 M20 9v6 M9 9h6v6H9z",
//   barChart:"M18 20V10 M12 20V4 M6 20v-6",
//   pieChart:"M21.21 15.89A10 10 0 1 1 8 2.83 M22 12A10 10 0 0 0 12 2v10z",
//   layers:"M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
//   key:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
//   smartphone:"M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z M12 18h.01",
// };

// /* ─── COLORS ─── */
// const C = {
//   primary:"#0d7a6e", primaryDark:"#065f52", primaryDeep:"#044840",
//   primaryLight:"#14a896", primaryPale:"#e6f7f5", primaryMid:"#0a8f82",
//   accent:"#1ecb88", accentWarm:"#f0a500",
//   surface:"#ffffff", surfaceAlt:"#f8fdfc", bg:"#f2fbf9",
//   text:"#0c2826", textMid:"#2a5e58", textLight:"#6a9e98",
//   border:"#cce9e5", borderLight:"#e4f4f1",
//   danger:"#c93535", warning:"#e07228",
// };
// const F = { title:"'Bricolage Grotesque', sans-serif", body:"'Outfit', sans-serif" };

// /* ─── GLOBAL CSS ─── */
// const globalCSS = `
//   @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Outfit:wght@300;400;500;600&display=swap');
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   html{scroll-behavior:smooth;}
//   body{font-family:${F.body};background:${C.bg};color:${C.text};min-height:100vh;}
//   button{font-family:inherit;cursor:pointer;border:none;}
//   input,textarea,select{font-family:inherit;}
//   ::selection{background:${C.primaryPale};color:${C.primaryDark};}
//   ::-webkit-scrollbar{width:6px;}
//   ::-webkit-scrollbar-track{background:transparent;}
//   ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}
//   @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
//   @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
//   @keyframes spin{to{transform:rotate(360deg)}}
//   @keyframes ecgDraw{from{stroke-dashoffset:300}to{stroke-dashoffset:0}}
//   @keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
//   @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
//   .fade-up-1{animation:fadeUp 0.6s ease 0.1s both;}
//   .fade-up-2{animation:fadeUp 0.6s ease 0.2s both;}
//   .fade-up-3{animation:fadeUp 0.6s ease 0.3s both;}
//   .fade-up-4{animation:fadeUp 0.6s ease 0.4s both;}
//   table{width:100%;border-collapse:collapse;}
//   thead tr{background:${C.bg};}
//   th{padding:0.6rem 0.9rem;text-align:left;font-size:0.67rem;font-weight:600;color:${C.textLight};text-transform:uppercase;letter-spacing:0.07em;}
//   td{padding:0.68rem 0.9rem;border-bottom:1px solid ${C.borderLight};vertical-align:middle;font-size:0.8rem;}
//   tbody tr{cursor:pointer;transition:background .12s;}
//   tbody tr:hover{background:${C.primaryPale};}
//   tbody tr:last-child td{border-bottom:none;}
//   ${leafletCSS}
// `;

// /* ─── DATA ─── */
// const PATIENTS = [
//   {id:"PAT-00412",nom:"Mamadou Faye",age:"54",sexe:"M",patho:"Hypertension",statut:"urgent",visite:"14/05/2026",tension:"148/92",fc:"78",col:"#0a9182",init:"MF",region:"Dakar",commune:"Médina",assurance:"CNAM Sénégal",medecin:"Dr. R. Diallo",atcdMed:"HTA, DT2 depuis 2018",allergies:"Pénicilline",traitement:"Amlodipine 5mg",lat:14.6937,lng:-17.4441},
//   {id:"PAT-00398",nom:"Fatou Sène",age:"41",sexe:"F",patho:"Diabète T2",statut:"actif",visite:"13/05/2026",tension:"122/78",fc:"72",col:"#1660a8",init:"FS",region:"Thiès",commune:"Thiès Nord",assurance:"IPRES",medecin:"Dr. A. Ndiaye",atcdMed:"DT2 depuis 2021",allergies:"Aucune",traitement:"Metformine 500mg",lat:14.7886,lng:-16.9240},
//   {id:"PAT-00375",nom:"Ibrahima Ba",age:"63",sexe:"M",patho:"Insuff. cardiaque",statut:"actif",visite:"10/05/2026",tension:"130/85",fc:"68",col:"#7050bc",init:"IB",region:"Saint-Louis",commune:"Sor",assurance:"Privée",medecin:"Dr. R. Diallo",atcdMed:"IC depuis 2019",allergies:"Aspirine",traitement:"Furosémide 40mg",lat:16.0194,lng:-16.4891},
//   {id:"PAT-00362",nom:"Aïssatou Diop",age:"35",sexe:"F",patho:"Arythmie",statut:"actif",visite:"09/05/2026",tension:"118/76",fc:"82",col:"#d97030",init:"AD",region:"Dakar",commune:"Guédiawaye",assurance:"Aucune",medecin:"Dr. R. Diallo",atcdMed:"Arythmie supraventriculaire",allergies:"Aucune",traitement:"Bisoprolol 5mg",lat:14.777,lng:-17.3756},
//   {id:"PAT-00341",nom:"Moussa Diallo",age:"49",sexe:"M",patho:"HTA + DT2",statut:"urgent",visite:"08/05/2026",tension:"155/98",fc:"88",col:"#c93535",init:"MD",region:"Kaolack",commune:"Kaolack",assurance:"CNAM Sénégal",medecin:"Dr. B. Fall",atcdMed:"HTA sévère, DT2",allergies:"Codéine",traitement:"Losartan 100mg",lat:14.1525,lng:-16.0738},
//   {id:"PAT-00318",nom:"Rokhaya Cissé",age:"58",sexe:"F",patho:"Coronaropathie",statut:"actif",visite:"07/05/2026",tension:"126/82",fc:"65",col:"#17935a",init:"RC",region:"Dakar",commune:"Plateau",assurance:"IPRES",medecin:"Dr. R. Diallo",atcdMed:"Coronaropathie, stent 2020",allergies:"Aucune",traitement:"Aspirine 75mg",lat:14.6866,lng:-17.438},
//   {id:"PAT-00305",nom:"Cheikh Ndoye",age:"44",sexe:"M",patho:"Cholestérol",statut:"stable",visite:"05/05/2026",tension:"120/80",fc:"70",col:"#0a7c6e",init:"CN",region:"Diourbel",commune:"Touba",assurance:"Aucune",medecin:"Dr. A. Ndiaye",atcdMed:"Dyslipidémie",allergies:"Aucune",traitement:"Statines 20mg",lat:14.862,lng:-15.881},
//   {id:"PAT-00290",nom:"Mariama Sarr",age:"29",sexe:"F",patho:"Tachycardie",statut:"actif",visite:"02/05/2026",tension:"110/72",fc:"98",col:"#7050bc",init:"MS",region:"Dakar",commune:"Rufisque",assurance:"Privée",medecin:"Dr. R. Diallo",atcdMed:"Tachycardie sinusale",allergies:"Aucune",traitement:"Propranolol 10mg",lat:14.7153,lng:-17.2729},
// ];

// const REGIONS = [
//   {name:"Dakar",patients:118,urgents:8,lat:14.693,lng:-17.444},{name:"Thiès",patients:34,urgents:2,lat:14.789,lng:-16.924},
//   {name:"Saint-Louis",patients:22,urgents:1,lat:16.019,lng:-16.489},{name:"Diourbel",patients:18,urgents:1,lat:14.655,lng:-16.236},
//   {name:"Kaolack",patients:21,urgents:3,lat:14.152,lng:-16.074},{name:"Fatick",patients:12,urgents:0,lat:14.339,lng:-16.411},
//   {name:"Kaffrine",patients:9,urgents:1,lat:14.106,lng:-15.551},{name:"Tambacounda",patients:14,urgents:1,lat:13.77,lng:-13.667},
//   {name:"Ziguinchor",patients:13,urgents:2,lat:12.565,lng:-16.272},{name:"Kolda",patients:11,urgents:1,lat:12.898,lng:-14.951},
//   {name:"Louga",patients:10,urgents:0,lat:15.619,lng:-16.224},{name:"Matam",patients:5,urgents:0,lat:15.659,lng:-13.255},
//   {name:"Kédougou",patients:6,urgents:0,lat:12.556,lng:-12.175},{name:"Sédhiou",patients:7,urgents:0,lat:12.708,lng:-15.557},
// ];

// const RDV_DATA = [
//   {date:"18/05/2026",heure:"08:30",patient:"Mamadou Faye",id:"PAT-00412",medecin:"Dr. R. Diallo",type:"Présentiel",motif:"Suivi HTA",statut:"confirme"},
//   {date:"18/05/2026",heure:"10:15",patient:"Aïssatou Diop",id:"PAT-00362",medecin:"Dr. R. Diallo",type:"Vidéo",motif:"Arythmie",statut:"video"},
//   {date:"18/05/2026",heure:"11:00",patient:"Rokhaya Cissé",id:"PAT-00318",medecin:"Dr. R. Diallo",type:"Présentiel",motif:"Bilan coronarien",statut:"attente"},
//   {date:"19/05/2026",heure:"09:30",patient:"Fatou Sène",id:"PAT-00398",medecin:"Dr. A. Ndiaye",type:"Présentiel",motif:"Suivi DT2",statut:"confirme"},
//   {date:"20/05/2026",heure:"14:00",patient:"Cheikh Ndoye",id:"PAT-00305",medecin:"Dr. A. Ndiaye",type:"Vidéo",motif:"Suivi cholestérol",statut:"video"},
//   {date:"21/05/2026",heure:"10:00",patient:"Moussa Diallo",id:"PAT-00341",medecin:"Dr. B. Fall",type:"Urgence",motif:"Tension élevée",statut:"urgent"},
// ];

// const ECG_DATA = [
//   {patient:"Mamadou Faye",id:"PAT-00412",date:"14/05/2026",fc:"78 bpm",resultat:"HVG probable · Rythme sinusal",confiance:"94%",statut:"analyse"},
//   {patient:"Ibrahima Ba",id:"PAT-00375",date:"10/05/2026",fc:"68 bpm",resultat:"Normal — aucune anomalie",confiance:"97%",statut:"normal"},
//   {patient:"Moussa Diallo",id:"PAT-00341",date:"08/05/2026",fc:"88 bpm",resultat:"Fibrillation auriculaire",confiance:"91%",statut:"anomalie"},
//   {patient:"Rokhaya Cissé",id:"PAT-00318",date:"07/05/2026",fc:"65 bpm",resultat:"Normal post-stenting",confiance:"96%",statut:"normal"},
//   {patient:"Aïssatou Diop",id:"PAT-00362",date:"09/05/2026",fc:"82 bpm",resultat:"Tachycardie supraventriculaire",confiance:"89%",statut:"anomalie"},
// ];

// const ORDO_DATA = [
//   {num:"ORD-2026-0412",patient:"Mamadou Faye",id:"PAT-00412",medecin:"Dr. R. Diallo",meds:["Amlodipine 5mg · 1cp/j · 30j","Ramipril 5mg · 1cp/j · 30j"],date:"14/05/2026",statut:"signee"},
//   {num:"ORD-2026-0398",patient:"Fatou Sène",id:"PAT-00398",medecin:"Dr. A. Ndiaye",meds:["Metformine 500mg · 2cp/j · 60j"],date:"13/05/2026",statut:"expiree"},
//   {num:"ORD-2026-0375",patient:"Ibrahima Ba",id:"PAT-00375",medecin:"Dr. R. Diallo",meds:["Furosémide 40mg · 1cp/j","Aldactone 25mg · 1cp/j"],date:"10/05/2026",statut:"signee"},
//   {num:"ORD-2026-0341",patient:"Moussa Diallo",id:"PAT-00341",medecin:"Dr. B. Fall",meds:["Losartan 100mg · 1cp/j · 30j"],date:"08/05/2026",statut:"signee"},
// ];

// const CONST_DATA = [
//   {patient:"Mamadou Faye",id:"PAT-00412",date:"14/05/2026 09:45",infirmier:"A. Ndiaye",ta:"148/92",fc:78,spo2:97,temp:37.2,poids:84,imc:28.4},
//   {patient:"Fatou Sène",id:"PAT-00398",date:"13/05/2026 10:12",infirmier:"A. Ndiaye",ta:"122/78",fc:72,spo2:98,temp:36.9,poids:65,imc:24.1},
//   {patient:"Ibrahima Ba",id:"PAT-00375",date:"10/05/2026 08:30",infirmier:"A. Ndiaye",ta:"130/85",fc:68,spo2:96,temp:37.0,poids:78,imc:26.8},
//   {patient:"Moussa Diallo",id:"PAT-00341",date:"08/05/2026 14:00",infirmier:"A. Ndiaye",ta:"155/98",fc:88,spo2:95,temp:37.4,poids:92,imc:30.1},
//   {patient:"Rokhaya Cissé",id:"PAT-00318",date:"07/05/2026 11:20",infirmier:"A. Ndiaye",ta:"126/82",fc:65,spo2:98,temp:36.8,poids:62,imc:23.5},
// ];

// const ALERTES = [
//   {level:"rouge",msg:"Tension critique — Mamadou Faye · 148/92 mmHg",desc:"Surveillance immédiate. ECG recommandé.",time:"Il y a 2h",source:"Constantes"},
//   {level:"rouge",msg:"FA détectée — Moussa Diallo · 67 ans",desc:"ECG du 08/05 : FA confirmée par IA (91%). Cardiologue notifié.",time:"Il y a 4h",source:"ECG / IA"},
//   {level:"orange",msg:"Ordonnance expirée — Fatou Sène",desc:"Metformine 500mg expirée depuis 3 jours. Renouvellement requis.",time:"Hier 14:30",source:"Ordonnances"},
//   {level:"orange",msg:"Tension élevée persistante — Moussa Diallo",desc:"3 mesures consécutives > 150 mmHg sur 7 jours.",time:"Hier 09:15",source:"Constantes"},
//   {level:"orange",msg:"SpO₂ basse — Ibrahima Ba",desc:"93% relevée lors de la dernière prise. Surveillance rapprochée.",time:"Il y a 3 jours",source:"Constantes"},
//   {level:"jaune",msg:"RDV confirmé — Ibrahima Ba",desc:"Consultation cardiologie le 18/05 à 09:00 avec Dr. Diallo.",time:"Aujourd'hui 08:15",source:"Agenda"},
// ];

// const TRANSFERTS = [
//   {patient:"Ibrahima Ba",id:"PAT-00375",source:"HGGY — Cardiologie",dest:"CHU de Fann",type:"Programmé",motif:"Bilan complémentaire IC sévère",date:"16/05/2026",statut:"en_cours"},
//   {patient:"Moussa Diallo",id:"PAT-00341",source:"HGGY — Cardiologie",dest:"Hôpital Principal",type:"Urgent",motif:"HTA réfractaire avec poussée aiguë",date:"15/05/2026",statut:"complete"},
//   {patient:"Aïssatou Diop",id:"PAT-00362",source:"Centre de santé Thiès",dest:"HGGY — Cardiologie",type:"Contre-référence",motif:"Arythmie supraventriculaire récidivante",date:"09/05/2026",statut:"complete"},
//   {patient:"Cheikh Ndoye",id:"PAT-00305",source:"HGGY — Cardiologie",dest:"HR de Thiès",type:"Programmé",motif:"Suivi dyslipidémie — retour domicile",date:"05/05/2026",statut:"planifie"},
// ];

// const CONSULT_DATA = [
//   {date:"14/05/2026",patient:"Mamadou Faye",id:"PAT-00412",medecin:"Dr. R. Diallo",type:"Présentiel",diag:"I10 — HTA essentielle"},
//   {date:"13/05/2026",patient:"Fatou Sène",id:"PAT-00398",medecin:"Dr. A. Ndiaye",type:"Présentiel",diag:"E11 — DT2 sans complication"},
//   {date:"10/05/2026",patient:"Ibrahima Ba",id:"PAT-00375",medecin:"Dr. R. Diallo",type:"Présentiel",diag:"I50.9 — Insuff. cardiaque"},
//   {date:"09/05/2026",patient:"Aïssatou Diop",id:"PAT-00362",medecin:"Dr. R. Diallo",type:"Vidéo",diag:"I49.4 — Arythmie supraventri."},
//   {date:"08/05/2026",patient:"Moussa Diallo",id:"PAT-00341",medecin:"Dr. B. Fall",type:"Urgence",diag:"I10 + E11 — HTA + DT2"},
// ];

// /* ─── SHARED COMPONENTS ─── */
// const ToastCtx = React.createContext(() => {});
// const useToast = () => React.useContext(ToastCtx);

// const ToastContext = ({ children }) => {
//   const [toasts, setToasts] = useState([]);
//   const showToast = useCallback((msg, type = "success") => {
//     const id = Date.now();
//     setToasts(t => [...t, { id, msg, type }]);
//     setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
//   }, []);
//   return (
//     <ToastCtx.Provider value={showToast}>
//       {children}
//       <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 300, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
//         {toasts.map(t => (
//           <div key={t.id} style={{
//             display: "flex", alignItems: "center", gap: "0.6rem",
//             padding: "0.72rem 1.1rem", borderRadius: 12, fontSize: "0.82rem", fontWeight: 500,
//             background: t.type === "success" ? "#17935a" : t.type === "warning" ? C.warning : C.danger,
//             color: "white", boxShadow: "0 8px 28px rgba(0,0,0,0.2)", animation: "toastIn 0.25s ease",
//           }}>
//             <Icon d={t.type === "success" ? I.check : I.bell} size={15} stroke="white" sw={2.5} />
//             {t.msg}
//           </div>
//         ))}
//       </div>
//     </ToastCtx.Provider>
//   );
// };

// const Modal = ({ open, onClose, title, children, footer, width = 560 }) => {
//   if (!open) return null;
//   return (
//     <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
//       position: "fixed", inset: 0, background: "rgba(6,46,41,0.55)", backdropFilter: "blur(5px)",
//       zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
//     }}>
//       <div style={{ background: "white", borderRadius: 20, width, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto", boxShadow: "0 28px 72px rgba(0,0,0,0.2)" }}>
//         <div style={{ padding: "1.3rem 1.6rem 1rem", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "white", zIndex: 2, borderRadius: "20px 20px 0 0" }}>
//           <span style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1rem", color: C.text }}>{title}</span>
//           <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: C.textLight, cursor: "pointer" }}>
//             <Icon d={I.x} size={14} sw={2} />
//           </button>
//         </div>
//         <div style={{ padding: "1.3rem 1.6rem" }}>{children}</div>
//         {footer && <div style={{ padding: "0.9rem 1.6rem 1.3rem", borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "flex-end", gap: "0.7rem" }}>{footer}</div>}
//       </div>
//     </div>
//   );
// };

// const Btn = ({ children, variant = "primary", size = "md", onClick, style = {}, icon, full = false, disabled = false }) => {
//   const [hov, setHov] = useState(false);
//   const pad = size === "lg" ? "0.85rem 1.8rem" : size === "sm" ? "0.42rem 0.9rem" : "0.62rem 1.3rem";
//   const fs = size === "lg" ? "1rem" : size === "sm" ? "0.78rem" : "0.85rem";
//   const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", borderRadius: 10, fontWeight: 600, transition: "all 0.18s", width: full ? "100%" : undefined, cursor: disabled ? "not-allowed" : "pointer", fontFamily: F.title, padding: pad, fontSize: fs, opacity: disabled ? 0.6 : 1 };
//   const v = {
//     primary: { background: hov ? C.primaryDark : C.primary, color: "white", boxShadow: hov ? `0 6px 20px ${C.primary}55` : `0 2px 8px ${C.primary}33`, transform: hov ? "translateY(-1px)" : "none" },
//     outline: { background: hov ? C.primaryPale : "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, transform: hov ? "translateY(-1px)" : "none" },
//     ghost: { background: hov ? C.primaryPale : "transparent", color: C.textMid },
//     white: { background: hov ? "rgba(255,255,255,0.95)" : "white", color: C.primaryDark, boxShadow: hov ? "0 6px 20px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.08)", transform: hov ? "translateY(-1px)" : "none" },
//     danger: { background: hov ? "#a82828" : C.danger, color: "white" },
//   };
//   return (
//     <button style={{ ...base, ...v[variant], ...style }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={disabled ? undefined : onClick}>
//       {icon && <Icon d={icon} size={15} />}
//       {children}
//     </button>
//   );
// };

// const Tag = ({ children, color = C.primary }) => (
//   <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.22rem 0.7rem", borderRadius: 100, background: `${color}18`, color, fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.02em", fontFamily: F.title, whiteSpace: "nowrap" }}>{children}</span>
// );

// const Badge = ({ children, variant = "teal" }) => {
//   const colors = { teal: [C.primaryPale, C.primary], green: ["#e5f7ef", "#17935a"], orange: ["#fff0e6", C.warning], red: ["#fdeaea", C.danger], blue: ["#e6f3fc", "#1254a0"], gray: [C.bg, C.textMid], purple: ["#ede8ff", "#7050bc"] };
//   const [bg, col] = colors[variant] || colors.teal;
//   return <span style={{ display: "inline-flex", alignItems: "center", padding: "0.15rem 0.55rem", borderRadius: 100, fontSize: "0.67rem", fontWeight: 600, background: bg, color: col, whiteSpace: "nowrap" }}>{children}</span>;
// };

// const ECGLine = ({ width = 300, color = "#14a896", opacity = 0.4 }) => (
//   <svg width={width} height={40} viewBox={`0 0 ${width} 40`} style={{ overflow: "visible" }}>
//     <polyline points={`0,20 20,20 40,5 50,35 60,20 90,20 110,5 120,35 130,20 160,20 180,5 190,35 200,20 230,20 250,5 260,35 270,20 ${width},20`}
//       fill="none" stroke={color} strokeWidth="2" opacity={opacity} />
//   </svg>
// );

// const StatCard = ({ label, value, sub, color, icon, delta }) => (
//   <div style={{ background: "white", borderRadius: 16, padding: "1.2rem", border: `1px solid ${C.borderLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
//     <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
//       <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
//         <Icon d={icon} size={17} stroke={color} sw={1.8} />
//       </div>
//       <span style={{ fontSize: "0.72rem", color: C.textLight, fontWeight: 500 }}>{label}</span>
//     </div>
//     <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color }}>{value}</div>
//     <div style={{ fontSize: "0.7rem", color: delta?.up ? "#17935a" : C.textLight, marginTop: "0.2rem" }}>{sub}</div>
//   </div>
// );

// const InputField = ({ label, type = "text", value, onChange, placeholder, icon, required, options }) => {
//   const [focused, setFocused] = useState(false);
//   const [show, setShow] = useState(false);
//   const isPass = type === "password";
//   return (
//     <div style={{ marginBottom: "1rem" }}>
//       <label style={{ display: "block", fontWeight: 600, fontSize: "0.8rem", color: C.textMid, marginBottom: "0.35rem", fontFamily: F.title }}>
//         {label}{required && <span style={{ color: C.danger }}> *</span>}
//       </label>
//       <div style={{ position: "relative" }}>
//         {icon && <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Icon d={icon} size={15} stroke={focused ? C.primary : C.textLight} sw={1.8} /></div>}
//         {options ? (
//           <select value={value} onChange={onChange} style={{ width: "100%", padding: "0.68rem 0.85rem", borderRadius: 10, border: `1.5px solid ${focused ? C.primary : C.border}`, outline: "none", fontSize: "0.88rem", color: C.text, background: "white" }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
//             {options.map(o => <option key={o} value={o}>{o}</option>)}
//           </select>
//         ) : (
//           <input type={isPass ? (show ? "text" : "password") : type} value={value} onChange={onChange} placeholder={placeholder}
//             onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
//             style={{ width: "100%", padding: `0.68rem ${isPass ? "2.8rem" : "0.85rem"} 0.68rem ${icon ? "2.5rem" : "0.85rem"}`, borderRadius: 10, border: `1.5px solid ${focused ? C.primary : C.border}`, outline: "none", fontSize: "0.88rem", color: C.text, background: "white", transition: "border-color 0.15s", boxShadow: focused ? `0 0 0 3px ${C.primary}18` : "none" }} />
//         )}
//         {isPass && <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textLight }}>
//           <Icon d={show ? I.eyeOff : I.eye} size={15} sw={1.8} />
//         </button>}
//       </div>
//     </div>
//   );
// };

// const Card = ({ children, style = {} }) => (
//   <div style={{ background: "white", borderRadius: 16, border: `1px solid ${C.borderLight}`, overflow: "hidden", ...style }}>{children}</div>
// );
// const CardHead = ({ title, sub, action }) => (
//   <div style={{ padding: "1rem 1.2rem 0.8rem", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//     <div>
//       <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.9rem", color: C.text }}>{title}</div>
//       {sub && <div style={{ fontSize: "0.7rem", color: C.textLight, marginTop: "0.1rem" }}>{sub}</div>}
//     </div>
//     {action}
//   </div>
// );

// /* ════════════════════════════════════
//    MODALS (du doc 2 — versions enrichies)
// ════════════════════════════════════ */
// const ModalNouveauPatient = ({ open, onClose, toast }) => {
//   const [form, setForm] = useState({ nom: "", prenom: "", email: "", tel: "", region: "Dakar", sexe: "M", atcd: "", allergies: "", medecin: "Dr. R. Diallo", assurance: "CNAM Sénégal", consent: false });
//   const set = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));
//   const save = () => {
//     if (!form.nom || !form.prenom) { toast("Veuillez saisir nom et prénom", "warning"); return; }
//     if (!form.consent) { toast("Le consentement est obligatoire", "warning"); return; }
//     toast(`Patient ${form.prenom} ${form.nom} créé`, "success");
//     onClose();
//     setForm({ nom: "", prenom: "", email: "", tel: "", region: "Dakar", sexe: "M", atcd: "", allergies: "", medecin: "Dr. R. Diallo", assurance: "CNAM Sénégal", consent: false });
//   };
//   return (
//     <Modal open={open} onClose={onClose} title="Nouveau patient" width={580}
//       footer={<><Btn variant="outline" onClick={onClose}>Annuler</Btn><Btn onClick={save} icon={I.check}>Enregistrer</Btn></>}>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
//         <InputField label="Nom" value={form.nom} onChange={set("nom")} placeholder="Diallo" required />
//         <InputField label="Prénom" value={form.prenom} onChange={set("prenom")} placeholder="Aminata" required />
//       </div>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
//         <InputField label="Téléphone" type="tel" value={form.tel} onChange={set("tel")} placeholder="+221 77 000 00 00" icon={I.phone} />
//         <InputField label="Sexe" value={form.sexe} onChange={set("sexe")} options={["M", "F", "Autre"]} />
//       </div>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
//         <InputField label="Région" value={form.region} onChange={set("region")} options={["Dakar", "Thiès", "Saint-Louis", "Kaolack", "Diourbel", "Tambacounda", "Ziguinchor", "Kolda", "Matam", "Fatick", "Kaffrine", "Kédougou", "Louga", "Sédhiou"]} required />
//         <InputField label="Médecin référent" value={form.medecin} onChange={set("medecin")} options={["Dr. R. Diallo", "Dr. A. Ndiaye", "Dr. B. Fall"]} />
//       </div>
//       <InputField label="Antécédents médicaux" value={form.atcd} onChange={set("atcd")} placeholder="HTA, diabète…" />
//       <InputField label="Allergies" value={form.allergies} onChange={set("allergies")} placeholder="Pénicilline, aspirine…" />
//       <div style={{ background: C.primaryPale, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "0.8rem 1rem", marginTop: "0.5rem", display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
//         <input type="checkbox" checked={form.consent} onChange={e => setForm(f => ({ ...f, consent: e.target.checked }))} style={{ marginTop: 3, accentColor: C.primary }} />
//         <span style={{ fontSize: "0.77rem", color: C.textMid, lineHeight: 1.5 }}>Consentement accordé conformément à la loi sénégalaise n°2008-12.</span>
//       </div>
//     </Modal>
//   );
// };

// const ModalConstantes = ({ open, onClose, toast, patient }) => {
//   const [form, setForm] = useState({ sys: "", dia: "", fc: "", spo2: "", temp: "", poids: "", taille: "", obs: "" });
//   const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
//   const imc = form.poids && form.taille ? (form.poids / ((form.taille / 100) ** 2)).toFixed(1) : "—";
//   const highTA = parseInt(form.sys) > 140 || parseInt(form.dia) > 90;
//   const save = () => {
//     if (!form.sys || !form.dia) { toast("TA obligatoire", "warning"); return; }
//     toast("Constantes enregistrées", "success");
//     onClose();
//   };
//   return (
//     <Modal open={open} onClose={onClose} title={`Constantes — ${patient?.nom || "Patient"}`} width={520}
//       footer={<><Btn variant="outline" onClick={onClose}>Annuler</Btn><Btn onClick={save} icon={I.check}>Enregistrer</Btn></>}>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
//         {[["Tension systolique", "sys", "mmHg"], ["Tension diastolique", "dia", "mmHg"], ["Fréq. cardiaque", "fc", "bpm"], ["SpO₂", "spo2", "%"], ["Température", "temp", "°C"], ["Poids", "poids", "kg"], ["Taille", "taille", "cm"]].map(([lbl, key, unit]) => (
//           <div key={key}>
//             <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>{lbl}</label>
//             <div style={{ display: "flex", border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
//               <input type="number" value={form[key]} onChange={set(key)} style={{ flex: 1, border: "none", outline: "none", padding: "0.6rem 0.75rem", fontSize: "0.88rem", color: C.text }} />
//               <div style={{ padding: "0 0.65rem", background: C.bg, display: "flex", alignItems: "center", fontSize: "0.68rem", color: C.textLight, borderLeft: `1px solid ${C.borderLight}` }}>{unit}</div>
//             </div>
//           </div>
//         ))}
//         <div>
//           <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>IMC calculé</label>
//           <div style={{ padding: "0.6rem 0.75rem", border: `1.5px solid ${C.borderLight}`, borderRadius: 10, background: C.bg, fontSize: "0.88rem", color: C.textMid }}>{imc} kg/m²</div>
//         </div>
//       </div>
//       {highTA && (form.sys || form.dia) && (
//         <div style={{ background: "#fdeaea", border: "1px solid #f5bcbc", borderRadius: 10, padding: "0.7rem 0.9rem", marginTop: "0.75rem", fontSize: "0.78rem", color: C.danger }}>
//           ⚠ Tension artérielle élevée — une alerte sera générée automatiquement.
//         </div>
//       )}
//       <div style={{ marginTop: "0.75rem" }}>
//         <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>Observations</label>
//         <textarea value={form.obs} onChange={set("obs")} placeholder="Observations cliniques…" style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "0.65rem 0.85rem", fontSize: "0.85rem", resize: "vertical", minHeight: 64, outline: "none", fontFamily: F.body, color: C.text }} />
//       </div>
//     </Modal>
//   );
// };

// const ModalRDV = ({ open, onClose, toast, patient }) => {
//   const [form, setForm] = useState({ date: "", heure: "09:00", type: "Présentiel", medecin: "Dr. R. Diallo", motif: "" });
//   const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
//   const save = () => {
//     if (!form.date || !form.heure) { toast("Date et heure obligatoires", "warning"); return; }
//     toast(`RDV confirmé — ${form.date} à ${form.heure}`, "success");
//     onClose();
//   };
//   return (
//     <Modal open={open} onClose={onClose} title="Prendre un rendez-vous" width={460}
//       footer={<><Btn variant="outline" onClick={onClose}>Annuler</Btn><Btn onClick={save} icon={I.check}>Confirmer le RDV</Btn></>}>
//       {patient && <div style={{ background: C.bg, borderRadius: 10, padding: "0.6rem 0.9rem", marginBottom: "1rem", fontSize: "0.82rem", fontWeight: 500, color: C.text }}>Patient : <Tag>{patient.nom}</Tag></div>}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
//         <InputField label="Date" type="date" value={form.date} onChange={set("date")} required />
//         <InputField label="Heure" type="time" value={form.heure} onChange={set("heure")} required />
//       </div>
//       <InputField label="Type" value={form.type} onChange={set("type")} options={["Présentiel", "Vidéoconsultation", "Urgence"]} />
//       <InputField label="Médecin" value={form.medecin} onChange={set("medecin")} options={["Dr. R. Diallo — Cardiologue", "Dr. A. Ndiaye — Généraliste", "Dr. B. Fall — Interniste"]} />
//       <div>
//         <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>Motif</label>
//         <textarea value={form.motif} onChange={set("motif")} placeholder="Suivi HTA, bilan…" style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "0.65rem 0.85rem", fontSize: "0.85rem", resize: "vertical", minHeight: 56, outline: "none", fontFamily: F.body, color: C.text }} />
//       </div>
//     </Modal>
//   );
// };

// const ModalOrdonnance = ({ open, onClose, toast }) => {
//   const [meds, setMeds] = useState([{ med: "", posologie: "" }]);
//   const save = () => { toast("Ordonnance signée et transmise", "success"); onClose(); };
//   return (
//     <Modal open={open} onClose={onClose} title="Nouvelle ordonnance électronique" width={560}
//       footer={<><Btn variant="outline" onClick={onClose}>Annuler</Btn><Btn onClick={save} icon={I.check}>Signer & Émettre</Btn></>}>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
//         <InputField label="Patient" value="Mamadou Faye — PAT-00412" onChange={() => {}} options={["Mamadou Faye — PAT-00412", "Fatou Sène — PAT-00398", "Ibrahima Ba — PAT-00375"]} />
//         <InputField label="Médecin signataire" value="Dr. R. Diallo" onChange={() => {}} options={["Dr. R. Diallo", "Dr. A. Ndiaye", "Dr. B. Fall"]} />
//       </div>
//       <div style={{ marginBottom: "0.5rem", fontFamily: F.title, fontWeight: 600, fontSize: "0.8rem", color: C.textMid, textTransform: "uppercase", letterSpacing: "0.06em" }}>Médicaments</div>
//       {meds.map((m, i) => (
//         <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.5rem" }}>
//           <input value={m.med} onChange={e => setMeds(ms => ms.map((x, j) => j === i ? { ...x, med: e.target.value } : x))} placeholder="Médicament…" style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "0.62rem 0.85rem", fontSize: "0.85rem", outline: "none", fontFamily: F.body, color: C.text }} />
//           <input value={m.posologie} onChange={e => setMeds(ms => ms.map((x, j) => j === i ? { ...x, posologie: e.target.value } : x))} placeholder="1cp/j · 30 jours" style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "0.62rem 0.85rem", fontSize: "0.85rem", outline: "none", fontFamily: F.body, color: C.text }} />
//         </div>
//       ))}
//       <Btn variant="outline" size="sm" onClick={() => setMeds(m => [...m, { med: "", posologie: "" }])} icon={I.plus} style={{ marginBottom: "0.75rem" }}>Ajouter un médicament</Btn>
//     </Modal>
//   );
// };

// /* ════════════════════════════════════
//    LEAFLET MAP COMPONENT
// ════════════════════════════════════ */
// const LeafletMap = ({ mapLayer = "patients" }) => {
//   const mapRef = useRef(null);
//   const leafletRef = useRef(null);
//   const layerGroupRef = useRef(null);
//   const [leafletLoaded, setLeafletLoaded] = useState(false);

//   useEffect(() => {
//     if (!document.getElementById("leaflet-css-link")) {
//       const link = document.createElement("link");
//       link.id = "leaflet-css-link";
//       link.rel = "stylesheet";
//       link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
//       document.head.appendChild(link);
//     }
//     if (window.L) { setLeafletLoaded(true); return; }
//     const script = document.createElement("script");
//     script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
//     script.onload = () => setLeafletLoaded(true);
//     document.head.appendChild(script);
//   }, []);

//   useEffect(() => {
//     if (!leafletLoaded || !mapRef.current) return;
//     const L = window.L;
//     if (!leafletRef.current) {
//       leafletRef.current = L.map(mapRef.current, { center: [14.4974, -14.4524], zoom: 7, scrollWheelZoom: true });
//       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//         attribution: "© OpenStreetMap contributors", maxZoom: 18,
//       }).addTo(leafletRef.current);
//       layerGroupRef.current = L.layerGroup().addTo(leafletRef.current);
//     }
//     renderLayer(L, mapLayer);
//   }, [leafletLoaded, mapLayer]);

//   const renderLayer = (L, layer) => {
//     layerGroupRef.current.clearLayers();
//     if (layer === "patients") {
//       REGIONS.forEach(r => {
//         const color = r.urgents > 2 ? "#c93535" : r.urgents > 0 ? "#e07228" : "#0a9182";
//         L.circle([r.lat, r.lng], { color, fillColor: color, fillOpacity: 0.18, weight: 2, radius: Math.sqrt(r.patients) * 3000 })
//           .addTo(layerGroupRef.current)
//           .bindPopup(`<strong>${r.name}</strong><br>Patients : <b>${r.patients}</b><br>Urgents : <b>${r.urgents}</b>`);
//         L.marker([r.lat, r.lng], {
//           icon: L.divIcon({ className: "", html: `<div style="background:${color};color:white;font-family:sans-serif;font-size:11px;font-weight:700;padding:2px 7px;border-radius:100px;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${r.patients}</div>`, iconAnchor: [0, 0] })
//         }).addTo(layerGroupRef.current).bindTooltip(r.name, { direction: "top" });
//       });
//       PATIENTS.forEach(p => {
//         const col = p.statut === "urgent" ? "#c93535" : p.statut === "actif" ? "#0a9182" : "#17935a";
//         L.circleMarker([p.lat, p.lng], { radius: 7, color: col, fillColor: col, fillOpacity: 0.85, weight: 2 })
//           .addTo(layerGroupRef.current)
//           .bindPopup(`<div style="font-family:sans-serif;min-width:160px"><strong>${p.nom}</strong><br>${p.id} · ${p.age}a<br><b>${p.patho}</b><br>${p.tension} mmHg</div>`);
//       });
//     } else if (layer === "hopitaux") {
//       const hospitals = [
//         { name: "HGGY — Cardiologie", lat: 14.6938, lng: -17.4432, lits: 85 },
//         { name: "CHU de Fann", lat: 14.6851, lng: -17.4603, lits: 320 },
//         { name: "Hôpital Principal de Dakar", lat: 14.692, lng: -17.4498, lits: 450 },
//         { name: "HR de Thiès", lat: 14.7895, lng: -16.9235, lits: 120 },
//         { name: "HR de Saint-Louis", lat: 16.02, lng: -16.489, lits: 95 },
//         { name: "CHR de Kaolack", lat: 14.153, lng: -16.074, lits: 110 },
//         { name: "HR de Ziguinchor", lat: 12.565, lng: -16.272, lits: 80 },
//         { name: "CHR de Tambacounda", lat: 13.77, lng: -13.667, lits: 75 },
//       ];
//       hospitals.forEach(h => {
//         L.marker([h.lat, h.lng], {
//           icon: L.divIcon({ className: "", html: `<div style="background:#1254a0;color:white;font-weight:700;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-size:13px">H</div>`, iconSize: [28, 28], iconAnchor: [14, 14] })
//         }).addTo(layerGroupRef.current).bindPopup(`<strong>${h.name}</strong><br>${h.lits} lits`);
//       });
//     } else {
//       const zones = [
//         { name: "Dakar — Médina", lat: 14.694, lng: -17.443, col: "#c93535", r: 8000 },
//         { name: "Pikine/Guédiawaye", lat: 14.773, lng: -17.391, col: "#e07228", r: 10000 },
//         { name: "Kaolack", lat: 14.152, lng: -16.074, col: "#e07228", r: 9000 },
//         { name: "Thiès", lat: 14.789, lng: -16.924, col: "#d4c820", r: 7000 },
//         { name: "Saint-Louis", lat: 16.019, lng: -16.489, col: "#d4c820", r: 6000 },
//       ];
//       zones.forEach(z => {
//         L.circle([z.lat, z.lng], { color: z.col, fillColor: z.col, fillOpacity: 0.22, weight: 2, radius: z.r })
//           .addTo(layerGroupRef.current)
//           .bindPopup(`<strong>${z.name}</strong>`);
//       });
//     }
//   };

//   return (
//     <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.borderLight}` }}>
//       {!leafletLoaded && (
//         <div style={{ height: 440, display: "flex", alignItems: "center", justifyContent: "center", background: C.primaryPale, fontSize: "0.85rem", color: C.textMid }}>
//           <span style={{ animation: "spin 1s linear infinite", display: "inline-block", width: 20, height: 20, border: `2px solid ${C.border}`, borderTopColor: C.primary, borderRadius: "50%", marginRight: "0.6rem" }} />
//           Chargement de la carte…
//         </div>
//       )}
//       <div ref={mapRef} style={{ width: "100%", height: 440, display: leafletLoaded ? "block" : "none" }} />
//     </div>
//   );
// };

// /* ════════════════════════════════════
//    CARTOGRAPHIE PAGE (partagée)
// ════════════════════════════════════ */
// const PageCarto = ({ toast }) => {
//   const [mapLayer, setMapLayer] = useState("patients");
//   const maxPts = Math.max(...REGIONS.map(r => r.patients));
//   return (
//     <>
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//         <StatCard label="Régions couvertes" value="14" sub="100% des régions" color={C.primary} icon={I.map} delta={{ up: true }} />
//         <StatCard label="Patients géolocalisés" value="271" sub="95.4% du total" color="#1660a8" icon={I.users} />
//         <StatCard label="Zones à risque" value="3" sub="Densité HTA élevée" color={C.danger} icon={I.bell} />
//         <StatCard label="Hôpitaux partenaires" value="23" sub="Réseau national" color="#7050bc" icon={I.shield} delta={{ up: true }} />
//       </div>
//       <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
//         {[["patients","Répartition patients"],["hopitaux","Hôpitaux partenaires"],["risque","Zones à risque"]].map(([id, label]) => (
//           <button key={id} onClick={() => setMapLayer(id)} style={{
//             padding: "0.42rem 1rem", borderRadius: 9, border: `1px solid ${mapLayer === id ? C.primary : C.border}`,
//             background: mapLayer === id ? C.primaryPale : "white", color: mapLayer === id ? C.primary : C.textMid,
//             fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: F.title, transition: "all .14s"
//           }}>{label}</button>
//         ))}
//       </div>
//       <div style={{ marginBottom: "1.2rem" }}>
//         <LeafletMap mapLayer={mapLayer} />
//         <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", padding: "0.8rem 1rem", background: "white", border: `1px solid ${C.borderLight}`, borderTop: "none", borderRadius: "0 0 16px 16px" }}>
//           {[["#c93535","Tension critique (>160)"],["#e07228","HTA connue"],["#0a9182","Patient suivi"],["#1254a0","Hôpital partenaire"],["#7050bc","Zone densité élevée"]].map(([col, lbl]) => (
//             <div key={lbl} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.73rem", color: C.textMid }}>
//               <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, flexShrink: 0 }} />
//               {lbl}
//             </div>
//           ))}
//         </div>
//       </div>
//       <Card>
//         <CardHead title="Répartition par région" sub="Sénégal · 14 régions couvertes" action={<Btn size="sm" variant="outline" icon={I.download} onClick={() => toast("Export rapport", "success")}>Exporter</Btn>} />
//         <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
//           {REGIONS.map(r => (
//             <div key={r.name} style={{ background: C.surfaceAlt, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: "0.85rem 0.95rem" }}>
//               <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.82rem", color: C.text, marginBottom: "0.4rem" }}>{r.name}</div>
//               <div style={{ height: 4, borderRadius: 2, background: C.bg, marginBottom: "0.55rem" }}>
//                 <div style={{ height: "100%", width: `${(r.patients / maxPts * 100).toFixed(0)}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`, borderRadius: 2 }} />
//               </div>
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                 <div>
//                   <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1rem", color: C.primary }}>{r.patients}</div>
//                   <div style={{ fontSize: "0.62rem", color: C.textLight }}>patients</div>
//                 </div>
//                 {r.urgents > 0 ? <Badge variant="orange">{r.urgents} urgent{r.urgents > 1 ? "s" : ""}</Badge> : <Badge variant="green">Stable</Badge>}
//               </div>
//             </div>
//           ))}
//         </div>
//       </Card>
//     </>
//   );
// };

// /* ════════════════════════════════════
//    PAGES MÉDECIN (enrichies du doc 2)
// ════════════════════════════════════ */

// /* Page Patients avec side panel */
// const PagePatients = ({ toast }) => {
//   const [selected, setSelected] = useState(PATIENTS[0]);
//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState("tous");
//   const [modalNP, setModalNP] = useState(false);
//   const [modalConst, setModalConst] = useState(false);
//   const [modalRDV, setModalRDV] = useState(false);

//   const data = PATIENTS.filter(p =>
//     (!search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)) &&
//     (filter === "tous" || (filter === "urgent" && p.statut === "urgent") || (filter === "actif" && p.statut === "actif"))
//   );

//   return (
//     <>
//       <ModalNouveauPatient open={modalNP} onClose={() => setModalNP(false)} toast={toast} />
//       <ModalConstantes open={modalConst} onClose={() => setModalConst(false)} toast={toast} patient={selected} />
//       <ModalRDV open={modalRDV} onClose={() => setModalRDV(false)} toast={toast} patient={selected} />

//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//         <StatCard label="Total patients" value="284" sub="↑ +12 ce mois" color={C.primary} icon={I.users} delta={{ up: true }} />
//         <StatCard label="Dossiers actifs" value="217" sub="76% du total" color="#17935a" icon={I.check} delta={{ up: true }} />
//         <StatCard label="Alertes actives" value="2" sub="À traiter" color={C.danger} icon={I.bell} />
//         <StatCard label="RDV aujourd'hui" value="9" sub="3 restants" color="#1660a8" icon={I.calendar} />
//       </div>

//       <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.2rem", alignItems: "center" }}>
//         <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", background: "white", border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.45rem 0.85rem" }}>
//           <Icon d={I.eye} size={14} stroke={C.textLight} />
//           <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un patient…" style={{ border: "none", outline: "none", fontSize: "0.82rem", color: C.text, width: "100%", background: "transparent", fontFamily: F.body }} />
//         </div>
//         {["tous", "actif", "urgent"].map(f => (
//           <button key={f} onClick={() => setFilter(f)} style={{ padding: "0.4rem 0.85rem", borderRadius: 8, border: `1px solid ${filter === f ? C.primary : C.border}`, background: filter === f ? C.primaryPale : "white", color: filter === f ? C.primary : C.textMid, fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", fontFamily: F.body }}>
//             {f.charAt(0).toUpperCase() + f.slice(1)}
//           </button>
//         ))}
//         <Btn icon={I.plus} size="sm" onClick={() => setModalNP(true)}>Nouveau patient</Btn>
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.2rem" }}>
//         <Card>
//           <CardHead title="Liste des patients" sub={`${data.length} patient(s)`} />
//           <table>
//             <thead><tr><th>Patient</th><th>Âge/Sexe</th><th>Pathologie</th><th>Statut</th><th>Visite</th><th>Tension</th><th></th></tr></thead>
//             <tbody>
//               {data.map(p => (
//                 <tr key={p.id} onClick={() => setSelected(p)} style={{ background: selected.id === p.id ? C.primaryPale : undefined }}>
//                   <td><div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
//                     <div style={{ width: 32, height: 32, borderRadius: 9, background: p.col, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.72rem", fontFamily: F.title, flexShrink: 0 }}>{p.init}</div>
//                     <div><div style={{ fontSize: "0.82rem", fontWeight: 500, color: C.text }}>{p.nom}</div><div style={{ fontSize: "0.67rem", color: C.textLight }}>{p.id}</div></div>
//                   </div></td>
//                   <td style={{ fontSize: "0.78rem" }}>{p.age} ans · {p.sexe}</td>
//                   <td><Badge variant="gray">{p.patho}</Badge></td>
//                   <td><Badge variant={p.statut === "urgent" ? "red" : p.statut === "actif" ? "teal" : "green"}>{p.statut === "urgent" ? "Urgent" : p.statut === "actif" ? "Actif" : "Stable"}</Badge></td>
//                   <td style={{ fontSize: "0.76rem", color: C.textMid }}>{p.visite}</td>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.76rem", color: parseInt(p.tension) > 140 ? C.danger : C.text, fontWeight: parseInt(p.tension) > 140 ? 700 : 400 }}>{p.tension}</td>
//                   <td><div style={{ display: "flex", gap: "0.25rem" }}>
//                     {[{d: I.activity, action: () => { setSelected(p); setModalConst(true); }}, {d: I.calendar, action: () => { setSelected(p); setModalRDV(true); }}, {d: I.trash, action: () => toast(`Suppression de ${p.nom}`, "warning")}].map(({d, action}, idx) => (
//                       <button key={idx} onClick={e => { e.stopPropagation(); action(); }} style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMid }}>
//                         <Icon d={d} size={12} sw={2} />
//                       </button>
//                     ))}
//                   </div></td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>

//         {/* Side panel dossier */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
//           <Card>
//             <div style={{ padding: "1rem", background: `linear-gradient(135deg, ${C.primaryPale}, #e8f3fc)`, borderBottom: `1px solid ${C.borderLight}` }}>
//               <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.65rem" }}>
//                 <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${selected.col}, ${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "0.95rem", fontFamily: F.title }}>{selected.init}</div>
//                 <div>
//                   <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.95rem", color: C.text }}>{selected.nom}</div>
//                   <div style={{ fontSize: "0.72rem", color: C.textMid }}>N° {selected.id} · {selected.age} ans · {selected.sexe}</div>
//                 </div>
//               </div>
//               <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
//                 <Badge variant="red">{selected.patho}</Badge>
//                 {selected.statut === "urgent" && <Badge variant="orange">Urgent</Badge>}
//               </div>
//             </div>
//             <div style={{ padding: "0.9rem 1rem" }}>
//               {[["Assurance", selected.assurance], ["Médecin réf.", selected.medecin], ["Région", `${selected.region} · ${selected.commune}`], ["Antécédents", selected.atcdMed], ["Allergies", selected.allergies], ["Traitement", selected.traitement]].map(([k, v]) => (
//                 <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0.3rem 0", borderBottom: `1px solid ${C.borderLight}`, fontSize: "0.77rem" }}>
//                   <span style={{ color: C.textMid }}>{k}</span>
//                   <span style={{ fontWeight: 500, color: C.text, textAlign: "right", maxWidth: "55%" }}>{k === "Allergies" && v !== "Aucune" ? <Badge variant="red">{v}</Badge> : v}</span>
//                 </div>
//               ))}
//               <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
//                 <Btn variant="primary" size="sm" full onClick={() => setModalConst(true)}>Constantes</Btn>
//                 <Btn variant="outline" size="sm" full onClick={() => setModalRDV(true)}>RDV</Btn>
//               </div>
//             </div>
//           </Card>
//         </div>
//       </div>
//     </>
//   );
// };

// /* Page ECG avec canvas */
// const PageECG = ({ toast }) => {
//   const canvasRef = useRef(null);
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     canvas.width = canvas.offsetWidth;
//     const ctx = canvas.getContext("2d");
//     const W = canvas.width, H = 200;
//     ctx.clearRect(0, 0, W, H);
//     ctx.strokeStyle = "rgba(10,145,130,0.12)"; ctx.lineWidth = 0.8;
//     for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
//     for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
//     ctx.strokeStyle = "#17e8d4"; ctx.lineWidth = 1.8;
//     ctx.shadowColor = "rgba(23,232,212,0.4)"; ctx.shadowBlur = 4;
//     const mid = H / 2, ppb = W / 4;
//     const pts = [[0,0],[0.05,-0.02],[0.1,0.04],[0.15,-0.03],[0.18,0],[0.2,0.4],[0.22,-0.35],[0.26,0.9],[0.3,0],[0.35,-0.08],[0.4,-0.06],[0.45,0.15],[0.5,0.12],[0.55,0],[0.6,0],[1,0]];
//     ctx.beginPath();
//     let first = true;
//     for (let b = 0; b < 4; b++) {
//       for (const [t, v] of pts) {
//         const x = b * ppb + t * ppb + 20;
//         const y = mid - v * 70;
//         if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
//       }
//     }
//     ctx.stroke();
//   }, []);

//   return (
//     <>
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//         <StatCard label="ECG ce mois" value="89" sub="↑ +11" color={C.primary} icon={I.activity} delta={{ up: true }} />
//         <StatCard label="Analysés par IA" value="76" sub="85% du total" color="#7050bc" icon={I.zap} />
//         <StatCard label="Anomalies détectées" value="14" sub="Nécessitent attention" color={C.warning} icon={I.bell} />
//         <StatCard label="Normaux" value="62" sub="82%" color="#17935a" icon={I.check} delta={{ up: true }} />
//       </div>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.2rem" }}>
//         <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
//           <Card>
//             <CardHead title="Visualiseur ECG — Mamadou Faye" sub="PAT-00412 · 14/05/2026 10:32 · 12 dérivations"
//               action={<span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", borderRadius: 100, fontSize: "0.68rem", fontWeight: 600, background: "linear-gradient(135deg,#7050bc,#9c50e0)", color: "white" }}><Icon d={I.zap} size={11} stroke="white" sw={2} />Analyse IA</span>} />
//             <div style={{ padding: "1rem" }}>
//               <div style={{ background: C.primaryDeep, borderRadius: 14, padding: "1rem" }}>
//                 <canvas ref={canvasRef} style={{ width: "100%", height: 200, display: "block" }} height={200} />
//                 <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
//                   {[["FC","78 bpm"],["PR","162 ms"],["QRS","88 ms"],["QTc","425 ms"],["Axe","+45°"]].map(([k,v]) => (
//                     <span key={k} style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{k} : <span style={{ color: "#17e8d4", fontWeight: 500 }}>{v}</span></span>
//                   ))}
//                 </div>
//               </div>
//               <div style={{ marginTop: "0.9rem", padding: "0.85rem", background: "#ede8ff", borderRadius: 11, border: "1px solid #c9b8f0" }}>
//                 <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7050bc", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>Résultat IA (confiance 94.2%)</div>
//                 <div style={{ fontSize: "0.82rem", color: C.text }}>Rythme sinusal régulier. <strong>Hypertrophie ventriculaire gauche</strong> probable (indice de Sokolov-Lyon élevé). Pas d'ischémie aiguë.</div>
//                 <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem" }}><Badge variant="orange">HVG probable</Badge><Badge variant="green">Pas de FA</Badge><Badge variant="green">Pas d'ischémie</Badge></div>
//               </div>
//             </div>
//           </Card>
//           <Card>
//             <CardHead title="Liste des ECG récents" action={<Btn size="sm" icon={I.plus} onClick={() => toast("Import ECG ouvert", "success")}>Importer ECG</Btn>} />
//             <table>
//               <thead><tr><th>Patient</th><th>Date</th><th>FC</th><th>Résultat IA</th><th>Confiance</th><th>Statut</th></tr></thead>
//               <tbody>
//                 {ECG_DATA.map((e, i) => {
//                   const p = PATIENTS.find(x => x.id === e.id);
//                   return (
//                     <tr key={i}>
//                       <td><div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
//                         <div style={{ width: 28, height: 28, borderRadius: 8, background: p?.col || C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.65rem", fontFamily: F.title, flexShrink: 0 }}>{e.patient.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
//                         <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>{e.patient}</div>
//                       </div></td>
//                       <td style={{ fontFamily: "monospace", fontSize: "0.73rem" }}>{e.date}</td>
//                       <td style={{ fontFamily: "monospace", fontSize: "0.73rem" }}>{e.fc}</td>
//                       <td style={{ fontSize: "0.75rem" }}>{e.resultat}</td>
//                       <td><Badge variant="purple">{e.confiance}</Badge></td>
//                       <td>{e.statut === "anomalie" ? <Badge variant="red">Anomalie</Badge> : e.statut === "normal" ? <Badge variant="green">Normal</Badge> : <Badge variant="orange">Analysé</Badge>}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </Card>
//         </div>
//         <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
//           <Card>
//             <CardHead title="Performance IA" />
//             <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
//               {[["Sensibilité (FA)", 94.7, C.primary], ["Spécificité", 91.3, "#1660a8"], ["AUC-ROC", 96.3, "#7050bc"], ["Temps inférence", 63, "#17935a"]].map(([lbl, val, col]) => (
//                 <div key={lbl}>
//                   <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.3rem" }}>
//                     <span style={{ color: C.textMid }}>{lbl}</span>
//                     <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{lbl === "Temps inférence" ? "312 ms" : `${val}%`}</span>
//                   </div>
//                   <div style={{ height: 6, background: C.bg, borderRadius: 3 }}>
//                     <div style={{ height: "100%", width: `${val}%`, background: col, borderRadius: 3 }} />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </Card>
//           <Card>
//             <CardHead title="Pathologies détectées" sub="Ce mois · 14 anomalies" />
//             <div style={{ padding: "0.9rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
//               {[["Hypertrophie VG", 7, C.warning, 50], ["Fibrillation auriculaire", 4, C.danger, 29], ["Bloc de branche", 3, "#1660a8", 21]].map(([lbl, n, col, pct]) => (
//                 <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
//                   <span>{lbl}</span>
//                   <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                     <div style={{ width: 70, height: 5, background: C.bg, borderRadius: 3 }}><div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 3 }} /></div>
//                     <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{n}</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </Card>
//         </div>
//       </div>
//     </>
//   );
// };

// /* Page Ordonnances */
// const PageOrdonnances = ({ toast }) => {
//   const [modalOrdo, setModalOrdo] = useState(false);
//   return (
//     <>
//       <ModalOrdonnance open={modalOrdo} onClose={() => setModalOrdo(false)} toast={toast} />
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//         <StatCard label="Total ordonnances" value="203" sub="↑ +28 ce mois" color={C.primary} icon={I.clipboard} delta={{ up: true }} />
//         <StatCard label="Signées" value="198" sub="97.5% signées" color="#17935a" icon={I.check} delta={{ up: true }} />
//         <StatCard label="Expirées / à renouveler" value="8" sub="À renouveler" color={C.warning} icon={I.bell} />
//         <StatCard label="Téléchargées" value="167" sub="82% téléchargées" color="#1660a8" icon={I.download} />
//       </div>
//       <Card>
//         <CardHead title="Ordonnances électroniques" action={<Btn size="sm" icon={I.plus} onClick={() => setModalOrdo(true)}>Nouvelle ordonnance</Btn>} />
//         <table>
//           <thead><tr><th>N° Ordonnance</th><th>Patient</th><th>Médecin</th><th>Médicaments</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
//           <tbody>
//             {ORDO_DATA.map((o, i) => {
//               const p = PATIENTS.find(x => x.id === o.id);
//               return (
//                 <tr key={i}>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{o.num}</td>
//                   <td><div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
//                     <div style={{ width: 28, height: 28, borderRadius: 8, background: p?.col || C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.65rem", fontFamily: F.title, flexShrink: 0 }}>{o.patient.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
//                     <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>{o.patient}</div>
//                   </div></td>
//                   <td style={{ fontSize: "0.78rem" }}>{o.medecin}</td>
//                   <td><div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>{o.meds.map((m, j) => <div key={j} style={{ fontSize: "0.73rem", color: C.textMid }}><span style={{ color: C.primary }}>•</span> {m}</div>)}</div></td>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.73rem" }}>{o.date}</td>
//                   <td>{o.statut === "signee" ? <Badge variant="green">Signée</Badge> : <Badge variant="red">Expirée</Badge>}</td>
//                   <td><div style={{ display: "flex", gap: "0.25rem" }}>
//                     <button onClick={() => toast("Téléchargement PDF", "success")} style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.download} size={12} sw={2} /></button>
//                     {o.statut === "expiree" && <button onClick={() => toast("Renouvellement initié", "success")} style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.refresh} size={12} sw={2} /></button>}
//                   </div></td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </Card>
//     </>
//   );
// };

// /* Page Agenda */
// const PageAgenda = ({ toast }) => {
//   const [modalRDV, setModalRDV] = useState(false);
//   const statutCfg = { confirme: ["green","Confirmé"], attente: ["orange","En attente"], video: ["blue","Vidéo"], urgent: ["red","Urgent"] };
//   return (
//     <>
//       <ModalRDV open={modalRDV} onClose={() => setModalRDV(false)} toast={toast} />
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//         <StatCard label="Aujourd'hui" value="9" sub="3 restants" color="#1660a8" icon={I.calendar} />
//         <StatCard label="Cette semaine" value="34" sub="↑ +5 vs semaine passée" color={C.primary} icon={I.calendar} delta={{ up: true }} />
//         <StatCard label="Confirmés" value="28" sub="82% taux confirmation" color="#17935a" icon={I.check} delta={{ up: true }} />
//         <StatCard label="Vidéoconsultations" value="12" sub="35% du total" color="#1660a8" icon={I.video} />
//       </div>
//       <Card>
//         <CardHead title="Agenda des rendez-vous" sub="Semaine du 18 au 24 mai 2026"
//           action={<div style={{ display: "flex", gap: "0.5rem" }}>
//             <Btn variant="outline" size="sm">← Préc.</Btn>
//             <Btn variant="outline" size="sm">Suiv. →</Btn>
//             <Btn size="sm" icon={I.plus} onClick={() => setModalRDV(true)}>Nouveau RDV</Btn>
//           </div>} />
//         <table>
//           <thead><tr><th>Date & Heure</th><th>Patient</th><th>Médecin</th><th>Type</th><th>Motif</th><th>Statut</th><th>Actions</th></tr></thead>
//           <tbody>
//             {RDV_DATA.map((r, i) => {
//               const p = PATIENTS.find(x => x.id === r.id);
//               const [bv, bl] = statutCfg[r.statut] || ["gray", r.statut];
//               return (
//                 <tr key={i}>
//                   <td><span style={{ fontFamily: "monospace", fontSize: "0.74rem" }}>{r.date} <strong>{r.heure}</strong></span></td>
//                   <td><div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
//                     <div style={{ width: 30, height: 30, borderRadius: 8, background: p?.col || C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.68rem", fontFamily: F.title, flexShrink: 0 }}>{r.patient.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
//                     <span style={{ fontSize: "0.8rem" }}>{r.patient}</span>
//                   </div></td>
//                   <td style={{ fontSize: "0.78rem" }}>{r.medecin}</td>
//                   <td><Badge variant="gray">{r.type}</Badge></td>
//                   <td style={{ fontSize: "0.78rem" }}>{r.motif}</td>
//                   <td><Badge variant={bv}>{bl}</Badge></td>
//                   <td><div style={{ display: "flex", gap: "0.25rem" }}>
//                     <button onClick={() => toast("Dossier ouvert", "success")} style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.eye} size={12} sw={2} /></button>
//                     <button onClick={() => toast("RDV annulé", "warning")} style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.x} size={12} sw={2} /></button>
//                   </div></td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </Card>
//     </>
//   );
// };

// /* Page Constantes */
// const PageConstantes = ({ toast }) => {
//   const [modalConst, setModalConst] = useState(false);
//   return (
//     <>
//       <ModalConstantes open={modalConst} onClose={() => setModalConst(false)} toast={toast} patient={PATIENTS[0]} />
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//         <StatCard label="Tensions élevées" value="12" sub="Surveillance requise" color={C.danger} icon={I.activity} />
//         <StatCard label="Prises ce jour" value="34" sub="↑ +6 depuis hier" color="#17935a" icon={I.check} delta={{ up: true }} />
//         <StatCard label="Anomalies SpO₂" value="3" sub="< 94%" color={C.warning} icon={I.bell} />
//         <StatCard label="Prises ce mois" value="412" sub="↑ +48 vs mois passé" color="#1660a8" icon={I.trending} delta={{ up: true }} />
//       </div>
//       <Card>
//         <CardHead title="Historique des constantes" action={<Btn size="sm" icon={I.plus} onClick={() => setModalConst(true)}>Saisir constantes</Btn>} />
//         <table>
//           <thead><tr><th>Patient</th><th>Date & Heure</th><th>Infirmier</th><th>TA</th><th>FC</th><th>SpO₂</th><th>Temp.</th><th>Poids</th><th>IMC</th></tr></thead>
//           <tbody>
//             {CONST_DATA.map((c, i) => {
//               const p = PATIENTS.find(x => x.id === c.id);
//               const highTA = parseInt(c.ta) > 140;
//               return (
//                 <tr key={i}>
//                   <td><div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
//                     <div style={{ width: 28, height: 28, borderRadius: 8, background: p?.col || C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.65rem", fontFamily: F.title, flexShrink: 0 }}>{c.patient.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
//                     <span style={{ fontSize: "0.8rem" }}>{c.patient}</span>
//                   </div></td>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{c.date}</td>
//                   <td style={{ fontSize: "0.78rem" }}>{c.infirmier}</td>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.78rem", fontWeight: highTA ? 700 : 400, color: highTA ? C.danger : C.text }}>{c.ta}</td>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{c.fc}</td>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: c.spo2 < 94 ? C.danger : C.text }}>{c.spo2}%</td>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{c.temp}°C</td>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{c.poids} kg</td>
//                   <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: c.imc > 25 ? C.warning : "#17935a" }}>{c.imc}</td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </Card>
//     </>
//   );
// };

// /* Page Alertes interactive */
// const PageAlertes = ({ toast }) => {
//   const [alertes, setAlertes] = useState(ALERTES);
//   const colMap = { rouge: C.danger, orange: C.warning, jaune: C.accentWarm };
//   return (
//     <>
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//         <StatCard label="Critiques" value="2" sub="Action immédiate" color={C.danger} icon={I.bell} />
//         <StatCard label="Urgentes" value="5" sub="À traiter dans 24h" color={C.warning} icon={I.bell} />
//         <StatCard label="Informatives" value="11" sub="Pour information" color={C.primary} icon={I.bell} />
//         <StatCard label="Acquittées" value="47" sub="Ce mois" color="#17935a" icon={I.check} delta={{ up: true }} />
//       </div>
//       <Card>
//         <CardHead title="Alertes actives" sub={`${alertes.length} alerte(s)`}
//           action={<Btn variant="outline" size="sm" onClick={() => { setAlertes([]); toast("Toutes les alertes acquittées", "success"); }}>Tout acquitter</Btn>} />
//         {alertes.length === 0 ? (
//           <div style={{ padding: "2rem", textAlign: "center", color: C.textLight, fontSize: "0.85rem" }}>Aucune alerte active</div>
//         ) : alertes.map((a, i) => {
//           const col = colMap[a.level];
//           return (
//             <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem", padding: "0.9rem 1.2rem", borderBottom: i < alertes.length - 1 ? `1px solid ${C.borderLight}` : "none", borderLeft: `3px solid ${col}`, background: `${col}08` }}>
//               <div style={{ width: 36, height: 36, borderRadius: 10, background: `${col}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
//                 <Icon d={I.bell} size={18} stroke={col} sw={1.8} />
//               </div>
//               <div style={{ flex: 1 }}>
//                 <div style={{ fontSize: "0.84rem", fontWeight: 600, color: C.text, marginBottom: "0.2rem" }}>{a.msg}</div>
//                 <div style={{ fontSize: "0.75rem", color: C.textMid, marginBottom: "0.35rem" }}>{a.desc}</div>
//                 <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
//                   <span style={{ fontSize: "0.68rem", color: C.textLight }}>{a.time}</span>
//                   <Badge variant="gray">{a.source}</Badge>
//                 </div>
//               </div>
//               <Btn variant="outline" size="sm" onClick={() => { setAlertes(al => al.filter((_, j) => j !== i)); toast("Alerte acquittée", "success"); }}>Acquitter</Btn>
//             </div>
//           );
//         })}
//       </Card>
//     </>
//   );
// };

// /* Page Transferts */
// const PageTransferts = ({ toast }) => {
//   const statutCfg = { en_cours: ["orange","En cours"], complete: ["green","Complété"], planifie: ["blue","Planifié"] };
//   return (
//     <>
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//         <StatCard label="Transferts ce mois" value="18" sub="↑ +3 vs mois passé" color={C.primary} icon={I.arrowR} delta={{ up: true }} />
//         <StatCard label="En cours" value="4" sub="En transit" color={C.warning} icon={I.refresh} />
//         <StatCard label="Complétés" value="14" sub="77% complétés" color="#17935a" icon={I.check} delta={{ up: true }} />
//         <StatCard label="Urgences" value="2" sub="Transferts urgents" color={C.danger} icon={I.bell} />
//       </div>
//       <Card>
//         <CardHead title="Dossiers de transfert" action={<Btn size="sm" icon={I.plus} onClick={() => toast("Modal transfert ouvert", "success")}>Initier transfert</Btn>} />
//         <div style={{ padding: "0.75rem 1rem" }}>
//           {TRANSFERTS.map((t, i) => {
//             const [bv, bl] = statutCfg[t.statut] || ["gray", t.statut];
//             const p = PATIENTS.find(x => x.id === t.id);
//             return (
//               <div key={i} style={{ background: "white", border: `1px solid ${C.borderLight}`, borderRadius: 14, padding: "1.1rem 1.2rem", marginBottom: "0.85rem" }}>
//                 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.65rem" }}>
//                   <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
//                     <div style={{ width: 36, height: 36, borderRadius: 10, background: p?.col || C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "0.78rem", fontFamily: F.title, flexShrink: 0 }}>{p?.init || "??"}</div>
//                     <div>
//                       <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.88rem", color: C.text }}>{t.patient}</div>
//                       <div style={{ fontSize: "0.68rem", color: C.textLight, fontFamily: "monospace" }}>{t.id}</div>
//                     </div>
//                   </div>
//                   <div style={{ display: "flex", gap: "0.4rem" }}><Badge variant={bv}>{bl}</Badge><Badge variant="gray">{t.type}</Badge></div>
//                 </div>
//                 <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.5rem" }}>
//                   <span style={{ fontSize: "0.78rem", fontWeight: 500, background: C.bg, padding: "0.25rem 0.7rem", borderRadius: 7, color: C.text }}>{t.source}</span>
//                   <span style={{ color: C.primary }}>→</span>
//                   <span style={{ fontSize: "0.78rem", fontWeight: 500, background: C.bg, padding: "0.25rem 0.7rem", borderRadius: 7, color: C.text }}>{t.dest}</span>
//                 </div>
//                 <div style={{ fontSize: "0.74rem", color: C.textMid, marginBottom: "0.6rem" }}><strong>Motif :</strong> {t.motif} · <strong>Date :</strong> {t.date}</div>
//                 <div style={{ display: "flex", gap: "0.5rem" }}>
//                   <Btn variant="outline" size="sm" onClick={() => toast("CR ouvert", "success")}>Voir CR</Btn>
//                   {t.statut === "en_cours" && <Btn size="sm" onClick={() => toast("Transfert complété", "success")}>Marquer complété</Btn>}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </Card>
//     </>
//   );
// };

// /* Page Paramètres avec toggles */
// const PageParametresMedecin = ({ toast }) => {
//   const [settings, setSettings] = useState({ mfa: true, alertesCrit: true, sms: true, rappels: true, rapports: false, sync: true, cache: true, compress: true });
//   const toggle = k => setSettings(s => ({ ...s, [k]: !s[k] }));
//   const Toggle = ({ on, onChange }) => (
//     <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 22, background: on ? C.primary : C.border, position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
//       <div style={{ position: "absolute", width: 16, height: 16, borderRadius: "50%", background: "white", top: 3, left: on ? 21 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
//     </div>
//   );
//   const Section = ({ title, children }) => (
//     <Card style={{ marginBottom: "1.2rem" }}>
//       <div style={{ padding: "0.9rem 1.2rem", background: C.bg, borderBottom: `1px solid ${C.borderLight}` }}>
//         <span style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.88rem", color: C.text }}>{title}</span>
//       </div>
//       {children}
//     </Card>
//   );
//   const Row = ({ label, sub, right }) => (
//     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.2rem", borderBottom: `1px solid ${C.borderLight}` }}>
//       <div><div style={{ fontSize: "0.83rem", fontWeight: 500, color: C.text }}>{label}</div>{sub && <div style={{ fontSize: "0.72rem", color: C.textLight, marginTop: "0.1rem" }}>{sub}</div>}</div>
//       {right}
//     </div>
//   );
//   return (
//     <>
//       <Section title="Profil utilisateur">
//         <Row label="Nom complet" sub="Dr. A. Diallo — Cardiologue · HGGY" right={<Btn size="sm" variant="outline">Modifier</Btn>} />
//         <Row label="Email" sub="a.diallo@hggy.sn" right={<Btn size="sm" variant="outline">Modifier</Btn>} />
//         <Row label="Mot de passe" sub="Dernière modification : 12/01/2026" right={<Btn size="sm" variant="outline">Changer</Btn>} />
//         <Row label="Authentification MFA" sub="Requis pour tous les professionnels de santé (obligatoire)" right={<Toggle on={settings.mfa} onChange={() => toggle("mfa")} />} />
//       </Section>
//       <Section title="Notifications & Alertes">
//         <Row label="Alertes critiques (temps réel)" sub="Push notifications pour tensions > 160 mmHg" right={<Toggle on={settings.alertesCrit} onChange={() => toggle("alertesCrit")} />} />
//         <Row label="Alertes SMS de secours" sub="En cas d'absence de connexion internet" right={<Toggle on={settings.sms} onChange={() => toggle("sms")} />} />
//         <Row label="Rappels rendez-vous" sub="24h et 1h avant chaque RDV" right={<Toggle on={settings.rappels} onChange={() => toggle("rappels")} />} />
//         <Row label="Rapports hebdomadaires" sub="Résumé automatique envoyé chaque lundi" right={<Toggle on={settings.rapports} onChange={() => toggle("rapports")} />} />
//       </Section>
//       <Section title="Mode hors-ligne (Offline-First)">
//         <Row label="Synchronisation automatique" sub="Sync au retour de connexion · Dernière sync : 18/05/2026 09:14" right={<Toggle on={settings.sync} onChange={() => toggle("sync")} />} />
//         <Row label="Cache local des dossiers" sub="Stockage IndexedDB · 47 MB utilisés" right={<Toggle on={settings.cache} onChange={() => toggle("cache")} />} />
//         <Row label="Compression données ECG" sub="Réduction bande passante pour réseaux 2G/3G" right={<Toggle on={settings.compress} onChange={() => toggle("compress")} />} />
//       </Section>
//       <Section title="Conformité & Sécurité">
//         <Row label="Journal d'audit" sub="Toutes les actions enregistrées (Loi n°2008-12)" right={<Badge variant="green">Actif</Badge>} />
//         <Row label="Chiffrement TLS 1.3" sub="Données en transit" right={<Badge variant="green">Actif</Badge>} />
//         <Row label="Chiffrement AES-256" sub="Données au repos" right={<Badge variant="green">Actif</Badge>} />
//         <Row label="Version plateforme" sub="MediConnect Sénégal v2.0 — SIPREC-SEN" right={<Btn size="sm" variant="outline" onClick={() => toast("À jour — v2.0.1", "success")}>Vérifier MAJ</Btn>} />
//       </Section>
//     </>
//   );
// };

// /* ════════════════════════════════════
//    ADMIN DASHBOARD — COMPLET (du doc 1)
// ════════════════════════════════════ */
// const AdminDashboard = ({ setPage }) => {
//   const [active, setActive] = useState("accueil");
//   const toast = useToast();

//   const nav = [
//     { id: "accueil", label: "Vue d'ensemble", icon: I.pieChart },
//     { id: "utilisateurs", label: "Utilisateurs", icon: I.users },
//     { id: "etablissements", label: "Établissements", icon: I.layers },
//     { id: "cartographie", label: "Cartographie", icon: I.map },
//     { id: "statistiques", label: "Statistiques", icon: I.barChart },
//     { id: "securite", label: "Sécurité & Audit", icon: I.shield },
//     { id: "parametres", label: "Paramètres", icon: I.settings },
//   ];

//   const users = [
//     { nom: "Dr. R. Diallo", role: "Médecin", spec: "Cardiologue", hopital: "HGGY", statut: "actif", init: "DR", col: "#d97030", lastLogin: "Aujourd'hui 09:12" },
//     { nom: "Dr. A. Ndiaye", role: "Médecin", spec: "Généraliste", hopital: "CS Médina", statut: "actif", init: "AN", col: "#1660a8", lastLogin: "Aujourd'hui 08:45" },
//     { nom: "Dr. B. Fall", role: "Médecin", spec: "Interniste", hopital: "HGGY", statut: "actif", init: "BF", col: "#7050bc", lastLogin: "Hier 17:30" },
//     { nom: "A. Ndiaye", role: "Infirmier(e)", spec: "Soins généraux", hopital: "HGGY", statut: "actif", init: "AN", col: "#17935a", lastLogin: "Aujourd'hui 07:55" },
//     { nom: "K. Fall", role: "Administrateur", spec: "Système", hopital: "SIPREC-SEN", statut: "actif", init: "KF", col: "#0a7c6e", lastLogin: "Aujourd'hui 10:01" },
//     { nom: "M. Sow", role: "Infirmier(e)", spec: "Cardiologie", hopital: "CHU Fann", statut: "inactif", init: "MS", col: "#6a9e98", lastLogin: "Il y a 5 jours" },
//   ];

//   const etabs = [
//     { nom: "HGGY — Cardiologie", type: "CHU", region: "Dakar", medecins: 8, patients: 142, statut: "actif" },
//     { nom: "CHU de Fann", type: "CHU", region: "Dakar", medecins: 24, patients: 320, statut: "actif" },
//     { nom: "Hôpital Principal", type: "HLD", region: "Dakar", medecins: 18, patients: 215, statut: "actif" },
//     { nom: "HR de Thiès", type: "CHR", region: "Thiès", medecins: 6, patients: 78, statut: "actif" },
//     { nom: "HR de Saint-Louis", type: "CHR", region: "Saint-Louis", medecins: 5, patients: 54, statut: "actif" },
//     { nom: "CHR de Kaolack", type: "CHR", region: "Kaolack", medecins: 4, patients: 43, statut: "actif" },
//   ];

//   const auditLogs = [
//     { action: "Connexion", user: "Dr. R. Diallo", ip: "192.168.1.42", date: "18/05/2026 09:12", type: "info" },
//     { action: "Création dossier", user: "A. Ndiaye", ip: "192.168.1.51", date: "18/05/2026 09:08", type: "success" },
//     { action: "Ordonnance signée", user: "Dr. R. Diallo", ip: "192.168.1.42", date: "18/05/2026 08:55", type: "success" },
//     { action: "Tentative connexion échouée", user: "Inconnu", ip: "41.82.145.200", date: "18/05/2026 08:30", type: "warning" },
//     { action: "Export données patient", user: "Dr. A. Ndiaye", ip: "192.168.1.63", date: "17/05/2026 17:42", type: "info" },
//     { action: "Modification paramètres", user: "K. Fall", ip: "192.168.1.10", date: "17/05/2026 15:20", type: "info" },
//   ];

//   return (
//     <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden" }}>
//       <aside style={{ width: 252, flexShrink: 0, background: `linear-gradient(170deg, ${C.primaryDeep} 0%, ${C.primaryDark} 50%, ${C.primary} 100%)`, display: "flex", flexDirection: "column", height: "100vh", boxShadow: "4px 0 20px rgba(0,0,0,0.1)" }}>
//         <div style={{ padding: "1.4rem 1.2rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.65rem" }}>
//           <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <Icon d={I.shield} size={18} stroke="#1ecb88" sw={2} />
//           </div>
//           <div>
//             <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "0.95rem", color: "white" }}>MediConnect</div>
//             <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Administration</div>
//           </div>
//         </div>
//         <div style={{ margin: "0.9rem", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.75rem 0.9rem" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
//             <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7050bc,#9c50e0)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.title, fontWeight: 800, color: "white", fontSize: "0.82rem" }}>KF</div>
//             <div>
//               <div style={{ fontWeight: 600, color: "white", fontSize: "0.82rem" }}>K. Fall</div>
//               <div style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.4)" }}>Super Administrateur</div>
//             </div>
//           </div>
//         </div>
//         <nav style={{ flex: 1, padding: "0.4rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.1rem", overflowY: "auto" }}>
//           {nav.map(n => (
//             <button key={n.id} onClick={() => setActive(n.id)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.58rem 0.7rem", borderRadius: 9, border: "none", background: active === n.id ? "rgba(255,255,255,0.14)" : "transparent", color: active === n.id ? "white" : "rgba(255,255,255,0.48)", fontSize: "0.82rem", fontWeight: active === n.id ? 600 : 400, cursor: "pointer", transition: "all 0.13s", width: "100%", textAlign: "left" }}>
//               <Icon d={n.icon} size={16} sw={1.8} />
//               {n.label}
//             </button>
//           ))}
//         </nav>
//         <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
//           <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", cursor: "pointer" }}>
//             <Icon d={I.arrowL} size={13} sw={2} /> Retour accueil
//           </button>
//         </div>
//       </aside>

//       <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
//         {active === "accueil" && (
//           <>
//             <div style={{ marginBottom: "1.8rem" }}>
//               <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text }}>Vue d'ensemble</h1>
//               <p style={{ color: C.textLight, fontSize: "0.85rem", marginTop: "0.2rem" }}>Administration SIPREC-SEN · 24 mai 2026</p>
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
//               <StatCard label="Utilisateurs actifs" value="47" sub="↑ +3 ce mois" color={C.primary} icon={I.users} delta={{ up: true }} />
//               <StatCard label="Établissements" value="23" sub="14 régions" color="#1660a8" icon={I.layers} delta={{ up: true }} />
//               <StatCard label="Patients total" value="284" sub="↑ +12 ce mois" color="#17935a" icon={I.user} delta={{ up: true }} />
//               <StatCard label="Alertes sécurité" value="1" sub="Connexion suspecte" color={C.danger} icon={I.shield} />
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem", marginBottom: "1.2rem" }}>
//               <Card>
//                 <CardHead title="Activité récente" sub="Journal d'audit système" />
//                 <div>
//                   {auditLogs.slice(0, 5).map((log, i) => (
//                     <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.65rem 1.2rem", borderBottom: i < 4 ? `1px solid ${C.borderLight}` : "none" }}>
//                       <div style={{ width: 7, height: 7, borderRadius: "50%", background: log.type === "success" ? "#17935a" : log.type === "warning" ? C.warning : C.textLight, flexShrink: 0 }} />
//                       <div style={{ flex: 1 }}>
//                         <div style={{ fontSize: "0.8rem", fontWeight: 500, color: C.text }}>{log.action}</div>
//                         <div style={{ fontSize: "0.68rem", color: C.textLight }}>{log.user} · {log.ip}</div>
//                       </div>
//                       <span style={{ fontSize: "0.67rem", color: C.textLight, whiteSpace: "nowrap" }}>{log.date}</span>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//               <Card>
//                 <CardHead title="Répartition utilisateurs" sub="Par rôle" />
//                 <div style={{ padding: "1rem 1.2rem" }}>
//                   {[["Médecins", 18, "#1660a8", 38], ["Infirmiers", 24, C.primary, 51], ["Administrateurs", 5, "#7050bc", 11]].map(([lbl, n, col, pct]) => (
//                     <div key={lbl} style={{ marginBottom: "0.85rem" }}>
//                       <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
//                         <span style={{ color: C.textMid }}>{lbl}</span>
//                         <span style={{ fontWeight: 600, color: C.text }}>{n} ({pct}%)</span>
//                       </div>
//                       <div style={{ height: 6, background: C.bg, borderRadius: 3 }}>
//                         <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 3, transition: "width 1s" }} />
//                       </div>
//                     </div>
//                   ))}
//                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
//                     <div style={{ background: C.primaryPale, borderRadius: 10, padding: "0.7rem", textAlign: "center" }}>
//                       <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.primary }}>94%</div>
//                       <div style={{ fontSize: "0.68rem", color: C.textMid }}>Taux d'activation MFA</div>
//                     </div>
//                     <div style={{ background: "#e5f7ef", borderRadius: 10, padding: "0.7rem", textAlign: "center" }}>
//                       <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: "#17935a" }}>99.8%</div>
//                       <div style={{ fontSize: "0.68rem", color: C.textMid }}>Disponibilité plateforme</div>
//                     </div>
//                   </div>
//                 </div>
//               </Card>
//             </div>
//           </>
//         )}

//         {active === "utilisateurs" && (
//           <>
//             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
//               <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Gestion des utilisateurs</h1>
//               <Btn icon={I.plus} onClick={() => toast("Formulaire nouveau utilisateur", "success")}>Nouvel utilisateur</Btn>
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//               <StatCard label="Total" value="47" sub="Utilisateurs inscrits" color={C.primary} icon={I.users} />
//               <StatCard label="Actifs" value="44" sub="93.6% du total" color="#17935a" icon={I.check} delta={{ up: true }} />
//               <StatCard label="MFA activé" value="44" sub="93.6% sécurisés" color="#1660a8" icon={I.shield} delta={{ up: true }} />
//               <StatCard label="Inactifs" value="3" sub="Désactivés" color={C.warning} icon={I.x} />
//             </div>
//             <Card>
//               <CardHead title="Liste des utilisateurs" sub={`${users.length} comptes affichés`} />
//               <table>
//                 <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Spécialité</th><th>Établissement</th><th>Statut</th><th>Dernière connexion</th><th>Actions</th></tr></thead>
//                 <tbody>
//                   {users.map((u, i) => (
//                     <tr key={i}>
//                       <td><div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
//                         <div style={{ width: 32, height: 32, borderRadius: 9, background: u.col, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.72rem", fontFamily: F.title, flexShrink: 0 }}>{u.init}</div>
//                         <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{u.nom}</span>
//                       </div></td>
//                       <td><Badge variant={u.role === "Administrateur" ? "purple" : u.role === "Médecin" ? "blue" : "teal"}>{u.role}</Badge></td>
//                       <td style={{ fontSize: "0.78rem", color: C.textMid }}>{u.spec}</td>
//                       <td style={{ fontSize: "0.78rem" }}>{u.hopital}</td>
//                       <td><Badge variant={u.statut === "actif" ? "green" : "gray"}>{u.statut === "actif" ? "Actif" : "Inactif"}</Badge></td>
//                       <td style={{ fontSize: "0.74rem", color: C.textLight }}>{u.lastLogin}</td>
//                       <td><div style={{ display: "flex", gap: "0.25rem" }}>
//                         <button onClick={() => toast("Compte modifié", "success")} style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.settings} size={12} sw={2} /></button>
//                         <button onClick={() => toast(`Compte ${u.statut === "actif" ? "désactivé" : "activé"}`, "warning")} style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={u.statut === "actif" ? I.x : I.check} size={12} sw={2} /></button>
//                       </div></td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </Card>
//           </>
//         )}

//         {active === "etablissements" && (
//           <>
//             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
//               <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text }}>Établissements partenaires</h1>
//               <Btn icon={I.plus} onClick={() => toast("Formulaire établissement", "success")}>Ajouter établissement</Btn>
//             </div>
//             <Card>
//               <CardHead title="Réseau hospitalier" sub="23 établissements · 14 régions" />
//               <table>
//                 <thead><tr><th>Établissement</th><th>Type</th><th>Région</th><th>Médecins</th><th>Patients suivis</th><th>Statut</th><th>Actions</th></tr></thead>
//                 <tbody>
//                   {etabs.map((e, i) => (
//                     <tr key={i}>
//                       <td style={{ fontWeight: 500, fontSize: "0.82rem" }}>{e.nom}</td>
//                       <td><Badge variant="blue">{e.type}</Badge></td>
//                       <td style={{ fontSize: "0.78rem" }}>{e.region}</td>
//                       <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{e.medecins}</td>
//                       <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{e.patients}</td>
//                       <td><Badge variant="green">Actif</Badge></td>
//                       <td><button onClick={() => toast("Établissement ouvert", "success")} style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.eye} size={12} sw={2} /></button></td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </Card>
//           </>
//         )}

//         {active === "cartographie" && <PageCarto toast={toast} />}

//         {active === "statistiques" && (
//           <>
//             <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text, marginBottom: "1.5rem" }}>Statistiques nationales</h1>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//               <StatCard label="Consultations / mois" value="1 247" sub="↑ +47 vs mois passé" color={C.primary} icon={I.activity} delta={{ up: true }} />
//               <StatCard label="ECG analysés" value="89" sub="85% par IA" color="#7050bc" icon={I.zap} delta={{ up: true }} />
//               <StatCard label="Ordonnances" value="203" sub="97.5% signées" color="#17935a" icon={I.clipboard} delta={{ up: true }} />
//               <StatCard label="Transferts" value="18" sub="↑ +3 ce mois" color="#1660a8" icon={I.arrowR} delta={{ up: true }} />
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
//               <Card>
//                 <CardHead title="Top pathologies" sub="Mai 2026" />
//                 <div style={{ padding: "1rem 1.2rem" }}>
//                   {[["Hypertension artérielle", 118, C.primary, 41], ["Diabète type 2", 76, "#1660a8", 27], ["Insuffisance cardiaque", 34, "#7050bc", 12], ["Arythmie", 28, C.warning, 10], ["Coronaropathie", 24, "#17935a", 8]].map(([lbl, n, col, pct]) => (
//                     <div key={lbl} style={{ marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
//                       <div style={{ flex: 1 }}>
//                         <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.25rem" }}>
//                           <span style={{ color: C.text }}>{lbl}</span><span style={{ fontWeight: 600 }}>{n} cas</span>
//                         </div>
//                         <div style={{ height: 5, background: C.bg, borderRadius: 3 }}>
//                           <div style={{ height: "100%", width: `${pct * 2.2}%`, background: col, borderRadius: 3 }} />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//               <Card>
//                 <CardHead title="Performance IA cardiologique" />
//                 <div style={{ padding: "1rem 1.2rem" }}>
//                   {[["Sensibilité FA", 94.7, C.primary], ["Spécificité", 91.3, "#1660a8"], ["AUC-ROC", 96.3, "#7050bc"], ["Précision HVG", 88.4, C.warning]].map(([lbl, val, col]) => (
//                     <div key={lbl} style={{ marginBottom: "0.8rem" }}>
//                       <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.28rem" }}>
//                         <span style={{ color: C.textMid }}>{lbl}</span>
//                         <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{val}%</span>
//                       </div>
//                       <div style={{ height: 5, background: C.bg, borderRadius: 3 }}>
//                         <div style={{ height: "100%", width: `${val}%`, background: col, borderRadius: 3 }} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//             </div>
//           </>
//         )}

//         {active === "securite" && (
//           <>
//             <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text, marginBottom: "1.5rem" }}>Sécurité & Journal d'audit</h1>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
//               <StatCard label="Événements aujourd'hui" value="142" sub="↑ +18 vs hier" color={C.primary} icon={I.activity} delta={{ up: true }} />
//               <StatCard label="Connexions réussies" value="38" sub="Utilisateurs actifs" color="#17935a" icon={I.check} delta={{ up: true }} />
//               <StatCard label="Tentatives échouées" value="3" sub="2 IP suspectes" color={C.warning} icon={I.x} />
//               <StatCard label="Alertes sécurité" value="1" sub="Action requise" color={C.danger} icon={I.shield} />
//             </div>
//             <Card>
//               <CardHead title="Journal d'audit complet" sub="Conformité loi n°2008-12" action={<Btn size="sm" variant="outline" icon={I.download} onClick={() => toast("Export journal", "success")}>Exporter</Btn>} />
//               <table>
//                 <thead><tr><th>Action</th><th>Utilisateur</th><th>Adresse IP</th><th>Date & Heure</th><th>Type</th></tr></thead>
//                 <tbody>
//                   {auditLogs.map((log, i) => (
//                     <tr key={i}>
//                       <td style={{ fontSize: "0.8rem", fontWeight: 500 }}>{log.action}</td>
//                       <td style={{ fontSize: "0.78rem" }}>{log.user}</td>
//                       <td style={{ fontFamily: "monospace", fontSize: "0.74rem" }}>{log.ip}</td>
//                       <td style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{log.date}</td>
//                       <td><Badge variant={log.type === "success" ? "green" : log.type === "warning" ? "red" : "gray"}>{log.type === "success" ? "Succès" : log.type === "warning" ? "Alerte" : "Info"}</Badge></td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </Card>
//           </>
//         )}

//         {active === "parametres" && (
//           <>
//             <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.4rem", color: C.text, marginBottom: "1.5rem" }}>Paramètres système</h1>
//             {[
//               { title: "Configuration générale", rows: [["Nom de la plateforme","MediConnect Sénégal"],["Version","v2.0.1 — SIPREC-SEN"],["Environnement","Production"],["Pays / région","Sénégal"]] },
//               { title: "Sécurité", rows: [["Chiffrement TLS","TLS 1.3 — Actif"],["Chiffrement données","AES-256 — Actif"],["MFA obligatoire","Oui — Tous profils médicaux"],["Durée session","8 heures"]] },
//               { title: "Intégrations", rows: [["HL7 FHIR","R4 — Connecté"],["CNAM Sénégal","API v2 — Actif"],["IPRES","API v1 — Actif"],["Système SMS","Orange Sénégal — Actif"]] },
//             ].map(sec => (
//               <Card key={sec.title} style={{ marginBottom: "1.2rem" }}>
//                 <div style={{ padding: "0.85rem 1.2rem", background: C.bg, borderBottom: `1px solid ${C.borderLight}` }}>
//                   <span style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.88rem", color: C.text }}>{sec.title}</span>
//                 </div>
//                 {sec.rows.map(([k, v]) => (
//                   <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1.2rem", borderBottom: `1px solid ${C.borderLight}` }}>
//                     <span style={{ fontSize: "0.82rem", color: C.text }}>{k}</span>
//                     <span style={{ fontSize: "0.8rem", fontWeight: 500, color: C.textMid }}>{v}</span>
//                   </div>
//                 ))}
//               </Card>
//             ))}
//           </>
//         )}
//       </main>
//     </div>
//   );
// };

// /* ════════════════════════════════════
//    AUTH LAYOUT
// ════════════════════════════════════ */
// const AuthLayout = ({ children, title, subtitle }) => (
//   <div style={{ minHeight: "100vh", display: "flex", background: `linear-gradient(135deg, ${C.primaryDeep} 0%, ${C.primaryDark} 50%, ${C.primary} 100%)`, position: "relative", overflow: "hidden" }}>
//     <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "4rem", position: "relative" }}>
//       <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, opacity: 0.15, pointerEvents: "none" }}><ECGLine width={700} color="white" opacity={1} /></div>
//       <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
//         <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.heart} size={22} stroke="white" sw={2} /></div>
//         <div><div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.15rem", color: "white" }}>MediConnect</div><div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Sénégal</div></div>
//       </div>
//       <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "2.4rem", color: "white", lineHeight: 1.2, letterSpacing: "-0.03em", maxWidth: 380 }}>{title}</h1>
//       <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 340, fontSize: "0.95rem" }}>{subtitle}</p>
//       <div style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
//         {[{ icon: I.shield, text: "Données chiffrées AES-256 & TLS 1.3" }, { icon: I.activity, text: "IA cardiologique certifiée" }, { icon: I.wifi, text: "Fonctionne en zones rurales (2G/3G)" }].map(item => (
//           <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
//             <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={item.icon} size={16} stroke="#1ecb88" sw={1.8} /></div>
//             <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{item.text}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//     <div style={{ width: 480, background: "white", display: "flex", flexDirection: "column", justifyContent: "center", padding: "3rem 2.5rem", overflow: "auto", boxShadow: "-20px 0 60px rgba(0,0,0,0.15)" }}>{children}</div>
//   </div>
// );

// /* ════════════════════════════════════
//    LOGIN PAGE
// ════════════════════════════════════ */
// const LoginPage = ({ setPage }) => {
//   const [role, setRole] = useState("patient");
//   const [email, setEmail] = useState("");
//   const [pass, setPass] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleLogin = () => {
//     setLoading(true);
//     setTimeout(() => {
//       setLoading(false);
//       if (role === "admin") setPage("dashboard_admin");
//       else if (role === "medecin" || role === "infirmier") setPage("dashboard_medecin");
//       else setPage("dashboard_patient");
//     }, 1200);
//   };

//   const roles = [
//     { id: "patient", label: "Patient", icon: I.user },
//     { id: "medecin", label: "Médecin", icon: I.activity },
//     { id: "infirmier", label: "Infirmier(e)", icon: I.heart },
//     { id: "admin", label: "Admin", icon: I.shield },
//   ];

//   return (
//     <AuthLayout title="Votre santé, notre priorité" subtitle="Connectez-vous à votre espace personnel sécurisé.">
//       <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.6rem", color: C.text, marginBottom: "0.3rem" }}>Connexion</h2>
//       <p style={{ color: C.textLight, fontSize: "0.85rem", marginBottom: "1.4rem" }}>
//         Pas encore inscrit ?{" "}
//         <button onClick={() => setPage("register")} style={{ background: "none", border: "none", color: C.primary, fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}>Créer un compte</button>
//       </p>
//       {role === "patient" && (
//         <div style={{ background: C.primaryPale, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "0.65rem 0.9rem", marginBottom: "1rem", fontSize: "0.77rem", color: C.textMid, lineHeight: 1.5 }}>
//           <strong style={{ color: C.primaryDark }}>Patients :</strong> votre dossier est créé par votre médecin ou infirmier. Contactez votre établissement si vous n'avez pas encore de compte.
//         </div>
//       )}
//       <div style={{ display: "flex", gap: "0.22rem", background: C.bg, borderRadius: 12, padding: "0.28rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
//         {roles.map(r => (
//           <button key={r.id} onClick={() => setRole(r.id)} style={{ flex: 1, padding: "0.5rem 0.5rem", borderRadius: 9, border: "none", background: role === r.id ? "white" : "transparent", color: role === r.id ? C.primary : C.textLight, fontWeight: role === r.id ? 700 : 500, fontSize: "0.75rem", boxShadow: role === r.id ? "0 1px 6px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", fontFamily: F.title }}>
//             <Icon d={r.icon} size={13} sw={2} />{r.label}
//           </button>
//         ))}
//       </div>
//       <InputField label="Adresse e-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.sn" icon={I.mail} required />
//       <InputField label="Mot de passe" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" icon={I.lock} required />
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
//         <div />
//         <button onClick={() => setPage("forgot-password")} style={{ background: "none", border: "none", color: C.primary, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>Mot de passe oublié ?</button>
//       </div>
//       {(role === "medecin" || role === "infirmier" || role === "admin") && (
//         <div style={{ background: `${C.primary}10`, border: `1px solid ${C.primary}30`, borderRadius: 10, padding: "0.7rem 1rem", marginBottom: "1.2rem", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
//           <Icon d={I.shield} size={15} stroke={C.primary} sw={1.8} />
//           <span style={{ fontSize: "0.77rem", color: C.primaryDark, lineHeight: 1.5 }}>Connexion sécurisée — une vérification MFA sera requise après validation.</span>
//         </div>
//       )}
//       <Btn full size="lg" onClick={handleLogin} style={{ marginBottom: "1rem" }}>
//         {loading ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Connexion…</span> : "Se connecter"}
//       </Btn>
//       <div style={{ textAlign: "center" }}>
//         <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: C.textLight, fontSize: "0.82rem", cursor: "pointer" }}>← Retour à l'accueil</button>
//       </div>
//     </AuthLayout>
//   );
// };

// /* ════════════════════════════════════
//    REGISTER PAGE (du doc 2)
// ════════════════════════════════════ */
// const RegisterPage = ({ setPage }) => {
//   const [role, setRole] = useState("patient");
//   const [step, setStep] = useState(1);
//   const [form, setForm] = useState({ nom: "", prenom: "", email: "", phone: "", pass: "", confirm: "", numOrdre: "", specialite: "", dob: "", region: "Dakar" });
//   const [loading, setLoading] = useState(false);
//   const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
//   const handleNext = () => {
//     if (step < 2) setStep(2);
//     else {
//       setLoading(true);
//       setTimeout(() => { setLoading(false); setPage("dashboard_" + role); }, 1200);
//     }
//   };
//   const specialites = ["Cardiologie", "Médecine générale", "Pédiatrie", "Gynécologie", "Chirurgie", "Radiologie", "Neurologie", "Pneumologie"];
//   return (
//     <AuthLayout title="Rejoignez MediConnect Sénégal" subtitle="Créez votre compte en quelques minutes.">
//       <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
//         <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text, flex: 1 }}>Inscription</h2>
//         <span style={{ fontSize: "0.75rem", color: C.textLight, background: C.bg, padding: "0.25rem 0.6rem", borderRadius: 100 }}>Étape {step}/2</span>
//       </div>
//       <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem" }}>
//         {[1, 2].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? C.primary : C.borderLight, transition: "background 0.3s" }} />)}
//       </div>
//       {step === 1 && (
//         <>
//           <p style={{ color: C.textLight, fontSize: "0.85rem", marginBottom: "1.4rem" }}>Déjà inscrit ? <button onClick={() => setPage("login")} style={{ background: "none", border: "none", color: C.primary, fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}>Se connecter</button></p>
//           <div style={{ display: "flex", background: C.bg, borderRadius: 12, padding: "0.3rem", marginBottom: "1.4rem", gap: "0.25rem" }}>
//             {[{ id: "patient", label: "Patient" }, { id: "medecin", label: "Médecin" }].map(r => (
//               <button key={r.id} onClick={() => setRole(r.id)} style={{ flex: 1, padding: "0.6rem", borderRadius: 9, border: "none", background: role === r.id ? "white" : "transparent", color: role === r.id ? C.primary : C.textLight, fontWeight: role === r.id ? 700 : 500, fontSize: "0.88rem", boxShadow: role === r.id ? "0 1px 6px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s", cursor: "pointer", fontFamily: F.title }}>{r.label}</button>
//             ))}
//           </div>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
//             <InputField label="Nom" value={form.nom} onChange={set("nom")} placeholder="Diallo" required />
//             <InputField label="Prénom" value={form.prenom} onChange={set("prenom")} placeholder="Aminata" required />
//           </div>
//           <InputField label="E-mail" type="email" value={form.email} onChange={set("email")} placeholder="vous@exemple.sn" icon={I.mail} required />
//           <InputField label="Téléphone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+221 7X XXX XX XX" icon={I.phone} required />
//         </>
//       )}
//       {step === 2 && (
//         <>
//           {role === "medecin" && (
//             <>
//               <InputField label="N° Ordre des médecins" value={form.numOrdre} onChange={set("numOrdre")} placeholder="SN-MED-XXXX" icon={I.award} required />
//               <InputField label="Spécialité" value={form.specialite} onChange={set("specialite")} options={["", ...specialites]} required />
//             </>
//           )}
//           {role === "patient" && (
//             <>
//               <InputField label="Date de naissance" type="date" value={form.dob} onChange={set("dob")} required />
//               <InputField label="Région" value={form.region} onChange={set("region")} options={["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Tambacounda", "Kolda", "Matam"]} />
//             </>
//           )}
//           <InputField label="Mot de passe" type="password" value={form.pass} onChange={set("pass")} placeholder="8+ caractères" icon={I.lock} required />
//           <InputField label="Confirmer le mot de passe" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Répétez le mot de passe" icon={I.lock} required />
//           <div style={{ background: C.primaryPale, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "0.8rem 1rem", marginBottom: "1.2rem" }}>
//             <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
//               <input type="checkbox" style={{ marginTop: 3, accentColor: C.primary }} />
//               <span style={{ fontSize: "0.78rem", color: C.textMid, lineHeight: 1.5 }}>J'accepte les <span style={{ color: C.primary, fontWeight: 600 }}>conditions d'utilisation</span> et la <span style={{ color: C.primary, fontWeight: 600 }}>politique de confidentialité</span>. Données protégées conformément à la loi n°2008-12.</span>
//             </div>
//           </div>
//         </>
//       )}
//       <div style={{ display: "flex", gap: "0.75rem" }}>
//         {step > 1 && <Btn variant="outline" onClick={() => setStep(step - 1)}>Retour</Btn>}
//         <Btn full={step === 1} size="lg" onClick={handleNext} style={{ flex: step > 1 ? 1 : undefined }}>
//           {loading ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Création…</span> : step === 1 ? "Continuer →" : "Créer mon compte"}
//         </Btn>
//       </div>
//       <div style={{ textAlign: "center", marginTop: "1rem" }}>
//         <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: C.textLight, fontSize: "0.82rem", cursor: "pointer" }}>← Retour à l'accueil</button>
//       </div>
//     </AuthLayout>
//   );
// };

// /* ════════════════════════════════════
//    FORGOT PASSWORD PAGE
// ════════════════════════════════════ */
// const ForgotPasswordPage = ({ setPage }) => {
//   const [method, setMethod] = useState("email");
//   const [contact, setContact] = useState("");
//   const [loading, setLoading] = useState(false);
//   const handleSend = () => {
//     if (!contact) return;
//     setLoading(true);
//     setTimeout(() => { setLoading(false); setPage("otp"); }, 1400);
//   };
//   return (
//     <AuthLayout title="Réinitialiser votre mot de passe" subtitle="Recevez un code de vérification par e-mail ou SMS.">
//       <div style={{ marginBottom: "1.5rem" }}>
//         <button onClick={() => setPage("login")} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", color: C.textMid, fontSize: "0.82rem", cursor: "pointer", marginBottom: "1.5rem" }}>
//           <Icon d={I.arrowL} size={14} sw={2} /> Retour à la connexion
//         </button>
//         <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.6rem", color: C.text, marginBottom: "0.4rem" }}>Mot de passe oublié</h2>
//         <p style={{ color: C.textLight, fontSize: "0.84rem", lineHeight: 1.6 }}>Choisissez comment recevoir votre code de vérification à 6 chiffres.</p>
//       </div>
//       <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
//         {[["email","E-mail",I.mail],["sms","SMS",I.smartphone]].map(([id, label, icon]) => (
//           <button key={id} onClick={() => { setMethod(id); setContact(""); }} style={{ flex: 1, padding: "0.75rem 0.5rem", borderRadius: 12, border: `2px solid ${method === id ? C.primary : C.border}`, background: method === id ? C.primaryPale : "white", color: method === id ? C.primary : C.textMid, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", cursor: "pointer", transition: "all .15s", fontFamily: F.title, fontWeight: 600, fontSize: "0.82rem" }}>
//             <Icon d={icon} size={20} stroke={method === id ? C.primary : C.textLight} sw={1.8} />
//             {label}
//           </button>
//         ))}
//       </div>
//       {method === "email" ? (
//         <InputField label="Adresse e-mail" type="email" value={contact} onChange={e => setContact(e.target.value)} placeholder="vous@exemple.sn" icon={I.mail} required />
//       ) : (
//         <InputField label="Numéro de téléphone" type="tel" value={contact} onChange={e => setContact(e.target.value)} placeholder="+221 77 000 00 00" icon={I.smartphone} required />
//       )}
//       <div style={{ background: C.bg, borderRadius: 12, padding: "0.85rem 1rem", marginBottom: "1.3rem", fontSize: "0.78rem", color: C.textMid, lineHeight: 1.6 }}>
//         {method === "email" ? "Un code à 6 chiffres sera envoyé à l'adresse e-mail associée à votre compte." : "Un SMS contenant un code à 6 chiffres sera envoyé au numéro associé à votre compte."}
//       </div>
//       <Btn full size="lg" onClick={handleSend} disabled={!contact} icon={method === "email" ? I.mail : I.smartphone}>
//         {loading ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Envoi en cours…</span> : `Envoyer le code par ${method === "email" ? "e-mail" : "SMS"}`}
//       </Btn>
//       <div style={{ textAlign: "center", marginTop: "1rem" }}>
//         <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: C.textLight, fontSize: "0.82rem", cursor: "pointer" }}>← Retour à l'accueil</button>
//       </div>
//     </AuthLayout>
//   );
// };

// /* ════════════════════════════════════
//    OTP PAGE
// ════════════════════════════════════ */
// const OTPPage = ({ setPage }) => {
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [newPass, setNewPass] = useState("");
//   const [confirmPass, setConfirmPass] = useState("");
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [countdown, setCountdown] = useState(60);
//   const inputRefs = useRef([]);

//   useEffect(() => {
//     if (countdown <= 0) return;
//     const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
//     return () => clearTimeout(timer);
//   }, [countdown]);

//   const handleOtpChange = (idx, val) => {
//     if (!/^\d?$/.test(val)) return;
//     const next = [...otp]; next[idx] = val; setOtp(next);
//     if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
//   };
//   const handleOtpKeyDown = (idx, e) => {
//     if (e.key === "Backspace" && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
//   };
//   const handleVerify = () => {
//     if (otp.join("").length < 6) return;
//     setLoading(true);
//     setTimeout(() => { setLoading(false); setStep(2); }, 1200);
//   };
//   const handleReset = () => {
//     if (!newPass || newPass !== confirmPass) return;
//     setLoading(true);
//     setTimeout(() => { setLoading(false); setPage("login"); }, 1400);
//   };

//   return (
//     <AuthLayout title="Vérification en deux étapes" subtitle={step === 1 ? "Saisissez le code reçu pour confirmer votre identité." : "Créez un nouveau mot de passe sécurisé."}>
//       <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.8rem" }}>
//         {[1, 2].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? C.primary : C.borderLight, transition: "background 0.3s" }} />)}
//       </div>
//       {step === 1 ? (
//         <>
//           <button onClick={() => setPage("forgot-password")} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", color: C.textMid, fontSize: "0.82rem", cursor: "pointer", marginBottom: "1.3rem" }}>
//             <Icon d={I.arrowL} size={14} sw={2} /> Retour
//           </button>
//           <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text, marginBottom: "0.4rem" }}>Saisir le code OTP</h2>
//           <p style={{ color: C.textLight, fontSize: "0.83rem", lineHeight: 1.6, marginBottom: "1.8rem" }}>Entrez le code à 6 chiffres envoyé. Ce code expire dans 10 minutes.</p>
//           <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", marginBottom: "1.5rem" }}>
//             {otp.map((digit, idx) => (
//               <input key={idx} ref={el => inputRefs.current[idx] = el} type="text" inputMode="numeric" maxLength={1} value={digit}
//                 onChange={e => handleOtpChange(idx, e.target.value)} onKeyDown={e => handleOtpKeyDown(idx, e)}
//                 style={{ width: 52, height: 58, textAlign: "center", fontSize: "1.5rem", fontWeight: 700, fontFamily: "monospace", border: `2px solid ${digit ? C.primary : C.border}`, borderRadius: 12, outline: "none", color: C.text, background: digit ? C.primaryPale : "white", transition: "all .15s", boxShadow: digit ? `0 0 0 3px ${C.primary}18` : "none" }} />
//             ))}
//           </div>
//           <div style={{ textAlign: "center", marginBottom: "1.3rem" }}>
//             {countdown > 0 ? (
//               <p style={{ fontSize: "0.82rem", color: C.textLight }}>Renvoyer le code dans <strong style={{ color: C.primary, fontFamily: "monospace" }}>{String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}</strong></p>
//             ) : (
//               <button onClick={() => setCountdown(60)} style={{ background: "none", border: "none", color: C.primary, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>Renvoyer le code</button>
//             )}
//           </div>
//           <Btn full size="lg" onClick={handleVerify} disabled={otp.some(d => d === "")}>
//             {loading ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Vérification…</span> : "Vérifier le code"}
//           </Btn>
//         </>
//       ) : (
//         <>
//           <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem", background: "#e5f7ef", borderRadius: 12, padding: "0.7rem 1rem" }}>
//             <Icon d={I.check} size={16} stroke="#17935a" sw={2.5} />
//             <span style={{ fontSize: "0.82rem", color: "#17935a", fontWeight: 600 }}>Code vérifié avec succès</span>
//           </div>
//           <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text, marginBottom: "0.4rem" }}>Nouveau mot de passe</h2>
//           <p style={{ color: C.textLight, fontSize: "0.83rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>Créez un mot de passe sécurisé d'au moins 8 caractères.</p>
//           <InputField label="Nouveau mot de passe" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="8+ caractères" icon={I.lock} required />
//           <InputField label="Confirmer le mot de passe" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Répétez le mot de passe" icon={I.lock} required />
//           {newPass && (
//             <div style={{ marginBottom: "1rem", marginTop: "-0.5rem" }}>
//               <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.3rem" }}>
//                 {[C.danger, C.warning, "#17935a"].map((col, i) => {
//                   const strength = newPass.length >= 12 ? 3 : newPass.length >= 8 ? 2 : 1;
//                   return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < strength ? [C.danger, C.warning, "#17935a"][strength - 1] : C.bg, transition: "background .3s" }} />;
//                 })}
//               </div>
//               <div style={{ fontSize: "0.72rem", color: C.textLight }}>Force : {newPass.length >= 12 ? "Fort" : newPass.length >= 8 ? "Moyen" : "Faible"}</div>
//             </div>
//           )}
//           {confirmPass && newPass !== confirmPass && <div style={{ marginBottom: "0.9rem", fontSize: "0.77rem", color: C.danger }}>⚠ Les mots de passe ne correspondent pas.</div>}
//           <Btn full size="lg" onClick={handleReset} disabled={!newPass || newPass !== confirmPass} icon={I.check}>
//             {loading ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Enregistrement…</span> : "Enregistrer le nouveau mot de passe"}
//           </Btn>
//         </>
//       )}
//       <div style={{ textAlign: "center", marginTop: "1rem" }}>
//         <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: C.textLight, fontSize: "0.82rem", cursor: "pointer" }}>← Retour à l'accueil</button>
//       </div>
//     </AuthLayout>
//   );
// };

// /* ════════════════════════════════════
//    PATIENT DASHBOARD
// ════════════════════════════════════ */
// const PatientDashboard = ({ setPage }) => {
//   const [active, setActive] = useState("accueil");
//   const toast = useToast();
//   const [modalRDV, setModalRDV] = useState(false);

//   const nav = [
//     { id: "accueil", label: "Accueil", icon: I.heart },
//     { id: "rdv", label: "Mes RDV", icon: I.calendar },
//     { id: "dossier", label: "Mon Dossier", icon: I.file },
//     { id: "ordonnances", label: "Ordonnances", icon: I.clipboard },
//     { id: "medecins", label: "Médecins", icon: I.users },
//   ];

//   return (
//     <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden" }}>
//       <ModalRDV open={modalRDV} onClose={() => setModalRDV(false)} toast={toast} patient={{ nom: "Fatou Ndiaye" }} />
//       <aside style={{ width: 240, flexShrink: 0, background: `linear-gradient(170deg, ${C.primaryDeep}, ${C.primaryDark})`, display: "flex", flexDirection: "column", height: "100vh", boxShadow: "4px 0 20px rgba(0,0,0,0.1)" }}>
//         <div style={{ padding: "1.4rem 1.2rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.65rem" }}>
//           <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.heart} size={18} stroke="#1ecb88" sw={2} /></div>
//           <div><div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "0.95rem", color: "white" }}>MediConnect</div><div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Espace Patient</div></div>
//         </div>
//         <div style={{ margin: "0.9rem", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.75rem 0.9rem" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
//             <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.accent}99`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.title, fontWeight: 800, color: "white", fontSize: "0.82rem" }}>FN</div>
//             <div><div style={{ fontWeight: 600, color: "white", fontSize: "0.82rem" }}>Fatou Ndiaye</div><div style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.4)" }}>Patient · Dakar</div></div>
//           </div>
//         </div>
//         <nav style={{ flex: 1, padding: "0.4rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
//           {nav.map(n => (
//             <button key={n.id} onClick={() => setActive(n.id)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.58rem 0.7rem", borderRadius: 9, border: "none", background: active === n.id ? "rgba(255,255,255,0.14)" : "transparent", color: active === n.id ? "white" : "rgba(255,255,255,0.48)", fontSize: "0.82rem", fontWeight: active === n.id ? 600 : 400, cursor: "pointer", transition: "all 0.13s", width: "100%", textAlign: "left" }}>
//               <Icon d={n.icon} size={16} sw={1.8} />{n.label}
//             </button>
//           ))}
//         </nav>
//         <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
//           <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", cursor: "pointer" }}>
//             <Icon d={I.arrowL} size={13} sw={2} /> Retour accueil
//           </button>
//         </div>
//       </aside>
//       <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
//         {active === "accueil" && (
//           <>
//             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.8rem" }}>
//               <div><h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text }}>Bonjour, Fatou 👋</h1><p style={{ color: C.textLight, fontSize: "0.85rem", marginTop: "0.2rem" }}>Dimanche 24 mai 2026</p></div>
//               <Btn icon={I.calendar} onClick={() => setModalRDV(true)}>Prendre RDV</Btn>
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
//               <StatCard label="Prochain RDV" value="Jeu 29/05" sub="Dr. Diallo — 10h00" color={C.primary} icon={I.calendar} />
//               <StatCard label="Ordonnances actives" value="2" sub="Dont 1 expiration proche" color={C.warning} icon={I.clipboard} />
//               <StatCard label="Consultations" value="14" sub="Depuis inscription" color="#1660a8" icon={I.activity} />
//               <StatCard label="Groupe sanguin" value="O+" sub="Dossier médical" color="#17935a" icon={I.heart} />
//             </div>
//             <div style={{ background: C.primaryPale, border: `1px solid ${C.borderLight}`, borderRadius: 14, padding: "1rem 1.2rem", marginBottom: "1.3rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
//               <Icon d={I.bell} size={18} stroke={C.primary} sw={1.8} />
//               <div style={{ flex: 1 }}>
//                 <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.88rem", color: C.text }}>Votre dossier est géré par votre équipe médicale</div>
//                 <div style={{ fontSize: "0.77rem", color: C.textMid, marginTop: "0.1rem" }}>Pour toute modification, contactez le Dr. R. Diallo ou l'infirmier(e) de votre établissement.</div>
//               </div>
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
//               <Card>
//                 <CardHead title="Prochains rendez-vous" />
//                 {[{ dr: "Dr. R. Diallo", spec: "Cardiologie", date: "Jeu 29/05 · 10h00", type: "Vidéo", color: C.primary }, { dr: "Dr. M. Sow", spec: "Médecine générale", date: "Mar 03/06 · 14h30", type: "Présentiel", color: "#1660a8" }].map(a => (
//                   <div key={a.dr} style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.8rem 1.2rem", borderBottom: `1px solid ${C.borderLight}` }}>
//                     <div style={{ width: 38, height: 38, borderRadius: 10, background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.user} size={18} stroke={a.color} sw={1.8} /></div>
//                     <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: "0.84rem", color: C.text }}>{a.dr}</div><div style={{ fontSize: "0.71rem", color: C.textLight }}>{a.spec} · {a.date}</div></div>
//                     <Tag color={a.color}>{a.type}</Tag>
//                   </div>
//                 ))}
//               </Card>
//               <Card>
//                 <CardHead title="Ordonnances récentes" />
//                 {[{ name: "Amlodipine 5mg", date: "15/05/2026", status: "Active", col: "#17935a" }, { name: "Ramipril 10mg", date: "15/05/2026", status: "Expire bientôt", col: C.warning }, { name: "Aspirine 100mg", date: "02/04/2026", status: "Expirée", col: C.textLight }].map(o => (
//                   <div key={o.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.72rem 1.2rem", borderBottom: `1px solid ${C.borderLight}` }}>
//                     <div style={{ width: 34, height: 34, borderRadius: 9, background: `${o.col}15`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.clipboard} size={15} stroke={o.col} sw={1.8} /></div>
//                     <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: "0.81rem", color: C.text }}>{o.name}</div><div style={{ fontSize: "0.69rem", color: C.textLight }}>{o.date}</div></div>
//                     <Tag color={o.col}>{o.status}</Tag>
//                   </div>
//                 ))}
//               </Card>
//             </div>
//           </>
//         )}
//         {active === "rdv" && <PageAgenda toast={toast} />}
//         {active === "ordonnances" && <PageOrdonnances toast={toast} />}
//         {active !== "accueil" && active !== "rdv" && active !== "ordonnances" && (
//           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", color: C.textLight, gap: "0.5rem" }}>
//             <Icon d={nav.find(n => n.id === active)?.icon || I.file} size={40} stroke={C.borderLight} sw={1.2} />
//             <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1rem", color: C.textLight }}>{nav.find(n => n.id === active)?.label}</div>
//             <div style={{ fontSize: "0.8rem" }}>Section disponible — données chargées depuis votre dossier médical</div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// /* ════════════════════════════════════
//    MEDECIN DASHBOARD — COMPLET
// ════════════════════════════════════ */
// const MedecinDashboard = ({ setPage }) => {
//   const [active, setActive] = useState("accueil");
//   const toast = useToast();
//   const [modalNP, setModalNP] = useState(false);
//   const [modalConst, setModalConst] = useState(false);
//   const [modalOrdo, setModalOrdo] = useState(false);
//   const [modalRDV, setModalRDV] = useState(false);

//   const nav = [
//     { id: "accueil", label: "Tableau de bord", icon: I.activity },
//     { id: "patients", label: "Patients", icon: I.users },
//     { id: "ecg", label: "Analyses ECG", icon: I.activity },
//     { id: "ordonnances", label: "Ordonnances", icon: I.clipboard },
//     { id: "agenda", label: "Agenda", icon: I.calendar },
//     { id: "constantes", label: "Constantes", icon: I.trending },
//     { id: "alertes", label: "Alertes", icon: I.bell },
//     { id: "transferts", label: "Transferts", icon: I.arrowR },
//     { id: "cartographie", label: "Cartographie", icon: I.map },
//     { id: "parametres", label: "Paramètres", icon: I.settings },
//   ];

//   return (
//     <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden" }}>
//       <ModalNouveauPatient open={modalNP} onClose={() => setModalNP(false)} toast={toast} />
//       <ModalConstantes open={modalConst} onClose={() => setModalConst(false)} toast={toast} patient={PATIENTS[0]} />
//       <ModalOrdonnance open={modalOrdo} onClose={() => setModalOrdo(false)} toast={toast} />
//       <ModalRDV open={modalRDV} onClose={() => setModalRDV(false)} toast={toast} patient={PATIENTS[0]} />

//       <aside style={{ width: 252, flexShrink: 0, background: `linear-gradient(170deg, ${C.primaryDeep}, ${C.primaryDark})`, display: "flex", flexDirection: "column", height: "100vh", boxShadow: "4px 0 20px rgba(0,0,0,0.1)" }}>
//         <div style={{ padding: "1.4rem 1.2rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.65rem" }}>
//           <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.heart} size={18} stroke="#1ecb88" sw={2} /></div>
//           <div><div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "0.95rem", color: "white" }}>MediConnect</div><div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Espace Médecin</div></div>
//         </div>
//         <div style={{ margin: "0.9rem", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.75rem 0.9rem" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
//             <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#d97030,#b84f15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.title, fontWeight: 800, color: "white", fontSize: "0.82rem" }}>AD</div>
//             <div>
//               <div style={{ fontWeight: 600, color: "white", fontSize: "0.82rem" }}>Dr. A. Diallo</div>
//               <div style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.4)" }}>Cardiologie · HGGY</div>
//             </div>
//             <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#1ecb78" }} />
//           </div>
//         </div>
//         <nav style={{ flex: 1, padding: "0.4rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.1rem", overflowY: "auto" }}>
//           {nav.map(n => (
//             <button key={n.id} onClick={() => setActive(n.id)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.58rem 0.7rem", borderRadius: 9, border: "none", background: active === n.id ? "rgba(255,255,255,0.14)" : "transparent", color: active === n.id ? "white" : "rgba(255,255,255,0.48)", fontSize: "0.82rem", fontWeight: active === n.id ? 600 : 400, cursor: "pointer", transition: "all 0.13s", width: "100%", textAlign: "left" }}>
//               <Icon d={n.icon} size={16} sw={1.8} />
//               {n.label}
//               {n.id === "alertes" && <span style={{ marginLeft: "auto", background: C.danger, color: "white", fontSize: "0.6rem", fontWeight: 700, padding: "0.05rem 0.4rem", borderRadius: 100 }}>2</span>}
//             </button>
//           ))}
//         </nav>
//         <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
//           <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", cursor: "pointer" }}>
//             <Icon d={I.arrowL} size={13} sw={2} /> Retour accueil
//           </button>
//         </div>
//       </aside>

//       <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
//         {active === "accueil" && (
//           <>
//             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.8rem" }}>
//               <div><h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text }}>Tableau de bord</h1><p style={{ color: C.textLight, fontSize: "0.85rem", marginTop: "0.2rem" }}>Dr. A. Diallo · Cardiologie · HGGY · 24 mai 2026</p></div>
//               <div style={{ display: "flex", gap: "0.75rem" }}>
//                 <Btn variant="outline" icon={I.bell} size="sm" onClick={() => setActive("alertes")}>Alertes (2)</Btn>
//                 <Btn icon={I.video} size="sm" onClick={() => toast("Consultation démarrée", "success")}>Démarrer consultation</Btn>
//               </div>
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
//               <StatCard label="Consultations aujourd'hui" value="8" sub="3 restantes" color={C.primary} icon={I.video} />
//               <StatCard label="Patients suivis" value="124" sub="↑ 6 ce mois" color="#1660a8" icon={I.users} delta={{ up: true }} />
//               <StatCard label="ECG analysés" value="47" sub="Ce mois" color="#e07228" icon={I.activity} />
//               <StatCard label="Alertes actives" value="2" sub="1 critique" color={C.danger} icon={I.bell} />
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
//               <Card>
//                 <CardHead title="Consultations du jour" />
//                 {[{ name: "Oumar Seck", time: "09:30", type: "Vidéo", done: true }, { name: "Fatou Ndiaye", time: "11:00", type: "Urgence", now: true }, { name: "Ibrahima Fall", time: "14:15", type: "Suivi" }, { name: "Rokhaya Ba", time: "15:30", type: "Vidéo" }].map(a => (
//                   <div key={a.name} style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.65rem 1.2rem", borderBottom: `1px solid ${C.borderLight}`, opacity: a.done ? 0.5 : 1 }}>
//                     <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.done ? C.textLight : a.now ? C.accent : C.primary, flexShrink: 0 }} />
//                     <div style={{ flex: 1 }}><div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text }}>{a.name}</div><div style={{ fontSize: "0.68rem", color: C.textLight }}>{a.time} · {a.type}</div></div>
//                     {a.now && <Tag color={C.primary}>En cours</Tag>}
//                     {a.done && <Tag color={C.textLight}>Terminé</Tag>}
//                   </div>
//                 ))}
//               </Card>
//               <Card>
//                 <CardHead title="Alertes récentes" />
//                 {ALERTES.slice(0, 3).map((a, i) => {
//                   const col = a.level === "rouge" ? C.danger : a.level === "orange" ? C.warning : C.accentWarm;
//                   return (
//                     <div key={i} style={{ padding: "0.72rem 1.2rem", borderBottom: `1px solid ${C.borderLight}`, borderLeft: `3px solid ${col}`, background: `${col}08` }}>
//                       <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "0.18rem" }}>{a.msg}</div>
//                       <div style={{ fontSize: "0.68rem", color: C.textLight }}>{a.time}</div>
//                     </div>
//                   );
//                 })}
//                 <div style={{ padding: "0.75rem 1.2rem" }}><Btn variant="outline" size="sm" full onClick={() => setActive("alertes")}>Gérer les alertes</Btn></div>
//               </Card>
//             </div>
//           </>
//         )}

//         {active === "patients" && <PagePatients toast={toast} />}
//         {active === "ecg" && <PageECG toast={toast} />}
//         {active === "ordonnances" && <PageOrdonnances toast={toast} />}
//         {active === "agenda" && <PageAgenda toast={toast} />}
//         {active === "constantes" && <PageConstantes toast={toast} />}
//         {active === "alertes" && <PageAlertes toast={toast} />}
//         {active === "transferts" && <PageTransferts toast={toast} />}
//         {active === "cartographie" && <PageCarto toast={toast} />}
//         {active === "parametres" && <PageParametresMedecin toast={toast} />}
//       </main>
//     </div>
//   );
// };

// /* ════════════════════════════════════
//    LANDING & NAVBAR
// ════════════════════════════════════ */
// const Navbar = ({ setPage }) => {
//   const [scrolled, setScrolled] = useState(false);
//   useEffect(() => {
//     const h = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", h);
//     return () => window.removeEventListener("scroll", h);
//   }, []);
//   return (
//     <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", borderBottom: scrolled ? `1px solid ${C.borderLight}` : "1px solid transparent", boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none", transition: "all 0.25s" }}>
//       <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem", display: "flex", alignItems: "center", height: 68 }}>
//         <div onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: "0.7rem", cursor: "pointer", flex: 1 }}>
//           <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${C.primary}44` }}>
//             <Icon d={I.heart} size={20} stroke="white" sw={2} />
//           </div>
//           <div>
//             <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.05rem", color: C.primaryDark, lineHeight: 1 }}>MediConnect</div>
//             <div style={{ fontSize: "0.6rem", color: C.textLight, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sénégal</div>
//           </div>
//         </div>
//         <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: "0.7rem", alignItems: "center" }}>
//           <Btn variant="ghost" size="sm" onClick={() => setPage("login")}>Connexion</Btn>
//           <Btn size="sm" onClick={() => setPage("register")}>Créer un compte</Btn>
//         </div>
//       </div>
//     </nav>
//   );
// };

// /* Stat pill */
// const StatPill = ({ value, label, color = C.primary }) => (
//   <div style={{
//     background: "white", borderRadius: "14px", padding: "1.1rem 1.4rem",
//     border: `1px solid ${C.borderLight}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
//     textAlign: "center",
//   }}>
//     <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
//     <div style={{ fontSize: "0.78rem", color: C.textLight, marginTop: "0.3rem", fontWeight: 500 }}>{label}</div>
//   </div>
// );
// /* ─── LANDING PAGE ─── */
// const LandingPage = ({ setPage }) => {
//   const features = [
//     { icon: I.video, title: "Téléconsultation", desc: "Consultations vidéo HD avec adaptation automatique à la bande passante.", color: "#0d7a6e" },
//     { icon: I.activity, title: "IA Cardiologique", desc: "Analyse automatique d'ECG par intelligence artificielle.", color: "#e07228" },
//     { icon: I.file, title: "Dossier Médical", desc: "DME conforme HL7 FHIR. Historique complet et ordonnances électroniques.", color: "#1660a8" },
//     { icon: I.wifi, title: "Mode Hors-ligne", desc: "Architecture PWA offline-first. Fonctionne sur 2G/3G.", color: "#7050bc" },
//     { icon: I.bell, title: "Alertes Intelligentes", desc: "Alertes cliniques graduées avec routage vers le médecin disponible.", color: "#c93535" },
//     { icon: I.map, title: "Cartographie", desc: "Carte épidémiologique des pathologies par zone géographique.", color: "#0a9182" },
//     { icon: I.clipboard, title: "Ordonnances", desc: "Génération, signature numérique et QR code de vérification.", color: "#17935a" },
//     { icon: I.shield, title: "Sécurité & Conformité", desc: "Conforme loi n°2008-12. TLS 1.3, AES-256, MFA obligatoire.", color: "#065f52" },
//   ];
//   const stats = [{ value: "500+", label: "Médecins inscrits" }, { value: "50K+", label: "Patients suivis" }, { value: "4.9★", label: "Note moyenne" }, { value: "24/7", label: "Disponibilité" }];
//   const steps = [
//     { num: "01", title: "Inscription", desc: "Créez votre compte patient ou médecin.", icon: I.user },
//     { num: "02", title: "Prise de RDV", desc: "Réservez un créneau en quelques clics.", icon: I.calendar },
//     { num: "03", title: "Consultation", desc: "Rejoignez la consultation vidéo.", icon: I.video },
//     { num: "04", title: "Suivi", desc: "Accédez à vos ordonnances et résultats.", icon: I.clipboard },
//   ];
//   const [hovCard, setHovCard] = useState(null);
//   return (
//     <div style={{ paddingTop: 68 }}>
//       {/* HERO */}
//       <section style={{ minHeight: "calc(100vh - 68px)", display: "flex", alignItems: "center", background: "linear-gradient(135deg, #f2fbf9 0%, #e8f7f4 40%, #f0faf8 100%)", position: "relative", overflow: "hidden" }}>
//         <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, opacity: 0.15, pointerEvents: "none" }}><ECGLine width={1400} color={C.primary} opacity={1} /></div>
//         <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center", width: "100%" }}>
//           <div>
//             <Tag color={C.primary}><Icon d={I.shield} size={12} /> Plateforme nationale de télémédecine</Tag>
//             <h1 style={{ fontFamily: F.title, fontWeight: 800, lineHeight: 1.1, fontSize: "clamp(2.4rem, 4vw, 3.4rem)", marginTop: "1.2rem", color: C.text, letterSpacing: "-0.03em" }} className="fade-up-1">
//               La santé de qualité,<br /><span style={{ color: C.primary }}>partout au Sénégal</span>
//             </h1>
//             <p style={{ marginTop: "1.2rem", fontSize: "1.05rem", color: C.textMid, lineHeight: 1.7, maxWidth: 480 }} className="fade-up-2">
//               Consultez un médecin certifié, gérez votre dossier médical et bénéficiez d'un suivi cardiologique assisté par IA.
//             </p>
//             <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem", flexWrap: "wrap" }} className="fade-up-3">
//               <Btn size="lg" onClick={() => setPage("register")} icon={I.arrowR}>Créer un compte</Btn>
//               <Btn size="lg" variant="outline" onClick={() => setPage("login")}>Se connecter</Btn>
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginTop: "2.5rem" }} className="fade-up-4">
//               {stats.map(s => <StatPill key={s.label} value={s.value} label={s.label} color={C.primary} />)}
//             </div>
//           </div>
//           {/* Hero card */}
//           <div style={{ display: "flex", justifyContent: "center", animation: "float 6s ease-in-out infinite" }}>
//             <div style={{ background: "white", borderRadius: 24, padding: "2rem", boxShadow: `0 24px 60px ${C.primary}20`, border: `1px solid ${C.borderLight}`, maxWidth: 380, width: "100%" }}>
//               <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
//                 <div style={{ width: 44, height: 44, borderRadius: 12, background: C.primaryPale, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.activity} size={22} stroke={C.primary} sw={2} /></div>
//                 <div>
//                   <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.95rem", color: C.text }}>Dr. Aminata Diallo</div>
//                   <div style={{ fontSize: "0.75rem", color: C.textLight }}>Cardiologie — HGGY</div>
//                 </div>
//                 <div style={{ marginLeft: "auto" }}><span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: 100, background: "#e5f7ef", color: "#17935a", fontSize: "0.72rem", fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1ecb78", display: "inline-block" }} />En ligne</span></div>
//               </div>
//               <div style={{ background: C.primaryDeep, borderRadius: 14, padding: "1rem", marginBottom: "1rem" }}>
//                 <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem", fontFamily: F.title, fontWeight: 600 }}>ECG — Rythme sinusal normal</div>
//                 <ECGLine width={320} color={C.accent} opacity={0.9} />
//                 <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
//                   <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>72 bpm</span>
//                   <span style={{ fontSize: "0.7rem", color: "#1ecb88", fontWeight: 600 }}>✓ Normal</span>
//                 </div>
//               </div>
//               {[{ name: "Oumar Seck", time: "09:30", type: "Vidéo", color: C.primary }, { name: "Fatou Ndiaye", time: "11:00", type: "Urgence", color: C.warning }, { name: "Ibrahima Fall", time: "14:15", type: "Suivi", color: "#1660a8" }].map(a => (
//                 <div key={a.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.75rem", background: C.surfaceAlt, borderRadius: 10, marginBottom: "0.5rem", border: `1px solid ${C.borderLight}` }}>
//                   <div style={{ width: 32, height: 32, borderRadius: 8, background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.user} size={16} stroke={a.color} sw={2} /></div>
//                   <div style={{ flex: 1 }}><div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text }}>{a.name}</div><div style={{ fontSize: "0.7rem", color: C.textLight }}>{a.time} · {a.type}</div></div>
//                   <Icon d={I.chevR} size={14} stroke={C.textLight} />
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* FEATURES */}
//       <section style={{ padding: "6rem 2rem", background: "white" }}>
//         <div style={{ maxWidth: 1200, margin: "0 auto" }}>
//           <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
//             <Tag color={C.primary}>Fonctionnalités</Tag>
//             <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", marginTop: "0.8rem", color: C.text, letterSpacing: "-0.02em" }}>Une plateforme complète pour la santé</h2>
//           </div>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
//             {features.map((f, i) => (
//               <div key={f.title} onMouseEnter={() => setHovCard(i)} onMouseLeave={() => setHovCard(null)}
//                 style={{ padding: "1.5rem", borderRadius: 16, border: `1.5px solid ${hovCard === i ? f.color + "44" : C.borderLight}`, background: hovCard === i ? `${f.color}06` : C.surfaceAlt, transition: "all 0.2s", transform: hovCard === i ? "translateY(-4px)" : "none", boxShadow: hovCard === i ? `0 8px 24px ${f.color}18` : "none" }}>
//                 <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}><Icon d={f.icon} size={22} stroke={f.color} sw={1.8} /></div>
//                 <h3 style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.95rem", color: C.text, marginBottom: "0.5rem" }}>{f.title}</h3>
//                 <p style={{ fontSize: "0.82rem", color: C.textMid, lineHeight: 1.6 }}>{f.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* HOW IT WORKS */}
//       <section style={{ padding: "6rem 2rem", background: C.bg }}>
//         <div style={{ maxWidth: 1100, margin: "0 auto" }}>
//           <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
//             <Tag color={C.primary}>Comment ça marche</Tag>
//             <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", marginTop: "0.8rem", color: C.text, letterSpacing: "-0.02em" }}>Simple en 4 étapes</h2>
//           </div>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "2rem", position: "relative" }}>
//             <div style={{ position: "absolute", top: 32, left: "12.5%", right: "12.5%", height: 2, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`, borderRadius: 1, zIndex: 0 }} />
//             {steps.map((s, i) => (
//               <div key={s.num} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
//                 <div style={{ width: 64, height: 64, borderRadius: "50%", background: i % 2 === 0 ? C.primaryDark : "white", border: `2px solid ${C.primary}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem", boxShadow: `0 4px 16px ${C.primary}30` }}>
//                   <Icon d={s.icon} size={26} stroke={i % 2 === 0 ? "white" : C.primary} sw={1.8} />
//                 </div>
//                 <div style={{ fontFamily: F.title, fontSize: "0.65rem", fontWeight: 700, color: C.textLight, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>Étape {s.num}</div>
//                 <h3 style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1rem", color: C.text, marginBottom: "0.5rem" }}>{s.title}</h3>
//                 <p style={{ fontSize: "0.82rem", color: C.textMid, lineHeight: 1.6 }}>{s.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA */}
//       <section style={{ padding: "5rem 2rem", background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})` }}>
//         <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
//           <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "white", letterSpacing: "-0.02em" }}>Prêt à rejoindre MediConnect ?</h2>
//           <p style={{ marginTop: "0.8rem", color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.7 }}>Rejoignez des milliers de médecins et patients qui font confiance à MediConnect Sénégal.</p>
//           <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
//             <Btn size="lg" variant="white" onClick={() => setPage("register")}>Créer un compte gratuit</Btn>
//             <Btn size="lg" onClick={() => setPage("login")} style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.3)", color: "white" }}>Se connecter</Btn>
//           </div>
//         </div>
//       </section>

//       <footer style={{ background: C.primaryDeep, padding: "2rem", textAlign: "center" }}>
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
//           <div style={{ width: 24, height: 24, borderRadius: 6, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.heart} size={13} stroke="white" sw={2} /></div>
//           <span style={{ fontFamily: F.title, fontWeight: 700, color: "white", fontSize: "0.9rem" }}>MediConnect Sénégal</span>
//         </div>
//         <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>© 2025 SIPREC-SEN · École Polytechnique de Thiès · Hôpital Général de Grand Yoff</p>
//       </footer>
//     </div>
//   );
// };
// /* ════════════════════════════════════
//    ROUTER
// ════════════════════════════════════ */
// export default function App() {
//   const [page, setPage] = useState("home");
//   return (
//     <ToastContext>
//       <style>{globalCSS}</style>
//       {page === "home" && <><Navbar setPage={setPage} /><LandingPage setPage={setPage} /></>}
//       {page === "login" && <LoginPage setPage={setPage} />}
//       {page === "register" && <RegisterPage setPage={setPage} />}
//       {page === "forgot-password" && <ForgotPasswordPage setPage={setPage} />}
//       {page === "otp" && <OTPPage setPage={setPage} />}
//       {page === "dashboard_patient" && <PatientDashboard setPage={setPage} />}
//       {page === "dashboard_medecin" && <MedecinDashboard setPage={setPage} />}
//       {page === "dashboard_admin" && <AdminDashboard setPage={setPage} />}
//     </ToastContext>
//   );
// }

// import { useState } from "react";
// import { globalCSS } from "./constants/theme";

// // Auth
// import { ToastContext } from "./components/toast/ToastContext";
// import LoginPage from "./pages/auth/LoginPage";
// import RegisterPage from "./pages/auth/RegisterPage";
// import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
// import OTPPage from "./pages/auth/OTPPage";

// // Landing
// import LandingPage from "./pages/LandingPage";
// import Navbar from "./pages/LandingPage"; // ou un import séparé si Navbar est dans son propre fichier

// // Dashboards
// import PatientDashboard from "./dashboards/PatientDashboard";
// import MedecinDashboard from "./dashboards/MedecinDashboard";
// import AdminDashboard from "./dashboards/AdminDashboard";

// export default function App() {
//   const [page, setPage] = useState("home");

//   return (
//     <ToastContext>
//       <style>{globalCSS}</style>

//       {page === "home" && (
//         <>
//           <Navbar setPage={setPage} />
//           <LandingPage setPage={setPage} />
//         </>
//       )}
//       {page === "login"           && <LoginPage           setPage={setPage} />}
//       {page === "register"        && <RegisterPage        setPage={setPage} />}
//       {page === "forgot-password" && <ForgotPasswordPage  setPage={setPage} />}
//       {page === "otp"             && <OTPPage             setPage={setPage} />}
//       {page === "dashboard_patient" && <PatientDashboard  setPage={setPage} />}
//       {page === "dashboard_medecin" && <MedecinDashboard  setPage={setPage} />}
//       {page === "dashboard_admin"   && <AdminDashboard    setPage={setPage} />}
//     </ToastContext>
//   );
// }

