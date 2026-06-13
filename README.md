# MediConnect Sénégal

**Plateforme nationale de télémédecine et de gestion médicale**

MediConnect est une application web full-stack conçue pour centraliser et digitaliser la gestion médicale au Sénégal. Elle permet la coordination entre patients, médecins, infirmiers, assistants médicaux et administrateurs au sein d'un système de santé connecté.

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancer le projet](#lancer-le-projet)
- [Documentation API](#documentation-api)
- [Rôles et accès](#rôles-et-accès)
- [Structure des dossiers](#structure-des-dossiers)

---

## Fonctionnalités

### Patients
- Inscription avec vérification OTP (email + SMS)
- Tableau de bord personnel : consultations, ordonnances, rendez-vous
- Dossier médical numérique
- Suivi des constantes (pression artérielle, glycémie, SpO₂…)
- Visualisation ECG
- Prise de rendez-vous (présentiel, vidéo, urgence)
- Signature de consentements médicaux

### Médecins & Cardiologues
- Gestion de la liste de patients
- Création et suivi des consultations
- Rédaction d'ordonnances numériques
- Prescription d'examens
- Agenda et gestion des rendez-vous
- Transferts de patients inter-établissements
- Vue cartographique de la patientèle

### Infirmiers & Assistants médicaux
- Enregistrement des constantes vitales
- Suivi des alertes cliniques
- Gestion des transferts
- Accès au dossier médical patient

### Administrateurs
- Tableau de bord avec statistiques globales (patients, médecins, infirmiers, assistants, hôpitaux)
- Gestion de tous les comptes utilisateurs (activation / désactivation)
- Journal d'activité en temps réel
- Gestion des établissements de santé
- Carte interactive : répartition des patients, localisation des hôpitaux, zones à risque
- Export CSV

---

## Stack technique

### Frontend

| Technologie | Version |
|---|---|
| React | 19.x |
| React Router DOM | 7.x |
| TailwindCSS | via classes utilitaires |
| Leaflet.js | 1.9.4 (CDN) |
| jsPDF | 4.x |
| Axios | via client centralisé |

### Backend

| Technologie | Version |
|---|---|
| Java | 17 |
| Spring Boot | 4.0.6 |
| Spring Security | 6.x |
| Spring Data JPA | (Hibernate) |
| PostgreSQL | 15+ |
| JWT (jjwt) | 0.11.5 |
| Lombok | dernière stable |
| ModelMapper | 3.2.0 |
| Twilio SDK | 9.12.0 |
| SpringDoc OpenAPI | 2.8.9 |
| Flyway | 10.x (géré par Spring Boot) |

### Services externes

| Service | Usage |
|---|---|
| Gmail SMTP | Envoi d'emails (OTP, bienvenue, reset mot de passe) |
| Twilio Verify | Vérification OTP par SMS |
| Twilio WhatsApp | Notifications alternatives |
| OpenStreetMap / Leaflet | Cartographie interactive |

---

## Architecture

```
Projet transversal/
├── mediconnect/              ← Frontend React (port 3000)
│   └── src/
│       ├── api/              ← Couche HTTP (Axios + intercepteurs JWT)
│       ├── components/       ← Composants réutilisables (UI kit, carte, modals)
│       ├── constants/        ← Thème, icônes SVG, données de démo
│       ├── dashboards/       ← Dashboards par rôle (Admin, Médecin, Patient…)
│       └── pages/            ← Pages partagées (Agenda, Patients, ECG, Carto…)
│
└── Backend-MediConnect/      ← Backend Spring Boot (port 8080)
    └── src/main/java/sn/edu/ept/mediconnect/
        ├── admin/            ← Statistiques et journal admin
        ├── auth/             ← Authentification, JWT, OTP, emails, SMS
        ├── config/           ← CORS, OpenAPI, Jackson, DataInitializer
        ├── medical/          ← Consultations, dossiers, ordonnances, examens,
        │                        rendez-vous, transferts, alertes
        ├── users/            ← Patient, Médecin, Infirmier, Assistant (héritage JPA)
        ├── consentement/     ← Consentements et signatures
        ├── dtos/             ← Request / Response DTOs
        ├── exceptions/       ← GlobalExceptionHandler
        └── security/         ← JwtAuthFilter, SecurityConfig
```

**Héritage JPA** — les quatre types d'utilisateurs (`Patient`, `Medecin`, `Infirmier`, `Assistant`) étendent une entité `User` commune via *Joined Table Inheritance* et un discriminateur de type (`@DiscriminatorValue`).

---

## Prérequis

- **Node.js** ≥ 18 et **npm** ≥ 9
- **Java** 17 (JDK)
- **Maven** 3.9+
- **PostgreSQL** 15+ (instance locale ou distante)
- Un compte **Gmail** avec mot de passe d'application généré
- Un compte **Twilio** avec un numéro et un service Verify (optionnel — le mode `log` est disponible)

---

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-depot>
cd "Projet transversal"
```

### 2. Base de données

Créer la base PostgreSQL :

```sql
CREATE DATABASE mediconnect;
```

Le schéma est géré en deux couches complémentaires :

- **Hibernate** (`ddl-auto=update`) — crée les tables et ajoute les colonnes manquantes au démarrage.
- **Flyway** — s'exécute juste avant Hibernate et applique les migrations versionnées (`db/migration/V*.sql`) pour tout ce qu'Hibernate ne peut pas corriger seul : contraintes CHECK, colonnes devenant nullable, clés étrangères ajoutées.

Sur une base existante, Flyway démarre avec `baseline-on-migrate=true` : il enregistre l'état courant comme ligne de base (version 0) puis applique uniquement les scripts V1, V2… non encore exécutés.

Des données initiales (hôpitaux, adresses) sont chargées depuis :
- `Backend-MediConnect/src/main/resources/data.sql`
- `Backend-MediConnect/src/main/resources/hopitaux-data.sql`
- `Backend-MediConnect/src/main/resources/adresses-data.sql`

### 3. Backend — dépendances Maven

```bash
cd Backend-MediConnect
mvn install -DskipTests
```

### 4. Frontend — dépendances npm

```bash
cd ../mediconnect
npm install
```

---

## Configuration

### Backend — `application.properties`

Fichier : `Backend-MediConnect/src/main/resources/application.properties`

```properties
# ── Base de données ────────────────────────────────────────────────
spring.datasource.url=jdbc:postgresql://localhost:5432/mediconnect
spring.datasource.username=postgres
spring.datasource.password=VOTRE_MOT_DE_PASSE

# ── JWT ───────────────────────────────────────────────────────────
app.jwt.secret=VOTRE_SECRET_HEX_64_CHARS
app.jwt.expiration=86400000

# ── Email (Gmail) ─────────────────────────────────────────────────
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=VOTRE_EMAIL@gmail.com
spring.mail.password=VOTRE_MOT_DE_PASSE_APPLICATION

# ── Twilio (SMS / Verify) ─────────────────────────────────────────
twilio.account-sid=VOTRE_ACCOUNT_SID
twilio.auth-token=VOTRE_AUTH_TOKEN
twilio.phone-number=+1XXXXXXXXXX
twilio.verify-service-sid=VAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
app.sms.provider=log          # log | twilio | whatsapp

# ── URL frontend (CORS) ───────────────────────────────────────────
app.frontend.url=http://localhost:3000
```

> Pour Gmail, activez l'authentification à deux facteurs et générez un **mot de passe d'application** dans les paramètres de sécurité du compte.

### Frontend

Le frontend appelle `http://localhost:8080` par défaut. Pour modifier l'URL de l'API, éditez `mediconnect/src/api/client.js`.

---

## Lancer le projet

### Backend (Spring Boot)

```bash
cd Backend-MediConnect
mvn spring-boot:run
```

Le serveur démarre sur **http://localhost:8080**.

### Frontend (React)

```bash
cd mediconnect
npm start
```

L'application s'ouvre sur **http://localhost:3000**.

### Tests backend

```bash
cd Backend-MediConnect
mvn test
```

---

## Documentation API

Une interface Swagger UI est disponible à l'adresse :

```
http://localhost:8080/swagger-ui/index.html
```

La spécification OpenAPI (JSON) est accessible sur :

```
http://localhost:8080/v3/api-docs
```

### Principaux groupes d'endpoints

| Préfixe | Description |
|---|---|
| `POST /api/auth/**` | Inscription, connexion, OTP, reset mot de passe |
| `GET /api/patients/**` | Gestion des patients |
| `GET /api/medecins/**` | Gestion des médecins |
| `GET /api/infirmiers/**` | Gestion des infirmiers |
| `GET /api/assistants/**` | Gestion des assistants médicaux |
| `GET /api/hopitaux` | Liste des établissements (public) |
| `/api/consultations/**` | Consultations médicales |
| `/api/ordonnances/**` | Ordonnances |
| `/api/rendezvous/**` | Rendez-vous |
| `/api/transferts/**` | Transferts patients |
| `/api/examens/**` | Examens médicaux |
| `/api/alertes/**` | Alertes cliniques |
| `/api/admin/**` | Administration (ADMIN uniquement) |

### Authentification

Toutes les requêtes protégées doivent inclure le header :

```
Authorization: Bearer <token_jwt>
```

Le token est obtenu via `POST /api/auth/login` et stocké dans le `localStorage` par le frontend.

---

## Rôles et accès

| Rôle | Description | Accès |
|---|---|---|
| `ADMIN` | Administrateur système | Toutes les ressources |
| `MEDECIN` | Médecin généraliste | Patients, consultations, ordonnances, agenda |
| `CARDIOLOGUE` | Médecin cardiologue | Idem + ECG, accès cardiologique |
| `INFIRMIER` | Infirmier(ère) | Constantes, alertes, dossiers |
| `ASSISTANT` | Assistant médical | Support, transferts, agenda |
| `PATIENT` | Patient | Propre dossier, RDV, ordonnances |

Les endpoints publics (sans authentification) sont :
- `POST /api/auth/register`, `login`, `verify-otp`, `resend-otp`, `forgot-password`, `reset-password`
- `GET /api/hopitaux`
- `GET /api/ordre-medecins/lookup`
- Swagger UI et docs OpenAPI

---

## Structure des dossiers

### Frontend (`mediconnect/src/`)

```
api/
├── client.js               ← Instance Axios + intercepteur JWT + gestion 401
├── AuthContext.jsx          ← Contexte React : user, token, login(), logout()
├── index.js                ← Re-exports centralisés
├── auth.api.js             ← Inscription, connexion, OTP
├── patients.api.js         ← CRUD patients
├── medecins.api.js         ← CRUD médecins
├── infirmiers.api.js       ← CRUD infirmiers
├── assistants.api.js       ← CRUD assistants
├── consultations.api.js    ← Consultations
├── ordonnances.api.js      ← Ordonnances
├── rendezvous.api.js       ← Rendez-vous
├── transferts.api.js       ← Transferts
├── examens.api.js          ← Examens
├── alertes.api.js          ← Alertes
├── dossiers.api.js         ← Dossiers médicaux
├── hopitaux.api.js         ← Hôpitaux
└── consentements.api.js    ← Consentements

components/
├── ui/                     ← Kit de base : Btn, Card, Modal, InputField, Badge,
│                              Tag, StatCard, Icon, ECGLine
├── map/LeafletMap.jsx      ← Carte interactive (patients, hôpitaux, zones à risque)
├── toast/ToastContext.jsx  ← Notifications toast
└── modals/                 ← ModalNouveauPatient, ModalConstantes, ModalRDV,
                               ModalOrdonnance

constants/
├── theme.js                ← Palette couleurs (C), typographie (F), CSS global
├── icons.js                ← Icônes SVG centralisées (objet I)
└── mockData.js             ← Données de démo (pages non encore intégrées)

dashboards/
├── AdminDashboard.jsx      ← Stats, gestion utilisateurs, journal, carte
├── MedecinDashboard.jsx    ← Agenda, patients, consultations, ordonnances
├── PatientDashboard.jsx    ← Dossier, RDV, constantes, ordonnances
└── AssistantDashboard.jsx  ← Vue support

pages/shared/
├── PageAgenda.jsx          ← Calendrier et rendez-vous
├── PagePatients.jsx        ← Liste et fiche patient
├── PageCarto.jsx           ← Carte géographique interactive
├── PageECG.jsx             ← Visualisation ECG
├── PageOrdonnances.jsx     ← Gestion des ordonnances
├── PageConstantes.jsx      ← Constantes vitales
├── PageAlertes.jsx         ← Alertes cliniques
├── PageTransferts.jsx      ← Transferts inter-établissements
├── PageDossierMedical.jsx  ← Dossier médical complet
└── PageParametresMedecin.jsx ← Paramètres du compte médecin
```

### Backend (`src/main/java/sn/edu/ept/mediconnect/`)

```
auth/
├── controllers/AuthController.java     ← /api/auth/**
└── services/
    ├── AuthService.java                ← Logique inscription / connexion / OTP
    ├── JwtService.java                 ← Génération et validation des tokens
    ├── OtpService.java                 ← Génération et vérification OTP
    ├── EmailService.java               ← Envoi emails (Gmail SMTP)
    └── SmsService.java                 ← Envoi SMS (Twilio)

users/
├── User.java                           ← Entité de base (@Inheritance JOINED)
├── patient/                            ← Patient + Controller + Service + Repo
├── medecin/                            ← Medecin + Controller + Service + Repo
├── infirmier/                          ← Infirmier + Controller + Service + Repo
└── assistant/                          ← Assistant + Controller + Service + Repo

medical/
├── consultation/
├── dossier/
├── examen/
├── ordonnance/
├── rendezvous/
├── transfert/
└── alerte/

admin/AdminController.java              ← /api/admin/stats + /api/admin/activity
security/
├── JwtAuthFilter.java                  ← Filtre JWT sur chaque requête
└── SecurityConfig.java                 ← Règles d'autorisation + BCrypt
```

### Migrations Flyway (`src/main/resources/db/migration/`)

```
V1__fix_constraints.sql   ← Contraintes CHECK (rendez_vous, transferts, users, alertes)
                             + colonnes nullable / manquantes corrigées idempotentement
```

---

