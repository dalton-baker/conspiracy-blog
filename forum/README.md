# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Authentication

The forum uses its own passwordless, email-code login (no third-party auth):

1. User enters their email → `POST /api/auth/request` emails a 6-digit code
   (valid 15 minutes, single-use, rate limited per email and per IP).
2. User enters the code → `POST /api/auth/verify` checks it and sets an
   httpOnly, Secure session cookie (`dot_session`, ~30 days).
3. `POST /api/auth/logout` destroys the session.

Login codes and session tokens are only ever stored **hashed** in D1. Email is
the link between a session and the existing `users` table.

### Database migrations

Schema lives in `migrations/`. `npm run deploy` applies pending migrations to
the remote D1 **before** deploying, so deploys stay in sync automatically:

```sh
npm run deploy        # migrate (remote) -> build -> wrangler deploy
npm run migrate       # apply migrations to remote only
npm run migrate:local # apply migrations to the local dev DB
```

`0001_initial_migration.sql` is the base schema (users/posts/comments) and is
already recorded as applied in production, so Wrangler skips it there; fresh or
local databases get it before later migrations. `0002_auth.sql` adds the auth
tables (`login_codes`, `sessions`).

### One-time setup

1. **Email Sending** — in the Cloudflare dashboard, onboard the sending domain
   under **Email → Email Sending** (auto-creates SPF/DKIM/DMARC/MX records on a
   `cf-bounce` subdomain). The `from` address in `AUTH_FROM_EMAIL`
   (`noreply@truth.dalt.dev`) must live on that verified domain.
   See https://developers.cloudflare.com/email-service/get-started/send-emails/
2. **Secret** — set the hashing pepper:
   ```sh
   npx wrangler secret put AUTH_SECRET
   ```
   For local dev, copy `.dev.vars.example` to `.dev.vars`.

> Email Sending requires the **Workers Paid** plan and runs against the live
> service even in local dev (`wrangler dev` with remote bindings) — there is no
> sandbox, so test sends go to real inboxes.
