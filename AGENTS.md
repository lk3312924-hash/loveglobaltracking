# AGENTS.md

## Architecture

This is a static, single-file web app — `index.html` contains all markup, styles, and logic (no build step, no framework, no backend). All container-tracking data lives client-side in `localStorage` under the keys `cat_edits`, `cat_adds`, and `cat_deletes`.

## Key files

- `index.html` — the entire application
- `netlify/edge-functions/password-gate.js` — runs on every request (`path: "/*"`), enforces HTTP Basic Auth against the `SITE_PASSWORD` environment variable before allowing the request through
- `netlify.toml` — sets the publish directory and defines `SITE_PASSWORD`

## Conventions / non-obvious decisions

- The password gate uses Basic Auth rather than a custom login page because the site has no backend/session storage to persist a login otherwise; the browser caches the credentials for the session.
- To change the site password, update `SITE_PASSWORD` in `netlify.toml`.
- There is no PLAN.md — this project is complete as a single self-contained tool; there are no further milestones planned.
