# Stack Dimension Research: Card List Component & Tech Debt Remediation

**Project:** Pride Food Map - Chattanooga Food Resource Locator
**Research Date:** 2025-02-03
**Focus:** Leaflet card list synchronization, Vitest TypeScript mocking, DOM timing patterns

---

## Executive Summary

This document researches the standard 2025 approach for:

1. Adding a synchronized card list to a Leaflet map (bi-directional highlighting, filtering)
2. Fixing TypeScript `any` types in Vitest test mocks
3. Replacing setTimeout DOM timing with event-driven patterns

**Key Finding:** All three areas have mature, well-documented patterns in 2025. No new libraries are required - the existing TypeScript + Vite + Leaflet stack is sufficient.

---

## 1. Leaflet Card List Synchronization (Confidence: 95%)

### Core Pattern: Bi-directional Event Binding

The standard approach for synchronizing a card list with Leaflet markers uses **event binding with shared state**, not custom events or complex state management.

#### 1.1 Marker-to-Card Highlighting

**Pattern:** Store marker-card associations during creation, use `L.Util.stamp()` for unique IDs.

```typescript
// Create marker with associated card reference
function createMarkerWithCard(data: MarkerData, cardElement: HTMLElement): L.Marker {
  const marker = L.marker([data.latitude, data.longitude]);

  // Generate unique ID for marker-card pairing
  const markerId = L.Util.stamp(marker);
  cardElement.dataset.markerId = markerId;
  cardElement.dataset.markerType = 'location-card';

  // Marker click -> highlight card
  marker.on('click', () => {
    highlightCard(markerId);
    scrollToCard(markerId);
    announce(`${data.locationName} selected`);
  });

  // Hover for visual feedback
  marker.on('mouseover', () => {
    cardElement.classList.add('card-hovered');
  });

  marker.on('mouseout', () => {
    cardElement.classList.remove('card-hovered');
  });

  return marker;
}
```

**Sources:**

