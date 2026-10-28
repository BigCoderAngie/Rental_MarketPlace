# Bot check on sign-up and sign-in (Cloudflare Turnstile)

Task `signup-bot-check` (SRS NFR-05). A small "I'm human" box on these four forms:

- Sign up (step 2, above **Create my account**)
- Sign in
- Email me a sign-in code
- Forgot password

It stops programs from making fake accounts or using up your email allowance. Most people only see a tick; nobody has to solve a puzzle unless Cloudflare is suspicious. Turnstile is free.

**How it works:** the box gives the form a one-time token. The site passes it to Supabase, and Supabase asks Cloudflare whether it is real. So there are two halves:

| Half | Where | What |
|---|---|---|
| Site key (public) | Vercel and `.env.local` | Shows the box |
| Secret key | Supabase | Checks the token |

> **The order matters.** Once Supabase's check is on, every sign-in **without** a token is refused. So the site must show the box first (Vercel, then redeploy), and only then do you turn the check on in Supabase. To switch it off again, do it the other way round: Supabase first, then Vercel.

## Test keys and real keys

Cloudflare has **test keys** that always pass and work on any web address. We use them for the dev project and Vercel previews, because preview addresses change with every pull request.

| | Site key | Secret key |
|---|---|---|
| Test (dev, previews, your computer) | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Real (live site) | from Cloudflare, step 1 | from Cloudflare, step 1 |

## 1. Make the real keys in Cloudflare

1. Sign in at https://dash.cloudflare.com (a free account is enough; you don't need a domain).
2. In the left menu, click **Turnstile**, then **Add widget**.
3. **Widget name:** `RentLoop`.
4. **Hostnames:** add `rental-market-place-ochre.vercel.app`. When you have your own domain, come back and add it too (for example `rentloop.com.na`).
5. **Widget mode:** **Managed**. Leave the rest as it is and click **Create**.
6. Cloudflare shows a **Site Key** and a **Secret Key**. Keep the page open, or copy them somewhere safe. Never put the secret key in the code or in a chat.

## 2. Show the box (Vercel)

In Vercel → project **rental-market-place** → **Settings → Environment Variables**, add these four (type **Config**):

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_FLAG_BOT_CHECK` | `on` | Production |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | your real **Site Key** | Production |
| `NEXT_PUBLIC_FLAG_BOT_CHECK` | `on` | Preview |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `1x00000000000000000000AA` | Preview |

Then **Deployments → ⋯ on the top deployment → Redeploy**, and wait for **Ready**. Open the sign-in page on the live site: the box should be there. Sign-in still works, because Supabase isn't checking yet.

On your computer, add this to `.env.local` and restart `npm run dev`:

```
NEXT_PUBLIC_FLAG_BOT_CHECK=on
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

## 3. Turn on the check (Supabase, both projects)

Do this in **both** projects:

1. Open the project → **Authentication** → **Attack Protection** (in some versions: **Settings → Bot and Abuse Protection**).
2. Turn on **Enable CAPTCHA protection**.
3. **Provider:** **Turnstile by Cloudflare**.
4. **Secret key:**
   - **Rental Market database** (dev): `1x0000000000000000000000000000000AA` (the test secret)
   - **rentloop-live**: your real **Secret Key** from step 1
5. **Save**.

## 4. Check it works

On the live site, in a private window:

- Sign in with your account: works.
- Forgot password: the "Check your email" page shows.
- Sign up with a new email: reaches "Check your email" or "You're in".

If one says *The "I'm human" check didn't go through*, wait for the tick in the box, then press the button again. If it keeps happening, check that the site key in Vercel and the secret key in **rentloop-live** come from the same Cloudflare widget.

## Turning it off

1. Supabase → **Attack Protection** → turn off **Enable CAPTCHA protection** (in the project you are switching off).
2. Then, if you also want the box gone: Vercel → set `NEXT_PUBLIC_FLAG_BOT_CHECK` to `off` → Redeploy.
