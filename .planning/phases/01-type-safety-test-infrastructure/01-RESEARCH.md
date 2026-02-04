# Phase 01: Type Safety & Test Infrastructure - Research

**Researched:** 2026-02-03
**Domain:** Vitest TypeScript Mocking, DOM Timing Patterns, Leaflet Testing
**Confidence:** HIGH

## Summary

This phase focuses on three interconnected technical debt items: (1) eliminating `any` type assertions in Vitest mocks, (2) replacing `setTimeout` DOM timing with event-driven patterns, and (3) adding comprehensive unit tests for core functions. Research confirms that the current stack (Vitest 4.0.13, TypeScript 5.9.3, Leaflet 1.9.4) provides all necessary capabilities without requiring additional dependencies.

**Key findings:**
- Vitest 4.0 provides `vi.spyOn()` with full TypeScript type inference - no `any` needed
- MutationObserver and Leaflet's built-in events are production-ready replacements for `setTimeout`
- Testing Leaflet requires proper DOM setup via jsdom (already configured)

**Primary recommendation:** Use `vi.spyOn(global, 'fetch')` with proper Response typing, replace `setTimeout` with MutationObserver for DOM detection and Leaflet events for map initialization, and test core functions in isolation using the existing test infrastructure.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Vitest** | 4.0.13 | Test runner + mocking | Native TypeScript support, built on Vite, fastest test runner |
| **TypeScript** | 5.9.3 | Type system | Strict mode enabled, modern ES2022 target |
| **jsdom** | 27.2.0 | DOM environment | Already configured in vitest.config.ts |
| **Leaflet** | 1.9.4 | Map library | Current stable release, well-documented event system |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@vitest/coverage-v8** | 4.0.13 | Code coverage | Verify test completeness |
| **@testing-library/dom** | 10.4.1 | DOM queries | Not needed for this phase (unit tests only) |
| **PapaParse** | 5.5.3 | CSV parsing | Already used, needs testing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `vi.spyOn()` | `vi.mock()` | `vi.mock()` is hoisted, harder to type properly; `vi.spyOn()` is explicit and safer |
| MutationObserver | `waitFor()` from Testing Library | Additional dependency; MutationObserver is native |
| Leaflet events | Custom promises | Reinventing the wheel; Leaflet's event system is battle-tested |

**Installation:**
```bash
# No additional packages needed - all dependencies already installed
npm install
```

## Architecture Patterns

### Test File Organization
```
src/
├── map.ts              # Production code
└── test/
    └── map.test.ts     # Unit tests (co-located)
```

### Pattern 1: Type-Safe Fetch Mocking

**What:** Replace `(global.fetch as any)` with properly typed `vi.spyOn()`

**When to use:** Any test that mocks network requests

**Example:**
```typescript
// Source: https://vitest.dev/api/mock.html
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('loadCSV', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        return {
          ok: true,
          text: () => Promise.resolve(mockCSV),
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          redirected: false,
          url: typeof input === 'string' ? input : input.toString(),
          clone: () => ({} as Response),
          json: () => Promise.resolve({}),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          body: null,
          bodyUsed: false,
        } as Response;
      }
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should load and parse CSV data', async () => {
    const result = await loadCSV('/data/test.csv');
    expect(result).toHaveLength(1);
  });
});
```

### Pattern 2: Event-Driven DOM Detection

**What:** Use MutationObserver instead of setTimeout to detect when DOM elements appear

**When to use:** Code that waits for Leaflet controls or markers to be added to DOM

**Example:**
```typescript
// Replacement for setTimeout in src/map.ts line 153-167
function waitForElement(selector: string, callback: (element: Element) => void): MutationObserver {
  const observer = new MutationObserver((mutations, obs) => {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      obs.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

// Usage in initializeMap:
const layersControl = L.control.layers(undefined, overlays, { collapsed: false })
  .addTo(map)
  .on('add', () => {
    // Control is added to DOM - enhance accessibility
    const controlElement = document.querySelector('.leaflet-control-layers');
    if (controlElement) {
      controlElement.setAttribute('role', 'group');
      controlElement.setAttribute('aria-label', 'Map Layer Controls');
      // ... rest of accessibility enhancements
    }
  });
```

