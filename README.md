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
├── api/         ASP.NET Core Web API
├── web/         React web app
└── extension/   Browser extension
```

## Getting started

Setup instructions (prerequisites, database, environment variables and run commands) will be added in Sprint 1, together with the project skeleton.

## Team

- Ezequiel Rindello
- Vera Antamanova

## Favorite quotes

Each team member adds one favorite quote here.

> Surely he hath borne our griefs, and carried our sorrows: yet we did esteem him stricken, smitten of God, and afflicted. But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.
>
> Isaiah 53:4-5 (KJV), chosen by Ezequiel Rindello
