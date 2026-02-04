# Coding Conventions

**Analysis Date:** 2026-02-03

## Naming Patterns

**Files:**

- TypeScript source files: `camelCase.ts` (e.g., `map.ts`, `main.ts`)
- Test files: `*.test.ts` suffix (e.g., `map.test.ts`)
- E2E test files: `*.spec.ts` suffix (e.g., `map.spec.ts`)

**Functions:**

- camelCase for all functions (e.g., `loadCSV`, `announce`, `initializeMap`)
- Exported functions use camelCase (e.g., `loadCSV`, `announce`)
- Internal functions use camelCase (e.g., `addMarkersFromCSV`)

**Variables:**

- camelCase for local variables (e.g., `fridgeIcon`, `donationIcon`, `baseURL`)
- const for immutable references
- let for mutable values (rarely used, only for counters like `markersAdded`)

**Types:**

- PascalCase for interfaces (e.g., `MarkerData`)
- Imported types use original library casing (e.g., `L.Icon`, `L.Map`, `L.LayerGroup`)

**Constants:**

- camelCase for module-level constants (e.g., `baseURL`, `fridgeIcon`, `donationIcon`)

## Code Style

**Formatting:**

- Prettier 3.6.2
- Configuration in `/home/erinmeaker/Documents/source/prideFoodMap/.prettierrc`
- Key settings:
  - Semi-colons: required (`"semi": true`)
  - Single quotes: enabled (`"singleQuote": true`)
  - Trailing commas: ES5 (`"trailingComma": "es5"`)
  - Print width: 100 characters (`"printWidth": 100`)
  - Tab width: 2 spaces (`"tabWidth": 2`)
  - Arrow function parens: always (`"arrowParens": "always"`)
  - End of line: LF (`"endOfLine": "lf"`)

**Linting:**

- Prettier used for linting (`"lint": "prettier --check ."`)
- No ESLint configuration
- Format command: `npm run format`

**TypeScript Configuration:**

- Strict mode enabled (`"strict": true`)
- No unused locals/checks enabled (`"noUnusedLocals": true`, `"noUnusedParameters": true`)
- Target: ES2022
- Module: ESNext
- Module resolution: bundler mode

## Import Organization

**Order:**

1. External library imports (e.g., `import * as L from 'leaflet'`)
2. Third-party imports (e.g., `import Papa from 'papaparse'`)
3. Relative imports (e.g., `import { initializeMap } from './map.ts'`)

**Path Aliases:**

- No path aliases configured
- All imports use explicit file extensions: `./map.ts`

**Import Style:**

- Named imports for specific exports: `import { initializeMap } from './map.ts'`
- Namespace import for Leaflet: `import * as L from 'leaflet'`
- Default import for PapaParse: `import Papa from 'papaparse'`

## Error Handling

**Patterns:**

- Try/catch blocks for async operations
- Errors logged to console with context: `console.error('Error initializing map:', error)`
- Fetch errors throw descriptive messages with URL and status
- User-facing error messages via DOM manipulation
- CSV parsing warnings logged but do not throw: `console.warn('CSV parsing warnings:', result.errors)`
- Invalid data logged with row context: `console.warn('Invalid coordinates at row ${index + 1}:', { lat, lng, row })`

**Throw pattern:**

```typescript
throw new Error(`Failed to load ${url}: ${response.statusText}`);
```

**Re-throw pattern:**

- Catch block logs error, announces to user, then re-throws for upstream handling

## Logging

**Framework:** console (no external logging library)

**Patterns:**

- `console.error()` for errors that prevent functionality
- `console.warn()` for non-fatal issues (invalid data rows, CSV parsing warnings)
- No console.log() in production code
- All logging includes context (what operation failed, what data was problematic)

## Comments

**When to Comment:**

- Minimal inline comments in source code
- Platform-specific workarounds documented (e.g., `// Skipping safari testing on Linux` in `/home/erinmeaker/Documents/source/prideFoodMap/playwright.config.ts`)
- Commented-out code left for reference (e.g., commented loading div in `/home/erinmeaker/Documents/source/prideFoodMap/index.html`)

**JSDoc/TSDoc:**

- Not used for functions
- Interfaces defined without documentation
- Types self-documenting through property names (e.g., `locationName`, `street`, `city`, `state`, `zip`)

## Function Design

**Size:**

- Functions range from 10-60 lines
- Large functions split logically (e.g., `addMarkersFromCSV` separates marker creation from map initialization)
- No strict size limit observed

**Parameters:**

- Type annotations on all parameters
- Optional parameters marked with `?` (e.g., `description?: string` in `MarkerData` interface)
- Destructuring used in callbacks (e.g., `(row: MarkerData, index: number) =>`)

**Return Values:**

- Explicit return type annotations on all exported functions
- Async functions return `Promise<Type>` (e.g., `Promise<MarkerData[]>`, `Promise<void>`)
- Functions without return use `: void` annotation

## Module Design

**Exports:**

- Named exports preferred (e.g., `export interface MarkerData`, `export const loadCSV`)
- No default exports
- Functions and interfaces exported explicitly

**Barrel Files:**

- Not used (small codebase with flat structure)
- All imports reference source files directly

## DOM Manipulation

**Patterns:**

- Null checks before DOM operations: `if (announcer) { ... }`
- Direct attribute setting: `element.setAttribute('role', 'button')`
- Class manipulation for state changes: `loadingEl.classList.add('hidden')`
- Event listeners attached inline within callbacks
- Cleanup not required (single-page app, no component unmounting)

## Accessibility Patterns

**ARIA:**

- Live regions for announcements: `aria-live="polite"`
- Role attributes on interactive elements
- aria-label for screen reader context
- Keyboard handlers check for both Enter and Space: `if (e.key === 'Enter' || e.key === ' ')`

**Focus Management:**

- Tabindex set on interactive markers: `element.setAttribute('tabindex', '0')`
- Skip links for keyboard navigation

---

_Convention analysis: 2026-02-03_