### Pattern 3: Leaflet Event-Driven Initialization

**What:** Use Leaflet's `whenReady()` and layer events instead of setTimeout

**When to use:** Map initialization, tile loading confirmation

**Example:**
```typescript
// Source: https://leafletjs.com/reference.html#map-event
export const initializeMap = async (): Promise<void> => {
  const map: L.Map = L.map('map').setView([37.8, -96], 4);

  // Use whenReady for initialization confirmation
  map.whenReady(() => {
    announce('Map initialized');
  });

  // Tile loading events
  const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  });

  tileLayer.on('load', () => {
    announce('Map tiles loaded');
  });

  tileLayer.addTo(map);
  // ... rest of initialization
};
```

### Anti-Patterns to Avoid

- **Using `as any` for mocks**: Defeats TypeScript's type checking; use proper mock implementations
- **`setTimeout` for DOM waiting**: Unreliable and introduces arbitrary delays; use MutationObserver or events
- **Testing implementation details**: Test behavior, not internal implementation
- **Mocking Leaflet entirely**: Unnecessary; Leaflet works in jsdom, only mock external dependencies

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type-safe mocks | Custom mock factories | `vi.spyOn()` with proper typing | Vitest provides type inference, custom code adds maintenance burden |
| DOM waiting | Custom polling/timeout loops | MutationObserver, Leaflet events | Native APIs are more efficient and reliable |
| Test timers | Custom timer mocks | `vi.useFakeTimers()` | Built-in Vitest feature, handles all timer edge cases |
| Response typing | Manual Response objects | TypeScript `Response` type from global scope | Standard Web API type |

**Key insight:** The phase's problems all have standard solutions in the existing stack. No custom utilities or patterns are needed.

## Common Pitfalls

### Pitfall 1: Mock Restoration Scope

**What goes wrong:** Forgetting to restore mocks in `afterEach` causes test pollution

**Why it happens:** `vi.restoreAllMocks()` restores all mocks, but manual `mockRestore()` is specific to each spy

**How to avoid:**
```typescript
// GOOD: Explicit spy restoration
let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchSpy = vi.spyOn(global, 'fetch');
});

afterEach(() => {
  fetchSpy.mockRestore(); // Explicit restoration
  vi.restoreAllMocks();   // Cleanup for any other mocks
});
```

**Warning signs:** Tests pass when run in isolation but fail when run with other tests

### Pitfall 2: MutationObserver Memory Leaks

**What goes wrong:** MutationObserver instances not disconnected, causing memory leaks

**Why it happens:** `observer.disconnect()` must be called explicitly

**How to avoid:**
```typescript
// GOOD: Always disconnect observers
const observer = new MutationObserver(callback);
observer.observe(document.body, { childList: true, subtree: true });

// In tests, disconnect in afterEach
afterEach(() => {
  observer.disconnect();
});
```

**Warning signs:** Test memory usage grows over time, DOM callbacks firing unexpectedly

### Pitfall 3: Leaflet DOM Timing

**What goes wrong:** Tests fail because Leaflet's DOM elements aren't ready

**Why it happens:** Leaflet adds elements asynchronously; `map.whenReady()` may not wait for all elements

**How to avoid:**
```typescript
// GOOD: Use Leaflet's specific events
marker.on('add', () => {
  // Element is definitely in DOM now
  const element = marker.getElement();
  expect(element).toBeTruthy();
});

// Or use vi.waitFor() for async DOM detection
await vi.waitFor(() => {
  expect(document.querySelector('.leaflet-marker-icon')).toBeTruthy();
});
```

**Warning signs:** Flaky tests that sometimes fail with "element not found"

### Pitfall 4: Fake Timers Interference

**What goes wrong:** Using fake timers breaks Leaflet's internal timing

**Why it happens:** Leaflet uses setTimeout internally for animations and tile loading

**How to avoid:**
```typescript
// AVOID: Fake timers with Leaflet
vi.useFakeTimers(); // Breaks Leaflet

// GOOD: Only fake timers for non-Leaflet code
// Use real timers for map tests
vi.useRealTimers();
```

