# HealthAITracker

Mobile-first health and weight-loss tracking application.

## Phase 2 — User Profiles & H2 Database

User profile CRUD is available at `/api/users`. Development seed data creates **Husband** and **Wife** profiles on first startup.

H2 console: `http://localhost:8080/h2-console`  
JDBC URL: `jdbc:h2:file:./data/healthtracker` · User: `sa` · Password: *(empty)*

To re-seed from scratch, stop the backend and delete `backend/data/`.

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
