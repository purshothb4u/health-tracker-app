# HealthAITracker

Mobile-first health and weight-loss tracking application.

## Phase 2 — User Profiles & H2 Database

Authenticated profile APIs are available under `/api/users`. Development seed data is opt-in and can create **Husband** and **Wife** profiles for local use.

H2 console when explicitly enabled for local development: `http://localhost:8080/h2-console`
JDBC URL: `jdbc:h2:file:./data/healthtracker-local` · User: `sa` · Password: *(empty)*

The local schema is created by Flyway. The legacy `backend/data/healthtracker.mv.db`
file is intentionally not migrated, repaired, deleted, or used by the application.
To recreate only the current local database, stop the backend and remove
`backend/data/healthtracker-local.mv.db`.

### Prerequisites

- Node.js 18+
- Java 21 (LTS)
- Maven 3.9+

### Run Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Or, if Maven is installed globally:

```powershell
cd backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8080`

Verify: `GET http://localhost:8080/api/status`

### Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Expected Result

With both services running, the frontend displays:

**Health Tracker Connected Successfully**
