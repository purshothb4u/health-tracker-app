# AGENTS.md

## Project

HealthAITracker

This is a personal health tracking application.

The primary goal is to help users track their health, nutrition, and fitness while following clean software architecture and production-ready development practices.

---

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

### Backend

- Java
- Spring Boot
- Maven

### Database

Development:
- H2 Database

Production:
- PostgreSQL

---

## Architecture

Always follow this structure:

Controller
→ Service
→ Repository
→ Entity
→ DTO

Business logic belongs in the Service layer.

Never place business logic inside Controllers.

---

## Development Rules

Before writing code:

- Understand the existing project.
- Read all related files.
- Explain the implementation plan.
- Wait for approval.

While coding:

- Make small changes.
- Preserve existing functionality.
- Avoid duplicate code.
- Follow existing naming conventions.
- Keep code readable.
- Use reusable services.

After coding:

- Verify backend builds successfully.
- Verify frontend builds successfully.
- Fix compilation errors.
- Explain every important change.

---

## Database Rules

Use normalized tables.

Prefer future-proof entity names.

Example:

HealthMetric

instead of

WeightEntry

Never mix unrelated domains into one table.

Examples:

HealthMetric

FoodEntry

ExerciseEntry

SleepEntry

MedicationEntry

---

## Roadmap

Phase 1
User Profile

Phase 2
Dashboard

Phase 3
Health Metrics

Phase 4
Food Tracking

Phase 5
AI Food Recognition

Phase 6
Exercise Tracking

Phase 7
Analytics

Phase 8
AWS Deployment

---

## General Rules

Never delete code without explaining why.

Never rename large parts of the project without approval.

Always ask before making breaking changes.

Always prefer clean architecture over quick fixes.

When unsure, ask questions before implementing.