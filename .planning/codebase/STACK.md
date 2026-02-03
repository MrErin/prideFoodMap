# Technology Stack

**Analysis Date:** 2025-02-03

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code in `src/`, `e2e/`, and config files

**Secondary:**
- None

## Runtime

**Environment:**
- Node.js 20 (CI/CD requirement, specified in `.github/workflows/deploy.yml`)

**Package Manager:**
- npm (uses `package-lock.json`)
- Lockfile: present

## Frameworks

**Core:**
- Vite 7.2.4 - Build tool and dev server
- Leaflet 1.9.4 - Interactive map library

**Testing:**
- Vitest 4.0.13 - Unit test runner
- @vitest/coverage-v8 4.0.13 - Code coverage provider
- @vitest/ui 4.0.13 - Test UI
- Playwright 1.56.1 - End-to-end testing
- jsdom 27.2.0 - DOM environment for unit tests
- @testing-library/dom 10.4.1 - DOM testing utilities

**Build/Dev:**
- TypeScript 5.9.3 - Type checking and compilation
- Prettier 3.6.2 - Code formatting
- esbuild (bundled with Vite) - Fast bundler

## Key Dependencies

**Critical:**
- leaflet 1.9.4 - Open-source map library for interactive maps
- papaparse 5.5.3 - CSV parsing library for loading map data

**Type Definitions:**
- @types/leaflet 1.9.21 - TypeScript types for Leaflet
- @types/papaparse 5.5.0 - TypeScript types for PapaParse
- @types/node 24.10.1 - TypeScript types for Node.js

## Configuration

**Environment:**
- Vite environment variables via `import.meta.env`
- Key configs: `BASE_URL` (set in `vite.config.ts` to `/prideFoodMap/`)

**Build:**
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript compiler configuration (target: ES2022, module: ESNext)
- `.prettierrc` - Code formatting rules

## Platform Requirements

**Development:**
- Node.js 20 or higher
- npm (or compatible package manager)
- Modern web browser with ES2022 support

**Production:**
- Static site deployment (GitHub Pages)
- No server-side runtime required
- CDN for Leaflet CSS: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/`

---

*Stack analysis: 2025-02-03*
