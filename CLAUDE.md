# MediConnect — Claude Code Context

## Stack
- **Frontend** : React 18, Vite, JSX (main.jsx comme entry point), TailwindCSS
- **Backend** : Spring Boot 3.x, Java 21, Maven, JWT (Spring Security)
- **API** : REST JSON, base URL `http://localhost:8080`
- **Auth** : JWT Bearer token stocké dans localStorage via AuthContext

## Chemins absolus
- Frontend src : `C:\Users\PC\Desktop\Projet transversal\mediconnect\src`
- Backend src   : `C:\Users\PC\Desktop\Projet transversal\Backend-MediConnect\src`
- Couche API déjà initiée : `src/api/files/`

## Architecture frontend
```
src/
├── main.jsx                  ← entry point, Router + ToastContext
├── constants/
│   ├── theme.js              ← C (couleurs), F (fonts), globalCSS
│   ├── icons.js              ← objet I (paths SVG)
│   └── mockData.js           ← données de démo
├── components/
│   ├── ui/                   ← kit base : Icon, Btn, Tag, Badge, Modal, Card, InputField, StatCard, ECGLine
│   ├── toast/ToastContext.jsx ← ToastCtx, provider, useToast
│   ├── map/LeafletMap.jsx
│   └── modals/               ← ModalNouveauPatient, ModalConstantes, ModalRDV, ModalOrdonnance
├── pages/
│   ├── auth/                 ← AuthLayout, LoginPage, RegisterPage, ForgotPasswordPage, OTPPage
│   ├── shared/               ← PageCarto, PagePatients, PageECG, PageOrdonnances, PageAgenda,
│   │                            PageConstantes, PageAlertes, PageTransferts, PageParametresMedecin
│   └── LandingPage.jsx
└── dashboards/               ← MedecinDashboard, AdminDashboard, PatientDashboard
```

## Couche API (src/api/)
Fichiers déjà présents dans `src/api/files/` — à déplacer/finaliser dans `src/api/` :
- `client.js`          ← axios instance, interceptors JWT
- `AuthContext.jsx`    ← user, token, login(), logout()
- `index.js`           ← re-exports de tous les modules
- Modules : `auth.api.js`, `patients.api.js`, `medecins.api.js`, `infirmiers.api.js`,
  `consultations.api.js`, `dossiers.api.js`, `ordonnances.api.js`, `rendezvous.api.js`,
  `examens.api.js`, `transferts.api.js`, `alertes.api.js`, `consentements.api.js`
- Hooks : `usePatients.js` (modèle pour les autres)

## Architecture backend (Spring Boot)
Packages sous `sn.edu.ept.mediconnect` :
- `auth`         → AuthController `/api/auth/**`, JwtService, OtpService
- `users`        → Patient, Medecin (+ Cardiologue), Infirmier + leurs Controllers/Services
- `medical`      → consultation, dossier, examen, ordonnance, rendezvous, transfert, alerte
- `consentement` → Consentement, SignatureConsentement
- `dtos`         → tous les Request/Response DTOs
- `exceptions`   → GlobalExceptionHandler (BadRequest, ResourceNotFound, Validation…)
- `security`     → JwtAuthFilter, SecurityConfig

## Conventions de code
- **Composants** : PascalCase, fichiers `.jsx`
- **Fonctions/variables** : camelCase
- **Imports API** : depuis `src/api/` via l'index (ex: `import { getPatients } from '../api'`)
- **Toast** : toujours utiliser `useToast()` pour les feedbacks (succès/erreur)
- **Erreurs** : catch sur chaque appel API, toast.error() + console.error()
- **Chargement** : état `loading` local dans chaque page/composant qui fetch
- **Pas de console.log** en production
- **Pas de données mockData** dans les pages intégrées (remplacer par appels réels)

## Commandes
- Frontend : `cd "C:\Users\PC\Desktop\Projet transversal\mediconnect" && npm start` (port 5173)
- Backend  : `cd "C:\Users\PC\Desktop\Projet transversal\Backend-MediConnect" && mvn spring-boot:run` (port 8080)
- Tests back : `mvn test`

## Règles importantes
- Ne jamais modifier `constants/theme.js`, `constants/icons.js` sans instruction explicite
- Ne jamais supprimer le mock de `mockData.js` (gardé pour les pages non encore intégrées)
- Garder `AuthLayout.jsx` intact sauf demande explicite
- Les DTOs backend sont la référence pour les shapes des objets (dossier `dtos/`)
- CORS déjà configuré côté back (`CorsConfig.java`) pour `localhost:5173`

## Ne pas toucher
- `node_modules/`, `target/`, `.env`, `*.lock`, `dist/`, `build/`
