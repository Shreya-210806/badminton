# ShuttlePulse — Standalone Badminton Organizer & Referee CRM (MERN)

Complete, role-protected MERN Organizer CRM & Referee Court Scoring Console for managing badminton tournaments, player records, doubles pairings, draws/fixtures, BWF 3×21 match scoring, PCI-safe payment tracking, communications, CSV reports, audit logs, and staff settings.

## Dedicated Page Directory Structure (`client/src/pages/`)

Every CRM & Referee screen lives inside its own dedicated folder:

```text
badminton-organizer-crm/
├── client/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       └── pages/
│           ├── login/                    -> CrmLoginPage.jsx
│           ├── overview/                 -> OverviewPage.jsx
│           ├── player-crm/               -> PlayerCrmPage.jsx
│           ├── tournament-management/    -> TournamentManagementPage.jsx
│           ├── registration-management/  -> RegistrationManagementPage.jsx
│           ├── doubles-teams/            -> DoublesTeamsPage.jsx
│           ├── draws-fixtures/           -> DrawsFixturesPage.jsx
│           ├── match-scoring/            -> MatchScoringPage.jsx
│           ├── payment-tracking/         -> PaymentTrackingPage.jsx
│           ├── communications/           -> CommunicationsPage.jsx
│           ├── reports/                  -> ReportsPage.jsx
│           ├── audit-log/                -> AuditLogPage.jsx
│           ├── settings/                 -> SettingsPage.jsx
│           └── referee-console/          -> RefereeConsolePage.jsx
└── server/
    └── src/
        ├── config/       (DynamoDB connection, Parameter Store secrets loader)
        ├── controllers/  (auth, public, player, match, crm)
        ├── middleware/   (JWT + role enforcement)
        ├── models/       (11 DynamoDB-backed models, see src/db/odm.js)
        ├── routes/       (REST endpoints)
        ├── seed/         (Realistic tournaments, players, fixtures, payments)
        └── utils/        (BWF 3x21 validator, CSV exporter, Audit logger)
```

## Quick Start

### Option A — Windows 1-Click Launcher
Double-click `START_CRM.bat`. It installs dependencies if needed, launches the Express API (`http://localhost:5000`) and Vite CRM frontend (`http://localhost:5174`), and opens your browser.

### Option B — Manual Terminal Commands

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Configure environment variables (optional — defaults work out of the box)
cp server/.env.example server/.env

# 3. Start local DynamoDB emulator, then the Backend API (Terminal 1 — Port 5000)
# Local DynamoDB emulator (separate terminal): cd server && npm run dev:local-db
cd server
npm run dev

# 4. Start CRM Frontend (Terminal 2 — Port 5174)
cd client
npm run dev
```

> **Running Alongside the Public Website**: The Public Website runs on `http://localhost:5173` and this Organizer CRM runs on `http://localhost:5174`. Both connect seamlessly to `http://localhost:5000` so live score updates, new tournament publications, and registrations sync immediately!

## Demo Staff Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin (Director)** | `admin@shuttlepulse.org` | `Admin@123` | Full CRM + Staff Account Creation + Settings |
| **Organizer** | `organizer@shuttlepulse.org` | `Organizer@123` | Full CRM Operations, Draws, Scoring, Payments, Reports |
| **Referee (Court 1–2)** | `referee@shuttlepulse.org` | `Referee@123` | Assigned Court Match Scoring Only (`/referee`) |
| **Referee (Court 3–4)** | `referee2@shuttlepulse.org` | `Referee@123` | Assigned Court Match Scoring Only (`/referee`) |

## Environment Variables (`server/.env`)

- `PORT=5000`
- `JWT_SECRET=shuttlepulse_super_secret_jwt_key_change_in_prod`
- `JWT_EXPIRES_IN=7d`
- `CLIENT_URL=http://localhost:5174`


## AWS Architecture & Deployment

| Service | Purpose |
|---|---|
| Amazon DynamoDB | Database (11 tables, auto-created, auto-seeded) |
| AWS Elastic Beanstalk | Hosts the Express API |
| AWS Amplify Hosting | Builds & hosts the React client |
| Amazon SES | Password-reset and announcement emails |
| Systems Manager Parameter Store | `JWT_SECRET` and other secrets |

Full step-by-step guide: [`deploy/AWS_DEPLOYMENT.md`](deploy/AWS_DEPLOYMENT.md).
