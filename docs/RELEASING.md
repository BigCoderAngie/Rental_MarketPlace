# Releasing RentLoop

How every change gets from a branch to the live site without breaking it. The reasons are in `docs/ROADMAP.md` section 2. Claude follows this file for every database change and every release.

| Supabase project | Ref | Used by |
|---|---|---|
| `rentloop-dev` ("Rental Market database") | `dlqkgptkdvjdxkmdfgbr` | your computer, Vercel previews |
| `rentloop-live` | `obrwefzmjygfuhhdoijn` | the live site only |

Your computer stays linked to `rentloop-dev`. It's only linked to `rentloop-live` for the few minutes of a live push (step 5 below).

---

## Database changes: the rules

Database mistakes can't be undone with a click, so they get the strictest rules.

1. **Add, don't change.** A migration may add tables, columns, functions and policies. It must not rename or drop anything the live code still uses. To rename something: add the new thing, switch the code over in one release, and drop the old thing in a later migration ("expand, then contract").
2. **New columns are optional or have a default,** so the live code keeps working the moment the migration lands.
3. **Live database first, code second.** Push the migration to `rentloop-live`, check the live site still works, *then* merge the code that uses it. Because of rule 1, the old code is happy with the new database.
4. **Back up before every live push** (see step 5). Backups go in `backups/`, which git ignores: they contain people's data and must never be committed.
5. **Every migration ships with a database test** in `supabase/tests/`. GitHub runs them on every pull request ("Database rules").
6. **One migration per pull request,** a new file in `supabase/migrations/` with a comment at the top saying in plain words what it does. Never edit an old migration.

## Every release, step by step

1. **Start from fresh `main`:**

   ```powershell
   git switch main
   git pull
   npx supabase migration list
   ```

   If a row has a **Local** version but no **Remote** one, someone added a migration: push it to `rentloop-dev` with `npx supabase db push` before you start.

2. **Build on a branch** named after the task in `docs/TASKS.md`. Claude plans, waits for your OK, builds, runs `/simplify` and `/code-review`, and runs `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.

3. **Open a pull request.** GitHub runs the checks; a red check blocks the merge button. Vercel comments with a **preview address** that uses the test database.

4. **Click through the preview on your phone.** Check what changed and one thing that didn't (sign in, open an item). To show someone else: open the deployment in Vercel → **Share** → copy the shareable link.

5. **If the pull request has a migration**, put it on the live database now, before merging:
   1. Start **Docker Desktop** and wait until it says it's running (the backup command needs it).
   2. Link to the live database and back it up (`<date>` is today, for example `2026-10-28`):

      ```powershell
      npx supabase link --project-ref obrwefzmjygfuhhdoijn
      npx supabase db dump --linked -f backups/live-<date>.sql
      npx supabase db dump --linked --data-only -f backups/live-<date>-data.sql
      ```

      The first file is the tables and rules, the second is the data. Check both files exist and aren't empty.

   3. Push the migration and check it landed:

      ```powershell
      npx supabase db push
      npx supabase migration list
      ```

   4. **Link back to the test database straight away:**

      ```powershell
      npx supabase link --project-ref dlqkgptkdvjdxkmdfgbr
      ```

   5. Open the live site and click through it. It still runs the old code, and must still work (rule 1).

6. **Merge the pull request.** Vercel builds `main` and puts it live in about two minutes.

7. **Check the live site** on your phone, and look at Vercel → your project → **Logs** for red errors.

8. **If the feature has a flag**, it's off on the live site. Turn it on when you're ready (see "Feature flags").

## If the live site breaks

- **The code is wrong:** Vercel → **Deployments** → the last good **Production** deployment → **⋯** → **Instant Rollback**. Then fix it in a new pull request. Details: `docs/setup/vercel.md`, "If a deploy breaks the live site".
- **A feature is wrong:** if it has a flag, turn the flag off and redeploy. That's faster than a rollback.
- **A migration is wrong:** a rollback doesn't undo it. Write a new migration that fixes it, and follow the steps above. Only restore from the backup if data was lost, and ask for help before you do.
