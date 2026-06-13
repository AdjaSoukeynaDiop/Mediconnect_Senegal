# MediConnect — Guide d'intégration Frontend ↔ Backend
## Basé sur les sources réelles (AuthController, PatientController, MedecinController, SecurityConfig, application.properties)

---

## 1. Configuration

```
Backend : http://localhost:8080
Frontend : http://localhost:3000  (ou 4200 selon VITE_PORT)
JWT expiration : 24h (86400000 ms)
CORS autorisé : localhost:3000, localhost:4200
```

Créer `.env` à la racine du projet React :
```
VITE_API_URL=http://localhost:8080
```

---

## 2. Format de réponse Spring (confirmé dans les controllers)

### Succès
```json
{ "success": true, "message": "...", "data": {...}, "timestamp": "..." }
```
### Erreur
```json
{ "success": false, "message": "..." }
```
> Le client Axios (`src/api/client.js`) lit `error.response.data.message` → exposé comme `error.apiMessage`.

---

## 3. Authentification

### Login
```
POST /api/auth/login
Body : LoginRequest  ← ⚠️ vérifier champs exacts dans LoginRequest.java
Retour : { success, message, data: AuthenticationResponse }
AuthenticationResponse : { token, refreshToken, user: UserDto }
UserDto : { userId, prenom, nom, email, telephone, role }
```

**Le frontend stocke `data.token` dans `localStorage("accessToken")`.**
Chaque requête suivante ajoute `Authorization: Bearer <token>`.

### Logout
```
POST /api/auth/logout
Header : Authorization: Bearer <token>
→ Le backend blackliste le token côté serveur
→ Le frontend supprime le token du localStorage
```
> Pas de refresh token géré côté frontend : expiration = déconnexion propre.

---

## 4. Règles métier confirmées

| Règle | Source |
|---|---|
| Patient NE peut PAS s'inscrire lui-même | `@PreAuthorize("hasRole('INFIRMIER')")` sur `POST /api/patients` |
| Infirmier voit SEULEMENT ses propres patients | `patientService.getByInfirmier(id)` dans `getAll()` |
| Médecin voit seulement son propre profil | `BusinessException.forbidden()` dans `MedecinController.getById()` |
| Login avec email OU telephone | `findByEmailOrTelephone(username, username)` dans `UserDetailsService` |
| Pas de DELETE patient | Non présent dans `PatientController` |
| Soft delete médecin | `medecinService.supprimer()` → désactivation logique |

---

## 5. Routes publiques (sans JWT)

```
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/logout
GET  /api/auth/validate-token
GET  /v3/api-docs/**  (Swagger)
GET  /swagger-ui/**
```

---

## 6. Ce qui reste à confirmer (fichiers non partagés)

| Fichier | Ce qu'il faut vérifier |
|---|---|
| `LoginRequest.java` | Nom exact du champ : `email` ou `emailOrTelephone` ? |
| `ForgotPasswordRequest.java` | `{ email }` seul ou `{ email, telephone, canal }` ? |
| `VerifyOtpRequest.java` | `{ email, code }` ou `{ email, code, type }` ? |
| `ResetPasswordRequest.java` | `{ email, code, newPassword }` ou `{ token, newPassword }` ? |
| `ResendOtpRequest.java` | Confirmé : `{ email?, telephone? }` (vu dans AuthController) |
| `CreatePatientRequest.java` | Tous les champs du formulaire |
| `PatientResponse.java` | Noms exacts des champs (ex: `numeroPatient`, `statut`…) |
| `Role.java` (enum) | Valeurs exactes : `MEDECIN` ou `ROLE_MEDECIN` ? |

**Recommandation** : accéder à `http://localhost:8080/swagger-ui/index.html`
après démarrage du backend pour voir TOUS les schémas de requête/réponse.

---

## 7. Structure des fichiers générés

```
src/
├── api/
│   ├── client.js          ← Axios + intercepteurs + normalisation erreurs
│   ├── auth.api.js        ← Tous les endpoints /api/auth/*
│   ├── patients.api.js    ← /api/patients (CRUD + activate/desactiver)
│   └── medecins.api.js    ← /api/medecins (CRUD + activate/desactivate)
│
├── context/
│   └── AuthContext.jsx    ← État global auth + rôles + routing post-login
│
├── hooks/
│   └── usePatients.js     ← State management patients (fetch, search, create…)
│
└── pages/auth/
    ├── LoginPage.jsx          ← Login avec gestion erreurs API réelles
    ├── ForgotPasswordPage.jsx ← POST /api/auth/forgot-password
    └── OTPPage.jsx            ← verify-otp + reset-password (2 étapes)
```
