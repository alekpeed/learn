# Deployment and Operations (MVP)

Status: MVP release notes (implements docs/spec/15_DEPLOYMENT_AND_OPERATIONS.md for the local-first MVP).

## What ships

The MVP is a **static, local-first single-page app**. `pnpm build` produces
`apps/client/dist` — HTML, CSS, and fingerprinted JS chunks. There is **no
backend and no database to provision**: learner progress lives in the browser
(IndexedDB), and curriculum content is bundled with the app. The same build runs
on any OS in any modern browser.

## Build

```bash
pnpm install --frozen-lockfile
pnpm build            # → apps/client/dist
```

Documented commands (doc 15 §3): install `pnpm install`, dev run `pnpm dev`,
test `pnpm test`, content validation `pnpm validate:content`, production build
`pnpm build`, e2e `pnpm test:e2e`. There are no database migrations in the MVP.

## Hosting

Serve `apps/client/dist` from any static host. Client-side routing needs a
**history fallback** so unknown paths return the app shell:

- Netlify/Cloudflare-style: `apps/client/public/_redirects` (already included).
- nginx: `deploy/nginx.conf`.
- Container: `deploy/Dockerfile` (build + nginx).

Cache fingerprinted `/assets/*` aggressively; never cache `index.html`.

## Configuration

Configuration is externalized (`.env.example`, doc 15 §2). The MVP needs **no
secrets** to run. AI-provider credentials — when a real provider replaces the
stub — must live server-side on the AI-gateway service, never in the client
bundle (doc 08 §7).

## Environments

Maintain development, staging, and production (doc 15 §1). Because the artifact
is static, staging and production differ only by where `dist` is served and by
the AI-gateway endpoint/flag, if enabled.

## Backups and data

Local-only builds provide progress **export/import** (Settings → Data), which is
the MVP's backup mechanism (doc 15 §6). No server data to back up yet.

## Rollback

Application and content roll back together in the MVP (single bundle). Keep the
previous `dist` (or container image/tag) to redeploy instantly. When content is
released independently later, follow the app/content split in doc 15 §8.

## Monitoring

Client errors surface through the error boundary and are `console.error`-logged
with a classified category (doc 14 §5); no private learner text is logged
(doc 14 §6). A hosting provider's static-asset and uptime metrics cover
availability for the MVP.
