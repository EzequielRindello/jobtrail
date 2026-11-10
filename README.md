# JobTrail

Job application tracker: a browser extension that saves the job post you are looking at in one click, and a web app with a board that tracks every application from **Saved** to **Offer**.

> Senior project for CSE 499 (BYU-Idaho). Work in progress.

## Features

**Core**

- **User accounts:** register, log in and log out. Each user only sees their own applications.
- **Browser extension (Chrome and Edge):** one click reads the job post on the current tab (title, company, location, description and link) from the page's structured job data. The user reviews and edits it before saving, or fills it in by hand when the page has no structured data.
- **Application board:** a kanban board with the stages Saved, Applied, Interview, Offer and Rejected. Drag a card to change its stage; every change is recorded with its date.
- **Application details:** notes, contact person, salary range, resume version and key dates. A copy of the job description is kept even if the original post is taken down.
- **Search and filters:** by company or job title, stage and date.

**Enhancements**

- CSV export of all applications.
- Follow-up reminders with an extension badge and browser notifications.
- Statistics: applications per week, response rate and average time in each stage.
- Skills match: which of your skills a job post asks for, and which are missing.

## Tech stack

| Part              | Technology                                                          |
| ----------------- | ------------------------------------------------------------------- |
| Web app           | React, Vite, TypeScript                                             |
| Browser extension | TypeScript, Manifest V3 (Chrome and Edge)                           |
| API               | ASP.NET Core Web API (.NET 10), Entity Framework Core, JWT, Swagger |
| Database          | PostgreSQL                                                          |
| Tests             | xUnit (API), Vitest (web app and extension)                         |
| CI                | GitHub Actions                                                      |

## Repository structure

```
jobtrail/
├── api/                   ASP.NET Core Web API
│   ├── JobTrail.Api/        controllers, services, EF Core models and migrations
│   └── JobTrail.Api.Tests/  xUnit tests
├── web/                   React web app
├── extension/             Browser extension (Sprint 2)
├── docs/                  Database design and other docs
└── docker-compose.yml     Local PostgreSQL
```

## Getting started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (runs PostgreSQL), or your own PostgreSQL 16+

### 1. Database

From the repo root, create your `.env` file and choose a password in it:

```bash
cp .env.example .env
docker compose up -d
```

This starts PostgreSQL 17 on **localhost:5433** (5433 so it doesn't clash with a PostgreSQL already installed on 5432). The data is kept in a Docker volume between restarts. `docker compose down` stops it.

### 2. API

Secrets are kept out of the repo with [user-secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets). From `api/`:

```bash
dotnet tool restore
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5433;Database=jobtrail;Username=jobtrail;Password=<POSTGRES_PASSWORD from .env>" --project JobTrail.Api
dotnet user-secrets set "Jwt:Key" "<random string, at least 32 characters>" --project JobTrail.Api
dotnet run --project JobTrail.Api
```

To generate a JWT key: `openssl rand -base64 48` (macOS, Linux, Git Bash) or, in PowerShell 7, `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))`.

The API runs on **http://localhost:5080**. On startup it creates or updates the database tables and, in Development only, a demo user you can log in with right away: `jobtrail@jobtrail.com` / `Password1!`. The interactive API docs are at **http://localhost:5080/swagger**: register or log in there, copy the `token`, click **Authorize** and paste it to try the protected endpoints.

Tests: `dotnet test` from `api/` (they use an in-memory database, so PostgreSQL is not needed).

### 3. Web app

From `web/`:

```bash
npm install
npm run dev
```

The web app runs on **http://localhost:5173** (the API accepts requests from this origin).

### Environment variables (deployment)

Locally everything above is enough. On a server, set these instead of user-secrets:

| Variable                     | Example                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| `ConnectionStrings__Default` | `Host=...;Database=...;Username=...;Password=...`            |
| `Jwt__Key`                   | random string, at least 32 characters                        |
| `Cors__AllowedOrigins__0`    | URL of the deployed web app, e.g. `https://jobtrail.example` |

## API

All endpoints are documented in Swagger. Sprint 1 covers accounts:

| Endpoint                  | Token | Body                               | Result                                                  |
| ------------------------- | ----- | ---------------------------------- | ------------------------------------------------------- |
| `POST /api/auth/register` | no    | `{ email, password, displayName }` | `200` with `{ token, expiresAt, user }`, `409` if taken |
| `POST /api/auth/login`    | no    | `{ email, password }`              | `200` with `{ token, expiresAt, user }`, `401` if wrong |
| `POST /api/auth/logout`   | yes   |                                    | `204`. That token stops working; other devices stay in  |
| `GET /api/auth/me`        | yes   |                                    | `200` with `{ id, email, displayName }`, `401` if not   |

Send the token on every protected request as `Authorization: Bearer <token>`. Tokens last 7 days. Errors use the standard [ProblemDetails](https://www.rfc-editor.org/rfc/rfc9457) JSON format, and validation errors (`400`) list the problem for each field under `errors`.

The database design is described in [docs/database.md](docs/database.md).

## Team

- Ezequiel Rindello
- Vera Antamanova

## Favorite quotes

Each team member adds one favorite quote here.

> Surely he hath borne our griefs, and carried our sorrows: yet we did esteem him stricken, smitten of God, and afflicted. But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.
>
> Isaiah 53:4-5 (KJV), chosen by Ezequiel Rindello

> And if men come unto me I will show unto them their weakness. I give unto men weakness that they may be humble; and my grace is sufficient for all men that humble themselves before me; for if they humble themselves before me, and have faith in me, then will I make weak things become strong unto them.
>
> Ether 12:27 (Book of Mormon), chosen by Vera Antamanova
