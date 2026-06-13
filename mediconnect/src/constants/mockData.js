export const PATIENTS = [
  {id:"PAT-00412",nom:"Mamadou Faye",age:"54",sexe:"M",patho:"Hypertension",statut:"urgent",visite:"14/05/2026",tension:"148/92",fc:"78",col:"#0a9182",init:"MF",region:"Dakar",commune:"Médina",assurance:"CNAM Sénégal",medecin:"Dr. R. Diallo",atcdMed:"HTA, DT2 depuis 2018",allergies:"Pénicilline",traitement:"Amlodipine 5mg",lat:14.6937,lng:-17.4441},
  {id:"PAT-00398",nom:"Fatou Sène",age:"41",sexe:"F",patho:"Diabète T2",statut:"actif",visite:"13/05/2026",tension:"122/78",fc:"72",col:"#1660a8",init:"FS",region:"Thiès",commune:"Thiès Nord",assurance:"IPRES",medecin:"Dr. A. Ndiaye",atcdMed:"DT2 depuis 2021",allergies:"Aucune",traitement:"Metformine 500mg",lat:14.7886,lng:-16.9240},
  {id:"PAT-00375",nom:"Ibrahima Ba",age:"63",sexe:"M",patho:"Insuff. cardiaque",statut:"actif",visite:"10/05/2026",tension:"130/85",fc:"68",col:"#7050bc",init:"IB",region:"Saint-Louis",commune:"Sor",assurance:"Privée",medecin:"Dr. R. Diallo",atcdMed:"IC depuis 2019",allergies:"Aspirine",traitement:"Furosémide 40mg",lat:16.0194,lng:-16.4891},
  {id:"PAT-00362",nom:"Aïssatou Diop",age:"35",sexe:"F",patho:"Arythmie",statut:"actif",visite:"09/05/2026",tension:"118/76",fc:"82",col:"#d97030",init:"AD",region:"Dakar",commune:"Guédiawaye",assurance:"Aucune",medecin:"Dr. R. Diallo",atcdMed:"Arythmie supraventriculaire",allergies:"Aucune",traitement:"Bisoprolol 5mg",lat:14.777,lng:-17.3756},
  {id:"PAT-00341",nom:"Moussa Diallo",age:"49",sexe:"M",patho:"HTA + DT2",statut:"urgent",visite:"08/05/2026",tension:"155/98",fc:"88",col:"#c93535",init:"MD",region:"Kaolack",commune:"Kaolack",assurance:"CNAM Sénégal",medecin:"Dr. B. Fall",atcdMed:"HTA sévère, DT2",allergies:"Codéine",traitement:"Losartan 100mg",lat:14.1525,lng:-16.0738},
  {id:"PAT-00318",nom:"Rokhaya Cissé",age:"58",sexe:"F",patho:"Coronaropathie",statut:"actif",visite:"07/05/2026",tension:"126/82",fc:"65",col:"#17935a",init:"RC",region:"Dakar",commune:"Plateau",assurance:"IPRES",medecin:"Dr. R. Diallo",atcdMed:"Coronaropathie, stent 2020",allergies:"Aucune",traitement:"Aspirine 75mg",lat:14.6866,lng:-17.438},
  {id:"PAT-00305",nom:"Cheikh Ndoye",age:"44",sexe:"M",patho:"Cholestérol",statut:"stable",visite:"05/05/2026",tension:"120/80",fc:"70",col:"#0a7c6e",init:"CN",region:"Diourbel",commune:"Touba",assurance:"Aucune",medecin:"Dr. A. Ndiaye",atcdMed:"Dyslipidémie",allergies:"Aucune",traitement:"Statines 20mg",lat:14.862,lng:-15.881},
  {id:"PAT-00290",nom:"Mariama Sarr",age:"29",sexe:"F",patho:"Tachycardie",statut:"actif",visite:"02/05/2026",tension:"110/72",fc:"98",col:"#7050bc",init:"MS",region:"Dakar",commune:"Rufisque",assurance:"Privée",medecin:"Dr. R. Diallo",atcdMed:"Tachycardie sinusale",allergies:"Aucune",traitement:"Propranolol 10mg",lat:14.7153,lng:-17.2729},
];

export const REGIONS = [
  {name:"Dakar",patients:118,urgents:8,lat:14.693,lng:-17.444},
  {name:"Thiès",patients:34,urgents:2,lat:14.789,lng:-16.924},
  {name:"Saint-Louis",patients:22,urgents:1,lat:16.019,lng:-16.489},
  {name:"Diourbel",patients:18,urgents:1,lat:14.655,lng:-16.236},
  {name:"Kaolack",patients:21,urgents:3,lat:14.152,lng:-16.074},
  {name:"Fatick",patients:12,urgents:0,lat:14.339,lng:-16.411},
  {name:"Kaffrine",patients:9,urgents:1,lat:14.106,lng:-15.551},
  {name:"Tambacounda",patients:14,urgents:1,lat:13.77,lng:-13.667},
  {name:"Ziguinchor",patients:13,urgents:2,lat:12.565,lng:-16.272},
  {name:"Kolda",patients:11,urgents:1,lat:12.898,lng:-14.951},
  {name:"Louga",patients:10,urgents:0,lat:15.619,lng:-16.224},
  {name:"Matam",patients:5,urgents:0,lat:15.659,lng:-13.255},
  {name:"Kédougou",patients:6,urgents:0,lat:12.556,lng:-12.175},
  {name:"Sédhiou",patients:7,urgents:0,lat:12.708,lng:-15.557},
];

