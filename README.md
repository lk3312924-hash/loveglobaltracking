# Container Arrival Tracker

A single-page dashboard for tracking shipping containers through their journey — bill of lading, brand, warehouse, arrival, discharge, and out dates, with automatic status and total-days calculations.

## Key technologies

- Plain HTML/CSS/JavaScript — no build step, no framework
- Data is kept in the browser's `localStorage`, so edits persist per-device
- Netlify Edge Function (`netlify/edge-functions/password-gate.js`) adds a shared-password gate in front of the whole site

## Running locally

Open `index.html` directly in a browser, or serve the folder with any static file server:

```bash
npx serve .
```

To test the password gate locally with Netlify's emulation:

```bash
netlify dev --port 8889
```

## Access

The site is protected by a single shared password (HTTP Basic Auth), configured via the `SITE_PASSWORD` environment variable in `netlify.toml`.