- [StackOverflow: Make Leaflet sidebar div active on marker click and vice versa](https://stackoverflow.com/questions/22256520/make-leaflet-sidebar-div-active-on-marker-click-and-vice-versa) - Shows storing references and using event handlers for bi-directional sync
- [GIS StackExchange: Dynamic map sidebar with info from marker upon click](https://gis.stackexchange.com/questions/340698/dynamic-map-sidebar-with-info-from-marker-upon-click) - Working example using `L.Util.stamp()` for unique IDs

#### 1.2 Card-to-Marker Activation

**Pattern:** Use data attributes and `Layer.getLayer()` for reverse lookup.

```typescript
// Card click -> activate marker
function setupCardListeners(cardElement: HTMLElement, markerLayer: L.LayerGroup): void {
  cardElement.addEventListener('click', () => {
    const markerId = cardElement.dataset.markerId;
    if (!markerId) return;

    const marker = markerLayer.getLayer(markerId) as L.Marker | undefined;
    if (marker) {
      // Open popup and center map
      marker.openPopup();
      map.panTo(marker.getLatLng());

      // Add visual highlight to marker
      highlightMarker(marker);

      // Announce for accessibility
      announce(`Showing ${cardElement.dataset.locationName}`);
    }
  });

  // Keyboard support
  cardElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cardElement.click();
    }
  });

  // Hover sync
  cardElement.addEventListener('mouseenter', () => {
    const markerId = cardElement.dataset.markerId;
    const marker = markerLayer.getLayer(markerId);
    if (marker) {
      const element = marker.getElement();
      if (element) {
        element.classList.add('marker-hovered');
      }
    }
  });

  cardElement.addEventListener('mouseleave', () => {
    const markerId = cardElement.dataset.markerId;
    const marker = markerLayer.getLayer(markerId);
    if (marker) {
      const element = marker.getElement();
      if (element) {
        element.classList.remove('marker-hovered');
      }
    }
  });
}
```

**Sources:**

- [GIS StackExchange: Dynamic map sidebar](https://gis.stackexchange.com/questions/340698/dynamic-map-sidebar-with-info-from-marker-upon-click) - Shows using `L.DomEvent.on()` for card event handlers

#### 1.3 Filter Synchronization

**Pattern:** Filter both markers and cards using same criteria, maintain active state.

```typescript
function filterByTerm(searchTerm: string): void {
  const term = searchTerm.toLowerCase();

  // Filter markers
  markerLayer.eachLayer((layer: L.Layer) => {
    const marker = layer as L.Marker;
    const markerId = L.Util.stamp(marker);

    // Get associated card
    const card = document.querySelector(`[data-marker-id="${markerId}"]`) as HTMLElement;
    if (!card) return;

    const locationName = card.dataset.locationName?.toLowerCase() || '';
    const description = card.dataset.description?.toLowerCase() || '';

    const matches = locationName.includes(term) || description.includes(term);

    if (matches) {
      // Show marker and card
      marker.addTo(map);
      card.style.display = '';
    } else {
      // Hide marker and card
      marker.remove();
      card.style.display = 'none';
    }
  });

  announce(`${visibleCount} locations match "${searchTerm}"`);
}
```

#### 1.4 Accessibility Considerations

- Use `aria-selected` to indicate active card/marker state
- Maintain tab order between cards and map
- Announce filter results via aria-live region
- Support keyboard navigation (Enter, Space, Arrow keys)

---

## 2. Vitest TypeScript Mock Best Practices (Confidence: 90%)

### Core Issue: Avoiding `any` in Mock Implementations

The 2025 Vitest approach uses **type inference from function signatures** rather than explicit `any` casting.

#### 2.1 Proper Mock Typing Without `any`

**Current Anti-Pattern (in existing code):**

```typescript
// BAD: Uses 'any'
(global.fetch as any).mockResolvedValueOnce({ ok: true, text: () => mockCSV });
```

**Recommended Pattern:**

```typescript
// GOOD: Type-safe mock
const mockFetch = vi.fn() as ReturnType<typeof vi.fn<Response>>;
mockFetch.mockResolvedValueOnce({
  ok: true,
  text: () => Promise.resolve(mockCSV),
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  redirected: false,
  url: '',
  clone: () => ({}) as Response,
  json: () => Promise.resolve({}),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  body: null,
  bodyUsed: false,
});
```

**Sources:**

- [Vitest Mock Functions API](https://vitest.dev/api/mock) - Official docs on type inference for mocks
- [GitHub Issue #1781: MockedFunction type](https://github.com/vitest-dev/vitest/issues/1781) - Clarifies to use `Mock`/`MockInstance` types, not `MockedFunction`

#### 2.2 Preferred Approach: `vi.spyOn` Over `vi.mock`

For existing code (like `loadCSV`), use `vi.spyOn` for better type safety:

```typescript
// BEST: Type-safe spy with proper signature
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('loadCSV', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockImplementation(
        async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          return {
            ok: true,
            text: () => Promise.resolve(mockCSV),
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            redirected: false,
            url: typeof input === 'string' ? input : input.toString(),
            clone: () => ({}) as Response,
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

**Sources:**

- [GitHub Discussion #4224: vi.spyOn vs vi.mock](https://github.com/vitest-dev/vitest/discussions/4224) - `vi.spyOn` is more explicit and strict with async operations
- [Laconic Wit Blog: vi.mock is a footgun](https://laconicwit.com/vi-mock-is-a-footgun-why-vi-spyon-should-be-your-default/) (July 2025) - Explains hoisting issues with `vi.mock()`

#### 2.3 Using `Mock<T>` Type Helper

For complex mocks, use the `Mock<T>` type helper:

```typescript
import type { Mock } from 'vitest';

type FetchMock = Mock<typeof fetch>;

describe('tests', () => {
  const mockFetch: FetchMock = vi.fn();

  mockFetch.mockResolvedValueOnce({
    ok: true,
    text: () => Promise.resolve('data'),
    // ... other Response properties
  } as Response);
});
```

**Sources:**

- [Vitest Mock API](https://vitest.dev/api/mock) - Documents `Mock<T>` type helper

---

## 3. Event-Driven DOM Timing Alternatives (Confidence: 85%)

### Core Pattern: MutationObserver + Event Listeners

Replace `setTimeout` with **MutationObserver** for DOM observation and **Leaflet's built-in events** for map initialization.

#### 3.1 Replacing `setTimeout` for DOM Element Detection

**Current Anti-Pattern:**

```typescript
// BAD: Arbitrary timeout
setTimeout(() => {
  const controlElement = document.querySelector('.leaflet-control-layers');
  if (controlElement) {
    controlElement.setAttribute('role', 'group');
  }
}, 100);
```

**Recommended Pattern - MutationObserver:**

```typescript
// GOOD: Event-driven DOM observation
function waitForElement(selector: string, callback: (element: Element) => void): MutationObserver {
  const observer = new MutationObserver((mutations, obs) => {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      obs.disconnect(); // Stop observing once found
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

// Usage in map initialization:
waitForElement('.leaflet-control-layers', (controlElement) => {
  controlElement.setAttribute('role', 'group');
  controlElement.setAttribute('aria-label', 'Map Layer Controls');

  const inputs = controlElement.querySelectorAll('input[type="checkbox"]');
  inputs.forEach((input, idx) => {
    input.setAttribute(
      'aria-label',
      idx === 0 ? 'Show Community Fridge and Pantry Locations' : 'Show Food Donation Sites'
    );
  });
});
```

**Sources:**

- [StackOverflow: How to use MutationObserver instead of setTimeout](https://stackoverflow.com/questions/62298433/how-to-use-mutation-observer-instead-of-settimeout-to-append-a-div) - Shows practical implementation
- [DEV.to: MutationObserver API instead of setTimeout](https://dev.to/mingyena/how-to-use-mutationobserver-api-instead-of-settimeout-1j1h) - Basic syntax and examples
- [掘金: 利用MutationObserver实现即时内容更新](https://juejin.cn/post/7368884169755918370) (May 2024) - Recent article covering optimization strategies

#### 3.2 Leaflet-Specific Event Timing

Use **Leaflet's built-in event system** instead of generic DOM timing:

```typescript
// Instead of setTimeout, use Leaflet events
map.whenReady(() => {
  // Map is fully initialized
  announce('Map loaded successfully');
});

// For layer controls
L.control
  .layers(undefined, overlays, { collapsed: false })
  .addTo(map)
  .on('add', () => {
    // Control is added to DOM
    const controlElement = document.querySelector('.leaflet-control-layers');
    if (controlElement) {
      enhanceAccessibility(controlElement);
    }
  });

// For markers
marker.on('add', () => {
  // Marker is added to map and DOM is ready
  const element = marker.getElement();
  if (element) {
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', `${name} - Click for details`);
  }
});
```

**Sources:**

- [Leaflet Official Reference - Events](https://leafletjs.com/reference.html#marker-event) - Documents built-in marker and map events
- [StackOverflow: DOMContentLoaded vs setTimeout](https://stackoverflow.com/questions/47491200/domcontentloaded-sometimes-work-and-sometimes-doesnt-while-settimeout-usually-a) - Discusses DOM timing limitations

#### 3.3 RequestAnimationFrame for Visual Updates

For visual updates (highlighting, scrolling), use `requestAnimationFrame`:

```typescript
function smoothScrollToCard(cardId: string): void {
  const card = document.querySelector(`[data-marker-id="${cardId}"]`) as HTMLElement;
  if (!card) return;

  requestAnimationFrame(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Add highlight after scroll starts
    requestAnimationFrame(() => {
      card.classList.add('card-highlighted');
    });
  });
}
```

#### 3.4 Comparison: setTimeout vs Event-Driven

| Aspect                  | setTimeout                             | Event-Driven (MutationObserver) |
| ----------------------- | -------------------------------------- | ------------------------------- |
| **Reliability**         | Unpredictable, may fire too early/late | Fires exactly when DOM changes  |
| **Performance**         | Polling wastes cycles                  | Async batch processing          |
| **Maintenance**         | Magic numbers (100ms, 500ms)           | Declarative intent              |
| **Accessibility**       | Delayed announcements                  | Immediate screen reader updates |
| **Leaflet Integration** | No map awareness                       | Uses built-in event system      |

---

## Implementation Priority

### Phase 1: Type Safety (Quick Win)

1. Replace `(global.fetch as any)` with properly typed `vi.spyOn`
2. Add `Mock<T>` types to test files
3. Enable `restoreMocks` in vitest.config.ts

### Phase 2: Card List (Core Feature)

1. Create `CardList` class with marker-card associations
2. Implement bi-directional event binding
3. Add filter/search synchronization
4. Ensure keyboard accessibility

### Phase 3: DOM Timing (Technical Debt)

1. Replace `setTimeout` in `map.ts` with MutationObserver
2. Use Leaflet's `whenReady()` event
3. Use `requestAnimationFrame` for visual updates
4. Add proper error handling for missing elements

---

## Confidence Levels

| Recommendation                                 | Confidence | Notes                                                         |
| ---------------------------------------------- | ---------- | ------------------------------------------------------------- |
| Leaflet marker-card sync with `L.Util.stamp()` | 95%        | Proven pattern from multiple sources                          |
| `vi.spyOn` over `vi.mock` for type safety      | 90%        | Official Vitest recommendation                                |
| MutationObserver vs setTimeout                 | 85%        | Well-established pattern, but requires careful implementation |
| Leaflet built-in events for timing             | 95%        | Leaflet's documented event system                             |

---

## Further Research Needed

- [ ] Testing MutationObserver performance with large marker sets (32+ markers)
- [ ] Confirming `vi.spyOn` compatibility with Vite 7.2.4
- [ ] Validating card list scroll behavior with mobile viewport
- [ ] Ensuring filter announcements work with all screen readers

---

## Sources

### Leaflet Card List Synchronization

- [StackOverflow: Make Leaflet sidebar div active on marker click and vice versa](https://stackoverflow.com/questions/22256520/make-leaflet-sidebar-div-active-on-marker-click-and-vice-versa)
- [GIS StackExchange: Dynamic map sidebar with info from marker upon click](https://gis.stackexchange.com/questions/340698/dynamic-map-sidebar-with-info-from-marker-upon-click)
- [Leaflet.marker.highlight Plugin](https://github.com/brandonxiang/leaflet.marker.highlight)
- [Highlight all markers with same feature value](https://gis.stackexchange.com/questions/469326/highlight-all-markers-with-the-same-feature-value-upon-marker-click-in-leaflet)
- [Dynamically Showing and Hiding Markers in Leaflet](https://www.raymondcamden.com/2024/09/24/dynamically-showing-and-hiding-markers-in-leaflet)

### Vitest TypeScript Mocking

- [Vitest Mock Functions API](https://vitest.dev/api/mock)
- [GitHub Issue #1781: MockedFunction type](https://github.com/vitest-dev/vitest/issues/1781)
- [GitHub Discussion #4224: vi.spyOn vs vi.mock](https://github.com/vitest-dev/vitest/discussions/4224)
- [Laconic Wit: vi.mock is a footgun](https://laconicwit.com/vi-mock-is-a-footgun-why-vi-spyon-should-be-your-default/) (July 2025)
- [StackOverflow: Vitest TypeScript errors](https://stackoverflow.com/questions/77164965/vitest-typescript-errors-ts2322-and-ts2339)
- [Dev.to: Mock vs spyOn in Vitest with TypeScript](https://dev.to/axsh/mock-vs-spyon-in-vitest-with-typescript-a-guide-for-unit-and-integration-tests-2ge6) (January 2025)

### Event-Driven DOM Timing

- [StackOverflow: MutationObserver instead of setTimeout](https://stackoverflow.com/questions/62298433/how-to-use-mutation-observer-instead-of-settimeout-to-append-a-div)
- [DEV.to: MutationObserver API instead of setTimeout](https://dev.to/mingyena/how-to-use-mutationobserver-api-instead-of-settimeout-1j1h)
- [掘金: 利用MutationObserver实现即时内容更新](https://juejin.cn/post/7368884169755918370) (May 2024)
- [StackOverflow: DOMContentLoaded limitations](https://stackoverflow.com/questions/47491200/domcontentloaded-sometimes-work-and-sometimes-doesnt-while-settimeout-usually-a)
- [Leaflet Official Reference](https://leafletjs.com/reference.html)
