@AGENTS.md

See README.md for the stack, folders, how to run it and the rules for changing code.

## How we work in this repo

Stack: Next.js 16 (App Router, read node_modules/next/dist/docs before using unfamiliar APIs), React 19, Tailwind v4, Supabase (Postgres + RLS), Vitest. Namibian rental marketplace: money is N$ via `formatNad` in src/lib/money.ts, WhatsApp links via src/lib/whatsapp.ts.

### Tools and when to use them
- **theme-factory skill**: only when changing the site's look. The theme lives as CSS variables in `src/app/globals.css` (`:root` + `@theme inline`). Never hard-code colours or fonts in components; use the tokens (`bg-primary`, `text-primary-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-accent-soft`, `text-danger`, ...), never Tailwind's built-in palette (`zinc`, `emerald`, `amber`, `red`, ...). Every text colour must be at least 4.5:1 on its background. Marigold (`accent`) is a fill only, with `text-accent-foreground` on top: never use it as a text colour; use `text-accent-ink` for warning text. Keep `danger` (terracotta) for overdue, unpaid, problems and errors.
- **frontend-design skill**: for any work in `src/app/**` or `src/components/**` that changes what users see. Reuse `src/components/ui.tsx` before creating new components. Every page must work on a phone (most customers use WhatsApp links on mobile).
- **/simplify**: after a feature works, run it on the files changed in this task only. It must not change behaviour, rename exported functions, or touch files outside the task.
- **/code-review**: after simplifying, before committing. Review `git diff main...HEAD` plus uncommitted changes.

### Workflow for every task
1. Plan first: list files to change and say which tool each step uses. Wait for my OK on anything bigger than one page.
2. Logic goes in `src/lib/*.ts` with a matching `*.test.ts`. UI stays thin.
3. Database changes are a new file in `supabase/migrations/` with RLS policies; never edit an old migration.
4. Build (frontend-design skill for UI).
5. Run /simplify on the changed files.
6. Run /code-review. Fix every real bug it finds; list anything you chose not to fix and why.
7. Run `npm run lint && npm run typecheck && npm test` and fix failures. Run `npm run build` before a PR.
8. Show me a short summary and a suggested commit message. Don't commit until I say so.

### Rules
- One feature per branch. Small commits.
- Don't add new npm packages without asking.
- Never put secrets in code; use `.env.local` (see `.env.example`).
