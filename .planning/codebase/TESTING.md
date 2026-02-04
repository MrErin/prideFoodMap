# Testing Patterns

**Analysis Date:** 2025-02-03

## Test Framework

**Unit Testing:**

- Vitest 4.0.13
- Config: `/home/erinmeaker/Documents/source/prideFoodMap/vitest.config.ts`
- Environment: jsdom
- Globals: enabled (`globals: true`)

**E2E Testing:**

- Playwright 1.56.1
- Config: `/home/erinmeaker/Documents/source/prideFoodMap/playwright.config.ts`
- Projects: Chromium, Firefox, Mobile Chrome (Safari skipped on Linux)

**Assertion Library:**

- Vitest built-in assertions
- Testing Library DOM: `@testing-library/dom` 10.4.1

**Run Commands:**

```bash
npm test                # Run all unit tests (Vitest)
npm run test:coverage  # Run with coverage report
npm run test:e2e       # Run Playwright E2E tests
```

## Test File Organization

**Location:**

- Unit tests: Co-located in `src/test/` directory
- E2E tests: Separate `e2e/` directory at project root

**Naming:**

- Unit tests: `*.test.ts` suffix (e.g., `map.test.ts`)
- E2E tests: `*.spec.ts` suffix (e.g., `map.spec.ts`)

**Structure:**

```
src/
├── main.ts
├── map.ts
└── test/
    └── map.test.ts

e2e/
└── map.spec.ts
```

## Test Structure

**Suite Organization:**

```typescript
describe('functionName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    // Test
  });
});
```

**Patterns:**

- `describe()` blocks group tests by function or feature
- `beforeEach()` for test setup (mocking, DOM setup, timer mocking)
- `afterEach()` for cleanup (restoring mocks, removing DOM elements, real timers)
- `it()` for individual test cases with descriptive "should" statements

**Setup Pattern:**

```typescript
beforeEach(() => {
  global.fetch = vi.fn();
  announcerElement = document.createElement('div');
  announcerElement.setAttribute('id', 'announcements');
  document.body.appendChild(announcerElement);
  vi.useFakeTimers();
});
```

**Teardown Pattern:**

```typescript
afterEach(() => {
  vi.restoreAllMocks();
  document.body.removeChild(announcerElement);
  vi.useRealTimers();
});
```

**Assertion Pattern:**

```typescript
expect(result).toHaveLength(1);
expect(result[0]).toMatchObject({ latitude: 40.7128 });
await expect(loadCSV('/data/missing.csv')).rejects.toThrow('Failed to load');
```

## Mocking

**Framework:** Vitest built-in (`vi`)

**Patterns:**

**Global fetch mocking:**

```typescript
beforeEach(() => {
  global.fetch = vi.fn();
});

(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  text: () => Promise.resolve(mockCSV),
});
```

**Timer mocking:**

```typescript
vi.useFakeTimers();
vi.advanceTimersByTime(100);
vi.useRealTimers();
```

**What to Mock:**

- Network requests (fetch API)
- DOM timers (setTimeout/setInterval)
- Global objects (window, document)

**What NOT to Mock:**

- Pure functions
- Data transformation logic
- Simple DOM operations

## Fixtures and Factories

**Test Data:**

```typescript
const mockCSV = 'latitude,longitude,locationName,description\n40.7128,-74.0060,New York,Big Apple';
```

**DOM Elements:**

```typescript
announcerElement = document.createElement('div');
announcerElement.setAttribute('id', 'announcements');
document.body.appendChild(announcerElement);
```

**Location:**

- Test data inline in test files
- No separate fixtures directory
- No factory functions

## Coverage

**Provider:** v8 (`@vitest/coverage-v8`)

**Requirements:** None enforced (no minimum coverage threshold)

**Reporters:**

- text (console output)
- html (detailed report)

**Exclusions:**

- `node_modules/`
- `src/test/` (test files themselves)
- `e2e/`
- `*.config.ts` (config files)

**View Coverage:**

```bash
npm run test:coverage
# HTML report generated in coverage/ directory
```

## Test Types

**Unit Tests:**

- Scope: Individual functions in isolation
- Framework: Vitest + jsdom
- Location: `/home/erinmeaker/Documents/source/prideFoodMap/src/test/map.test.ts`
- Focus: CSV loading, parsing, DOM announcement functions

**Integration Tests:**

- Not clearly separated from unit tests
- `loadCSV` tests are effectively integration tests (fetch + parse)

**E2E Tests:**

- Scope: Full application flow
- Framework: Playwright
- Location: `/home/erinmeaker/Documents/source/prideFoodMap/e2e/map.spec.ts`
- Focus: Map loading, layer controls, accessibility, markers, performance

## Common Patterns

**Async Testing:**

```typescript
it('should load and parse CSV data', async () => {
  const result = await loadCSV('/data/test.csv');
  expect(result).toHaveLength(1);
});

it('should throw an error when the fetch fails', async () => {
  await expect(loadCSV('/data/missing.csv')).rejects.toThrow('Failed to load');
});
```

**Error Testing:**

```typescript
it('should throw an error when the fetch fails', async () => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: false,
    statusText: 'Not Found',
  });
  await expect(loadCSV('/data/missing.csv')).rejects.toThrow(
    'Failed to load /data/missing.csv: Not Found'
  );
});
```

**DOM Testing:**

```typescript
it('should set text content on announcements element', () => {
  announce('Test message');
  vi.advanceTimersByTime(100);
  expect(announcerElement.textContent).toBe('Test message');
});
```

**E2E Test Organization:**

```typescript
test.describe('Map application', () => {
  test('should load the map', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#map')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have skip link', async ({ page }) => {
    // Test
  });
});

test.describe('Map functionality', () => {
  test('should display markers when data loads', async ({ page }) => {
    // Test
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    // Test
  });
});
```

## Playwright-Specific Patterns

**Skipping Flaky Tests:**

```typescript
test.skip(browserName === 'firefox', 'Flaky on Firefox due to timing');
```

**Waits:**

```typescript
await page.waitForTimeout(2000);
await expect(page.locator('.leaflet-marker-icon')).toBeVisible();
await page.waitForLoadState('networkidle');
```

**Assertions:**

```typescript
await expect(mapContainer).toBeVisible();
await expect(loading).toHaveClass(/hidden/, { timeout: 5000 });
await expect(skipLink).toHaveAttribute('href', '#map');
```

---

_Testing analysis: 2025-02-03_
