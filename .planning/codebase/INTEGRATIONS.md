# External Integrations

**Analysis Date:** 2025-02-03

## APIs & External Services

**Map Tiles:**
- OpenStreetMap - Base map tile layer
  - URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
  - Auth: None required (free/public API)
  - Implementation: `src/map.ts` line 120

**CDN Resources:**
- Cloudflare CDN (cdnjs) - Leaflet CSS stylesheet
  - URL: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css`
  - Used in: `index.html` line 9

## Data Storage

**Static Data Files:**
- CSV files in `public/data/` directory
  - `fridgePins.csv` - Community fridge and pantry locations
  - `donationPins.csv` - Food donation site locations
  - Loaded via: `src/map.ts` using `fetch()` and parsed with PapaParse

**File Storage:**
- Static assets in `public/` directory
  - Icons: `public/icons/fridge.png`, `public/icons/donation.png`
  - Data: `public/data/*.csv`
  - Served directly by Vite dev server and bundled in production build

**Caching:**
- None (browser cache only)

## Authentication & Identity

**Auth Provider:**
- None (publicly accessible application)
- No user authentication required

## Monitoring & Observability

**Error Tracking:**
- None (console.error only)

**Logs:**
- Console logging via `console.error()` and `console.warn()`
- ARIA live announcements for accessibility (`announce()` function in `src/map.ts`)

## CI/CD & Deployment

**Hosting:**
- GitHub Pages (static site hosting)
  - Base URL: `/prideFoodMap/`
  - Live site: https://mrerin.github.io/prideFoodMap/

**CI Pipeline:**
- GitHub Actions
  - Workflow: `.github/workflows/deploy.yml`
  - Triggers: Push to `main` branch, manual workflow dispatch
  - Node version: 20

**Jobs:**
1. `build` - Build project with Vite, upload artifact
2. `test` - Run unit tests (Vitest) and E2E tests (Playwright)
3. `deploy` - Deploy to GitHub Pages

## Environment Configuration

**Required env vars:**
- None (static configuration only)

**Secrets location:**
- None required

**Build-time configuration:**
- `import.meta.env.BASE_URL` - Set by Vite, used for asset paths

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Static HTTP requests to:
  - OpenStreetMap tile server (map tiles)
  - Local CSV files via `fetch()`

## Third-Party Libraries by Category

**Mapping:**
- Leaflet - Interactive map rendering
  - Location: `src/map.ts` imports
  - Used for: Map display, markers, tile layers, layer controls

**Data Parsing:**
- PapaParse - CSV parsing
  - Location: `src/map.ts` line 2
  - Used for: Parsing location data from CSV files

**Testing:**
- Playwright - E2E browser testing
- Vitest - Unit testing
- Testing Library - DOM testing utilities
- jsdom - DOM implementation for Node

---

*Integration audit: 2025-02-03*
