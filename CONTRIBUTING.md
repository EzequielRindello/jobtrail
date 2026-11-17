# Contributing to JobTrail

## Workflow

1. `git pull` before you start.
2. Create a branch from `development` named after your task, for example `feature/extension-sign-in` or `fix/board-drag-order`.
3. Make small commits with clear messages (`feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`). Commit your own work so each task is easy to trace in the sprint report.
4. Open a pull request into `development` and fill in the template.
5. A pull request can be merged only when:
   - the **CI** check passes (format, lint, build and tests), and
   - the team lead has approved it.
6. `development` is merged into `main` when a sprint's work is stable.

## Code style

Formatting and linting are automatic, so nobody has to review them by hand.

- **TypeScript, JSON, Markdown, YAML:** Prettier formats, ESLint checks. Run from the repo root:
  - `npm run format` fixes formatting
  - `npm run lint` shows lint problems (`npm run lint:fix` fixes what it can)
- **C#:** `dotnet format` inside `api/` (settings in `.editorconfig`).
- **VS Code:** install the recommended extensions when prompted. Files are then formatted on save.

Before you push, run `npm run format:check` and `npm run lint`. CI runs the same commands.

## Never commit

- Passwords, API keys, tokens or connection strings. Use `.env` files (ignored by git) and add the variable name to `.env.example`.
- Real personal data. Seed and demo data use made-up people.
