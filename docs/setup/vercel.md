# Put RentLoop on Vercel

These steps put `main` on a real web address, with a separate live database, following `docs/ROADMAP.md` section 2. You do the clicking; nothing here changes app code. It takes about an hour the first time.

**When you're done:**
- `main` is live at `https://rental-market-place-ochre.vercel.app` and uses the **live** database.
- Every pull request gets its own preview address that uses the **test** database and is hidden behind Vercel sign-in.
- A red GitHub check blocks the merge button.

| Supabase project | Used by | Data |
|---|---|---|
| `rentloop-dev` (the project you have now, ref `dlqkgptkdvjdxkmdfgbr`) | your computer, Vercel previews, demos | test data, safe to delete |
| `rentloop-live` (new) | the live Vercel site only | real users |

In the commands below, type everything exactly as shown, except text in `<angle brackets>`: replace it, brackets included, with your own value.

---

## Part 1. Rename the project you have now (2 minutes)

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) and click your current project.
2. Click **Project Settings** (the cog, bottom left) → **General**.
3. Change **Project name** to `rentloop-dev` and click **Save**.

Only the name changes. The address, keys and data stay the same, so your `.env.local` keeps working.

## Part 2. Create the live database (15 minutes)

1. In the Supabase dashboard, click **New project**.
2. Fill in:
   - **Name:** `rentloop-live`
   - **Database password:** click **Generate a password**, then copy it into your password manager. You need it in step 5 and Supabase never shows it again.
   - **Region:** the same region as `rentloop-dev` (check it on rentloop-dev's **Project Settings → General**).
   - **Plan:** Free.
3. Click **Create new project** and wait until it says the project is ready (1 to 2 minutes).
4. Copy the **project ref**: it's the code in the address bar after `/project/`. Example: in `supabase.com/dashboard/project/abcd1234efgh`, the ref is `abcd1234efgh`. Write it down; it's `<live-ref>` below.
5. Apply every migration to the live database. Open PowerShell and run these one at a time:

   ```powershell
   cd "C:\Dev\Rental Market\Rental_MarketPlace"
   git checkout main
   git pull
   npx supabase link --project-ref <live-ref>
   ```

   When it asks for the database password, paste the one from step 2 (nothing shows while you paste; that's normal) and press Enter.

   ```powershell
   npx supabase db push
   ```

   It lists every migration and asks `Do you want to push these migrations?`. Type `Y` and press Enter. It finishes with `Finished supabase db push.`

   `db push` does not run `supabase/seed.sql`, so no test data reaches the live database. That's what we want.

6. Check it worked:

   ```powershell
   npx supabase migration list
   ```

   Every line must have the same timestamp in both the **Local** and **Remote** columns.

7. **Switch back to the test database.** Your computer must always be linked to `rentloop-dev`, or your next `db push` would change the live database:

   ```powershell
   npx supabase link --project-ref dlqkgptkdvjdxkmdfgbr
   ```

   (Password: the `rentloop-dev` database password.)

8. In `rentloop-live`, click **Authentication → Sign In / Providers → Email** and make the switches match `rentloop-dev` (open both in two tabs and compare). Click **Save**.

9. Copy the live keys for Part 3. In `rentloop-live`, click **Project Settings → API Keys** (or **Connect** at the top). Copy:
   - the **Project URL** (looks like `https://<live-ref>.supabase.co`)
   - the **Publishable key** (starts with `sb_publishable_`)

   Do the same in `rentloop-dev`. Keep the four values in a note for the next part. Never copy a **secret** or **service_role** key; the app doesn't need one.

## Part 3. Point the Vercel site at the right databases (15 minutes)

The site is already on Vercel at `https://rental-market-place-ochre.vercel.app`. This part checks it builds from the right place and splits its databases.

### Check where the site builds from

1. Sign in at [vercel.com](https://vercel.com) with the account that created the site, and click the project **rental-market-place**.
2. Click **Settings → Git**. Under **Connected Git Repository** it must say `code4namibia/Rental_MarketPlace`.
   - If it shows another repository (for example an older copy under someone's own GitHub name), click **Disconnect**, then **Connect Git Repository** → GitHub → `code4namibia/Rental_MarketPlace`. If it's not listed, click **Adjust GitHub App Permissions**, allow the `code4namibia` organisation (or ask an organisation owner to approve it), then come back.
3. Click **Settings → Environments → Production** (on older screens: **Settings → Git → Production Branch**). The branch must be `main`.

(Starting from scratch instead? Click **Add New… → Project**, import `code4namibia/Rental_MarketPlace`, click **Deploy**, then carry on from step 4.)

### Set the environment variables properly

4. Click **Settings → Environment Variables**. You probably see `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, set for all environments to the `rentloop-dev` values (the URL contains `dlqkgptkdvjdxkmdfgbr`). Next you give the live site the live database, and previews keep the test one.
5. For `NEXT_PUBLIC_SUPABASE_URL`, click the **⋯** button → **Edit**. Change the value to the **rentloop-live** Project URL, untick **Preview** and **Development**, leave only **Production** ticked, and click **Save**. Do the same for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, with the rentloop-live Publishable key.

   Accounts and items created on the site so far stay in `rentloop-dev`. They won't appear on the live site after this; that's expected (they were test data).

6. Add the **test** values for previews. Click **Add Environment Variable** (or **Create new**), tick only **Preview**, and add:

   | Key | Value | Environments |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | the rentloop-dev Project URL | Preview |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the rentloop-dev Publishable key | Preview |

7. Add the site address for production, so WhatsApp links point to it:

   | Key | Value | Environments |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://rental-market-place-ochre.vercel.app` (no `/` at the end) | Production |

   Don't set it for Preview: previews work out their own address (`src/lib/site-url.ts`).

   The final list must look like this:

   | Key | Production | Preview |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | rentloop-live | rentloop-dev |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | rentloop-live | rentloop-dev |
   | `NEXT_PUBLIC_SITE_URL` | `https://rental-market-place-ochre.vercel.app` | (not set) |

   Feature flags (`NEXT_PUBLIC_FLAG_*`) come with the task `feature-flags`.

8. Environment variables only reach a build made after you set them. Click **Deployments**, then the **⋯** on the top deployment → **Redeploy** → **Redeploy**.

### Hide previews from strangers

9. Click **Settings → Deployment Protection**. Under **Vercel Authentication**, make sure it's **Enabled** and set to **Standard Protection**. Click **Save**.

   Previews now ask for a Vercel sign-in; the production address stays public.

## Part 4. Tell Supabase about the new addresses (5 minutes)

Sign-up and password emails contain a link back to the site. Supabase only allows links to addresses on its list, so add them in **both** projects.

1. Find your Vercel team slug: in Vercel, click your team name at the top left → **Settings → General** → **Team URL**. The slug is the part after `vercel.com/`, for example `kirubel007s-projects`. It's `<team-slug>` below.
2. In **rentloop-live**: **Authentication → URL Configuration**.
   - **Site URL:** `https://rental-market-place-ochre.vercel.app`
   - **Redirect URLs** → **Add URL:** `https://rental-market-place-ochre.vercel.app/**`
   - Click **Save**.
3. In **rentloop-dev**: **Authentication → URL Configuration**.
   - **Site URL:** leave `http://localhost:3000`.
   - **Redirect URLs** → add both:
     - `http://localhost:3000/**`
     - `https://*-<team-slug>.vercel.app/**` (every preview address ends like this)
   - Click **Save**.

## Part 5. Check it works (10 minutes)

1. Open `https://rental-market-place-ochre.vercel.app` on your phone and on a second phone (mobile data, not Wi-Fi, to be sure it's really online).
2. Sign up with a real email address. Open the confirmation email on the phone: the link must open `rental-market-place-ochre.vercel.app`, not `localhost`.
3. Add an item and create a quote. Share the quote link on WhatsApp to the second phone and open it there.
4. In Supabase **rentloop-live → Table Editor**, you see the new account's data. In **rentloop-dev** you don't.

Supabase's built-in email sends only a few emails an hour. If a confirmation email doesn't come, wait an hour; the task `email-sender-setup` fixes this properly.

## Part 6. Share it with your boss

- **The live site:** send `https://rental-market-place-ochre.vercel.app`. Anyone can open it.
- **A preview (a pull request not merged yet):** open the pull request on GitHub, click the **Visit Preview** link in the Vercel comment, then in Vercel open that deployment and click **Share** → copy the **shareable link**. Anyone with that link can open that one preview without a Vercel account.

## Part 7. Block red pull requests on GitHub (5 minutes, once)

You need to be an admin of `code4namibia/Rental_MarketPlace` for this. If you're not, send these steps to an organisation owner.

1. On GitHub, open the repository → **Settings → Branches** (or **Rules → Rulesets**) → **Add branch protection rule** (or **Add classic branch protection rule**).
2. **Branch name pattern:** `main`.
3. Tick:
   - **Require a pull request before merging**
   - **Require status checks to pass before merging**, then **Require branches to be up to date before merging**, and in the search box add both checks: **Lint, typecheck, unit tests, build** and **Database rules** (they appear once they've run on a pull request in the last week).
4. Click **Create** (or **Save changes**).

## If a deploy breaks the live site: roll back

Rolling back puts the previous working version live in seconds. It doesn't change the database or GitHub.

1. In Vercel, open the project → **Deployments**.
2. Find the last deployment that worked (a green **Ready** with the label **Production**, below the current one).
3. Click its **⋯** → **Instant Rollback** → **Continue**. The live address now shows that version.
4. Fix the problem in a new pull request as usual. While rolled back, Vercel stops putting new `main` builds live, so after the fix merges, open the new deployment and click **⋯** → **Promote** (or click **Undo Rollback** on the project page).

If the broken deploy came with a migration, rolling back the site doesn't undo the migration. That's why migrations only add things and never change or remove them (`docs/ROADMAP.md` section 2.6): the previous version of the site keeps working with the new database.

## Later

- **Before the first paying business:** move to Vercel Pro; the free Hobby plan doesn't allow commercial use (`docs/MASTER-PLAN.md`).
- **Free Supabase projects sleep** after about a week without visits. The uptime check in `docs/ROADMAP.md` section 2.8 (a free UptimeRobot check every 5 minutes) keeps the live one awake and emails you if the site goes down.
- **Every new migration** goes to the live database too: link to `<live-ref>`, `npx supabase db push`, then link back to `dlqkgptkdvjdxkmdfgbr`. `docs/RELEASING.md` (task `release-checklist`) will hold the full release order.
