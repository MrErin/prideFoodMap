# Codebase Structure

**Analysis Date:** 2025-02-03

## Directory Layout

```
prideFoodMap/
├── dist/               # Vite build output (generated)
├── e2e/                # Playwright end-to-end tests
├── public/             # Static assets served directly
├── src/                # Application source code
├── .github/            # GitHub Actions workflows
├── .idea/              # IDE configuration (generated)
├── .planning/          # Project planning documentation
├── node_modules/       # NPM dependencies (generated)
├── playwright-report/  # Playwright test reports (generated)
└── test-results/       # Playwright test artifacts (generated)
```

## Directory Purposes

**dist/:**
- Purpose: Vite build output directory
- Contains: Bundled JavaScript, CSS, copied assets
- Key files: `dist/index.html`, `dist/assets/`
- Generated: Yes
- Committed: Yes

**e2e/:**
- Purpose: End-to-end browser tests
- Contains: Playwright test specs
- Key files: `e2e/map.spec.ts`
- Generated: No
- Committed: Yes

**public/:**
- Purpose: Static assets served at root URL
- Contains: CSV data files, custom icons
- Key files: `public/data/fridgePins.csv`, `public/data/donationPins.csv`, `public/icons/fridge.png`, `public/icons/donation.png`
- Generated: No
- Committed: Yes

**src/:**
- Purpose: Application source code
- Contains: TypeScript modules and unit tests
- Key files: `src/main.ts`, `src/map.ts`, `src/test/map.test.ts`
- Generated: No
- Committed: Yes

**.github/:**
- Purpose: GitHub Actions CI/CD workflows
- Contains: Workflow YAML files
- Key files: `.github/workflows/` (if present)
- Generated: No
- Committed: Yes

**.planning/:
- Purpose: Project planning and codebase documentation
- Contains: Architecture, structure, and analysis documents
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`
- Generated: No
- Committed: Yes

## Key File Locations

**Entry Points:**
- `index.html`: Main HTML document, imports `src/main.ts` as module
- `src/main.ts`: Application bootstrap, calls `initializeMap()` on DOM ready
- `src/map.ts`: Core map logic, exports public API

**Configuration:**
- `package.json`: NPM scripts and dependencies
- `vite.config.ts`: Vite bundler configuration (sets base URL)
- `tsconfig.json`: TypeScript compiler configuration
- `vitest.config.ts`: Vitest unit test configuration
- `playwright.config.ts`: Playwright E2E test configuration
- `.prettierrc`: Code formatting rules

**Core Logic:**
- `src/map.ts`: Map initialization, marker creation, CSV loading, accessibility

**Testing:**
- `src/test/map.test.ts`: Unit tests for `loadCSV()` and `announce()` functions
- `e2e/map.spec.ts`: End-to-end tests for map application

**Data:**
- `public/data/fridgePins.csv`: Community fridge and pantry location data
- `public/data/donationPins.csv`: Food donation site location data

**Assets:**
- `public/icons/fridge.png`: Custom marker icon for fridges
- `public/icons/donation.png`: Custom marker icon for donation sites

## Naming Conventions

**Files:**
- Source files: `camelCase.ts` (e.g., `main.ts`, `map.ts`)
- Test files: `*.test.ts` suffix (e.g., `map.test.ts`)
- E2E specs: `*.spec.ts` suffix (e.g., `map.spec.ts`)
- Config files: `*.config.ts` suffix (e.g., `vite.config.ts`)
- Data files: `camelCase.csv` (e.g., `fridgePins.csv`)
- Asset files: `camelCase.png` (e.g., `fridge.png`)

**Directories:**
- All lowercase: `src`, `e2e`, `public`
- Plural for collections: `icons`, `data`, `node_modules`

**Functions:**
- camelCase: `initializeMap()`, `loadCSV()`, `announce()`, `addMarkersFromCSV()`

**Interfaces:**
- PascalCase: `MarkerData`

**Constants:**
- camelCase: `fridgeIcon`, `donationIcon`, `baseURL`

## Where to Add New Code

**New Feature:**
- Primary code: `src/map.ts` (map-related logic) or create new module in `src/`
- Tests: `src/test/` for unit tests, `e2e/` for E2E tests

**New Component/Module:**
- Implementation: Create new `.ts` file in `src/`
- Import pattern: Use relative imports with `.ts` extension (e.g., `import { foo } from './bar.ts'`)

**Utilities:**
- Shared helpers: `src/map.ts` (current) or create `src/utils.ts` for general utilities

**New Data Sources:**
- CSV files: `public/data/`
- Update `src/map.ts` to fetch and process new files

**New Marker Types:**
- Add icon definition in `src/map.ts`
- Add PNG asset to `public/icons/`
- Add layer group and CSV loading in `initializeMap()`

## Special Directories

**dist/:**
- Purpose: Vite build output for production deployment
- Generated: Yes (by `npm run build`)
- Committed: Yes
- Clean: Delete before rebuild (`rm -rf dist/`)

**node_modules/:**
- Purpose: NPM package dependencies
- Generated: Yes (by `npm install`)
- Committed: No
- Ignore: Listed in `.gitignore`

**playwright-report/:**
- Purpose: HTML test reports from Playwright
- Generated: Yes
- Committed: No

**test-results/:**
- Purpose: Screenshots and traces from Playwright test failures
- Generated: Yes
- Committed: No

**.idea/:**
- Purpose: IDE configuration (IntelliJ/WebStorm)
- Generated: Yes
- Committed: Yes (though commonly ignored)

---

*Structure analysis: 2025-02-03*
