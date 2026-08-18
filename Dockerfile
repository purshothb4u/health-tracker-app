FROM node:22-alpine AS frontend-build

WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:21-jdk-alpine AS backend-build

WORKDIR /workspace/backend
COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline
COPY backend/src/ src/
COPY --from=frontend-build /workspace/frontend/dist/ /workspace/frontend/dist/
RUN ./mvnw -B -Pproduction-package -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S healthtracker && adduser -S -G healthtracker healthtracker
WORKDIR /app
COPY --from=backend-build --chown=healthtracker:healthtracker \
    /workspace/backend/target/health-ai-tracker-0.0.1-SNAPSHOT.jar \
    /app/health-ai-tracker.jar

ENV SPRING_PROFILES_ACTIVE=production
USER healthtracker
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-8080}/api/status" || exit 1

ENTRYPOINT ["java", "-jar", "/app/health-ai-tracker.jar"]