export const RDV_DATA = [
  {date:"18/05/2026",heure:"08:30",patient:"Mamadou Faye",id:"PAT-00412",medecin:"Dr. R. Diallo",type:"Présentiel",motif:"Suivi HTA",statut:"confirme"},
  {date:"18/05/2026",heure:"10:15",patient:"Aïssatou Diop",id:"PAT-00362",medecin:"Dr. R. Diallo",type:"Vidéo",motif:"Arythmie",statut:"video"},
  {date:"18/05/2026",heure:"11:00",patient:"Rokhaya Cissé",id:"PAT-00318",medecin:"Dr. R. Diallo",type:"Présentiel",motif:"Bilan coronarien",statut:"attente"},
  {date:"19/05/2026",heure:"09:30",patient:"Fatou Sène",id:"PAT-00398",medecin:"Dr. A. Ndiaye",type:"Présentiel",motif:"Suivi DT2",statut:"confirme"},
  {date:"20/05/2026",heure:"14:00",patient:"Cheikh Ndoye",id:"PAT-00305",medecin:"Dr. A. Ndiaye",type:"Vidéo",motif:"Suivi cholestérol",statut:"video"},
  {date:"21/05/2026",heure:"10:00",patient:"Moussa Diallo",id:"PAT-00341",medecin:"Dr. B. Fall",type:"Urgence",motif:"Tension élevée",statut:"urgent"},
];

export const ECG_DATA = [
  {patient:"Mamadou Faye",id:"PAT-00412",date:"14/05/2026",fc:"78 bpm",resultat:"HVG probable · Rythme sinusal",confiance:"94%",statut:"analyse"},
  {patient:"Ibrahima Ba",id:"PAT-00375",date:"10/05/2026",fc:"68 bpm",resultat:"Normal — aucune anomalie",confiance:"97%",statut:"normal"},
  {patient:"Moussa Diallo",id:"PAT-00341",date:"08/05/2026",fc:"88 bpm",resultat:"Fibrillation auriculaire",confiance:"91%",statut:"anomalie"},
  {patient:"Rokhaya Cissé",id:"PAT-00318",date:"07/05/2026",fc:"65 bpm",resultat:"Normal post-stenting",confiance:"96%",statut:"normal"},
  {patient:"Aïssatou Diop",id:"PAT-00362",date:"09/05/2026",fc:"82 bpm",resultat:"Tachycardie supraventriculaire",confiance:"89%",statut:"anomalie"},
];

export const ORDO_DATA = [
  {num:"ORD-2026-0412",patient:"Mamadou Faye",id:"PAT-00412",medecin:"Dr. R. Diallo",meds:["Amlodipine 5mg · 1cp/j · 30j","Ramipril 5mg · 1cp/j · 30j"],date:"14/05/2026",statut:"signee"},
  {num:"ORD-2026-0398",patient:"Fatou Sène",id:"PAT-00398",medecin:"Dr. A. Ndiaye",meds:["Metformine 500mg · 2cp/j · 60j"],date:"13/05/2026",statut:"expiree"},
  {num:"ORD-2026-0375",patient:"Ibrahima Ba",id:"PAT-00375",medecin:"Dr. R. Diallo",meds:["Furosémide 40mg · 1cp/j","Aldactone 25mg · 1cp/j"],date:"10/05/2026",statut:"signee"},
  {num:"ORD-2026-0341",patient:"Moussa Diallo",id:"PAT-00341",medecin:"Dr. B. Fall",meds:["Losartan 100mg · 1cp/j · 30j"],date:"08/05/2026",statut:"signee"},
];

export const CONST_DATA = [
  {patient:"Mamadou Faye",id:"PAT-00412",date:"14/05/2026 09:45",infirmier:"A. Ndiaye",ta:"148/92",fc:78,spo2:97,temp:37.2,poids:84,imc:28.4},
  {patient:"Fatou Sène",id:"PAT-00398",date:"13/05/2026 10:12",infirmier:"A. Ndiaye",ta:"122/78",fc:72,spo2:98,temp:36.9,poids:65,imc:24.1},
  {patient:"Ibrahima Ba",id:"PAT-00375",date:"10/05/2026 08:30",infirmier:"A. Ndiaye",ta:"130/85",fc:68,spo2:96,temp:37.0,poids:78,imc:26.8},
  {patient:"Moussa Diallo",id:"PAT-00341",date:"08/05/2026 14:00",infirmier:"A. Ndiaye",ta:"155/98",fc:88,spo2:95,temp:37.4,poids:92,imc:30.1},
  {patient:"Rokhaya Cissé",id:"PAT-00318",date:"07/05/2026 11:20",infirmier:"A. Ndiaye",ta:"126/82",fc:65,spo2:98,temp:36.8,poids:62,imc:23.5},
];