**Warning signs:** Map never initializes, markers never appear, tiles never load

## Code Examples

### Mocking Fetch Without `any`

```typescript
// Source: https://vitest.dev/guide/mocking.html
import { vi, beforeEach, afterEach } from 'vitest';

// Type-safe Response mock
const createMockResponse = (text: string, ok = true): Partial<Response> => ({
  ok,
  status: ok ? 200 : 404,
  statusText: ok ? 'OK' : 'Not Found',
  text: () => Promise.resolve(text),
  headers: new Headers(),
  redirected: false,
  url: '',
  clone: () => ({} as Response),
  json: () => Promise.resolve({}),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  body: null,
  bodyUsed: false,
});

// Usage in test
beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValueOnce(
    createMockResponse(mockCSV) as Response
  );
});
```

### Testing `addMarkersFromCSV` in Isolation

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as L from 'leaflet';
import { addMarkersFromCSV, MarkerData } from '../map.ts';

describe('addMarkersFromCSV', () => {
  let layerGroup: L.LayerGroup;
  let icon: L.Icon;

  beforeEach(() => {
    // Create real Leaflet instances - no mocking needed
    layerGroup = L.layerGroup();
    icon = L.icon({
      iconUrl: 'test.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  });

  it('should create markers from valid CSV data', () => {
    const data: MarkerData[] = [
      {
        latitude: 40.7128,
        longitude: -74.006,
        locationName: 'Test Location',
        description: 'Test Description',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    expect(layerGroup.getLayers()).toHaveLength(1);
  });

  it('should skip invalid coordinates', () => {
    const data: MarkerData[] = [
      {
        latitude: NaN,
        longitude: -74.006,
        locationName: 'Invalid',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    expect(layerGroup.getLayers()).toHaveLength(0);
  });
});
```

### Testing `announce` Function

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { announce } from '../map.ts';

describe('announce', () => {
  let announcerElement: HTMLElement;

  beforeEach(() => {
    announcerElement = document.createElement('div');
    announcerElement.setAttribute('id', 'announcements');
    announcerElement.setAttribute('aria-live', 'polite');
    document.body.appendChild(announcerElement);
  });

  it('should update aria-live region', () => {
    announce('Test message');

    // Use vi.waitFor for the setTimeout delay
    // Or test the immediate clear behavior
    expect(announcerElement.textContent).toBe('');
  });
});
```

### Testing `initializeMap`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as L from 'leaflet';
import { initializeMap } from '../map.ts';

describe('initializeMap', () => {
  beforeEach(() => {
    // Create map container
    const mapContainer = document.createElement('div');
    mapContainer.setAttribute('id', 'map');
    document.body.appendChild(mapContainer);
  });

  it('should initialize map with tile layer', async () => {
    // Mock loadCSV to avoid network requests
    vi.spyOn(global, 'fetch').mockImplementation(async () => ({
      ok: true,
      text: () => Promise.resolve(''),
    } as Response));

    await expect(initializeMap()).resolves.not.toThrow();

    // Verify map was created
    const mapContainer = document.getElementById('map');
    expect(mapContainer?.querySelector('.leaflet-map-pane')).toBeTruthy();
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vi.mock()` with manual types | `vi.spyOn()` with type inference | Vitest 3.0+ | Simplified mock setup, better type safety |
| `setTimeout` for DOM timing | MutationObserver, built-in events | ES2015+, modern testing | More reliable tests, no arbitrary delays |
| `as any` for mocks | Proper mock implementations | TypeScript strict mode adoption | Caught bugs at compile time |

**Deprecated/outdated:**
- `vi.mock()` for simple function mocking: Use `vi.spyOn()` instead - more explicit and easier to type
- Manual `sleep()` functions in tests: Use `vi.waitFor()` or event-driven patterns
- Testing Timer Mocks with Leaflet: Use real timers - Leaflet's internal timing is complex

## Open Questions

1. **MutationObserver in jsdom vs browser**
   - What we know: jsdom 27.2.0 supports MutationObserver
   - What's unclear: Whether all MutationObserver edge cases work identically to browser
   - Recommendation: Verify with a simple test before full implementation

2. **Leaflet 1.9.4 vs 2.0 migration**
   - What we know: Leaflet 2.0 is in beta with TypeScript improvements
   - What's unclear: Whether upgrading would simplify testing
   - Recommendation: Stay on 1.9.4 for this phase - stable and sufficient

## Sources

### Primary (HIGH confidence)
- [Vitest Mock Functions API](https://vitest.dev/api/mock) - Official docs on `vi.spyOn`, mock typing
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html) - Comprehensive mocking patterns
- [Leaflet 1.9.4 Reference](https://leafletjs.com/reference.html) - Event system, map lifecycle
- [Project: src/map.ts](/home/erinmeaker/Documents/source/prideFoodMap/src/map.ts) - Current implementation
- [Project: src/test/map.test.ts](/home/erinmeaker/Documents/source/prideFoodMap/src/test/map.test.ts) - Current test patterns

### Secondary (MEDIUM confidence)
- [Mock vs. SpyOn in Vitest with TypeScript](https://dev.to/axsh/mock-vs-spyon-in-vitest-with-typescript-a-guide-for-unit-and-integration-tests-2ge6) (January 2025) - Practical comparison of mocking approaches
- [vi.mock Is a Footgun](https://laconicwit.com/vi-mock-is-a-footgun-why-vi-spyon-should-be-your-default/) (July 2025) - Arguments for preferring `vi.spyOn`
- [Project: .planning/research/STACK.md](/home/erinmeaker/Documents/source/prideFoodMap/.planning/research/STACK.md) - Existing research on card list sync and mocking
- [Project: .planning/codebase/TESTING.md](/home/erinmeaker/Documents/source/prideFoodMap/.planning/codebase/TESTING.md) - Current test patterns

### Tertiary (LOW confidence)
- [MutationObserver in testing](https://stackoverflow.com/questions/61036156/react-typescript-testing-typeerror-mutationobserver-is-not-a-constructor) - Addresses common jsdom issues
- [Vitest Browser Mode Guide](https://howtotestfrontend.com/resources/vitest-browser-mode-guide-and-setup-info) - Not needed for this phase (jsdom is sufficient)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs and project config
- Architecture: HIGH - Patterns verified via Vitest and Leaflet official documentation
- Pitfalls: MEDIUM - Based on common testing issues, some specific to Leaflet/jsdom interaction need validation

**Research date:** 2026-02-03
**Valid until:** 2026-03-05 (30 days - Vitest and Leaflet are stable but minor versions may update)

## Implementation Notes

### Current Technical Debt Locations

**File: src/test/map.test.ts**
- Lines 17, 31, 39, 50, 62: `(global.fetch as any)` type assertions

**File: src/map.ts**
- Line 55: `setTimeout` for announcement timing
- Lines 153-167: `setTimeout` for layer control DOM detection
- Functions needing tests:
  - `addMarkersFromCSV` (lines 61-115): marker creation, coordinate validation
  - `initializeMap` (lines 117-177): map init, tile loading, layer controls
  - `announce` (lines 50-59): ARIA live region updates

### Test Coverage Gaps

Based on current code analysis:
1. **addMarkersFromCSV**: No unit tests
2. **initializeMap**: No unit tests (only E2E tests)
3. **announce**: Tests exist but use fake timers (need to verify real behavior)

### Success Criteria Verification

1. **All test mocks use `vi.spyOn()` with proper types**
   - Measurable: Zero `(x as any)` in test files
   - Testable: TypeScript compilation without `any` errors

2. **`setTimeout` DOM timing replaced**
   - Measurable: Zero `setTimeout` calls in map.ts
   - Testable: Tests pass without fake timers

3. **Unit tests for `addMarkersFromCSV`**
   - Test marker creation with valid data
   - Test coordinate validation (NaN, invalid numbers)
   - Test CSV parsing edge cases

4. **Unit tests for `initializeMap`**
   - Test map initialization
   - Test tile loading
   - Test layer control setup

5. **Unit tests for `announce`**
   - Test ARIA live region updates
   - Test message clearing behavior
   - Test missing element handling