export const ALERTES = [
  {level:"rouge",msg:"Tension critique — Mamadou Faye · 148/92 mmHg",desc:"Surveillance immédiate. ECG recommandé.",time:"Il y a 2h",source:"Constantes"},
  {level:"rouge",msg:"FA détectée — Moussa Diallo · 67 ans",desc:"ECG du 08/05 : FA confirmée par IA (91%). Cardiologue notifié.",time:"Il y a 4h",source:"ECG / IA"},
  {level:"orange",msg:"Ordonnance expirée — Fatou Sène",desc:"Metformine 500mg expirée depuis 3 jours. Renouvellement requis.",time:"Hier 14:30",source:"Ordonnances"},
  {level:"orange",msg:"Tension élevée persistante — Moussa Diallo",desc:"3 mesures consécutives > 150 mmHg sur 7 jours.",time:"Hier 09:15",source:"Constantes"},
  {level:"orange",msg:"SpO₂ basse — Ibrahima Ba",desc:"93% relevée lors de la dernière prise. Surveillance rapprochée.",time:"Il y a 3 jours",source:"Constantes"},
  {level:"jaune",msg:"RDV confirmé — Ibrahima Ba",desc:"Consultation cardiologie le 18/05 à 09:00 avec Dr. Diallo.",time:"Aujourd'hui 08:15",source:"Agenda"},
];

export const TRANSFERTS = [
  {patient:"Ibrahima Ba",id:"PAT-00375",source:"HGGY — Cardiologie",dest:"CHU de Fann",type:"Programmé",motif:"Bilan complémentaire IC sévère",date:"16/05/2026",statut:"en_cours"},
  {patient:"Moussa Diallo",id:"PAT-00341",source:"HGGY — Cardiologie",dest:"Hôpital Principal",type:"Urgent",motif:"HTA réfractaire avec poussée aiguë",date:"15/05/2026",statut:"complete"},
  {patient:"Aïssatou Diop",id:"PAT-00362",source:"Centre de santé Thiès",dest:"HGGY — Cardiologie",type:"Contre-référence",motif:"Arythmie supraventriculaire récidivante",date:"09/05/2026",statut:"complete"},
  {patient:"Cheikh Ndoye",id:"PAT-00305",source:"HGGY — Cardiologie",dest:"HR de Thiès",type:"Programmé",motif:"Suivi dyslipidémie — retour domicile",date:"05/05/2026",statut:"planifie"},
];

export const CONSULT_DATA = [
  {date:"14/05/2026",patient:"Mamadou Faye",id:"PAT-00412",medecin:"Dr. R. Diallo",type:"Présentiel",diag:"I10 — HTA essentielle"},
  {date:"13/05/2026",patient:"Fatou Sène",id:"PAT-00398",medecin:"Dr. A. Ndiaye",type:"Présentiel",diag:"E11 — DT2 sans complication"},
  {date:"10/05/2026",patient:"Ibrahima Ba",id:"PAT-00375",medecin:"Dr. R. Diallo",type:"Présentiel",diag:"I50.9 — Insuff. cardiaque"},
  {date:"09/05/2026",patient:"Aïssatou Diop",id:"PAT-00362",medecin:"Dr. R. Diallo",type:"Vidéo",diag:"I49.4 — Arythmie supraventri."},
  {date:"08/05/2026",patient:"Moussa Diallo",id:"PAT-00341",medecin:"Dr. B. Fall",type:"Urgence",diag:"I10 + E11 — HTA + DT2"},
];

export const DEPARTEMENTS_PAR_REGION = {
  "Dakar":       ["Dakar","Pikine","Guédiawaye","Rufisque","Keur Massar"],
  "Thiès":       ["Thiès","Mbour","Tivaouane"],
  "Diourbel":    ["Diourbel","Bambey","Mbacké"],
  "Kaolack":     ["Kaolack","Guinguinéo","Nioro du Rip"],
  "Saint-Louis": ["Saint-Louis","Dagana","Podor"],
  "Fatick":      ["Fatick","Foundiougne","Gossas"],
  "Kaffrine":    ["Kaffrine","Birkelane","Koungheul","Malem Hoddar"],
  "Tambacounda": ["Tambacounda","Bakel","Goudiry","Koumpentoum"],
  "Kédougou":    ["Kédougou","Saraya","Salémata"],
  "Kolda":       ["Kolda","Médina Yoro Foulah","Vélingara"],
  "Sédhiou":     ["Sédhiou","Bounkiling","Goudomp"],
  "Ziguinchor":  ["Ziguinchor","Bignona","Oussouye"],
  "Louga":       ["Louga","Kébémer","Linguère"],
  "Matam":       ["Matam","Kanel","Ranérou"],
};
export const REGIONS_SENEGAL = Object.keys(DEPARTEMENTS_PAR_REGION);