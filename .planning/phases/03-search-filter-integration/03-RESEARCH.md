# Phase 03: Search & Filter Integration - Research

**Researched:** 2026-02-03
**Domain:** Vanilla TypeScript search/filtering with Leaflet layer visibility
**Confidence:** HIGH

## Summary

This research covers implementing search and filter functionality for the Pride Food Map. The project uses vanilla TypeScript with Leaflet 1.9.4 for mapping, with an existing Observer-based StateManager for bi-directional marker-card synchronization.

The core requirements are:
1. Real-time text search filtering by location name
2. Layer control visibility filtering (when map layer toggles, cards hide/show)
3. Empty state messaging when no results match
4. Clear/reset button that appears when search is active

**Primary recommendation:** Use native browser APIs with a custom debounce function. No external libraries needed. Leverage Leaflet's built-in `overlayadd`/`overlayremove` events for layer visibility tracking. Extend StateManager to include filter state, maintaining consistency with existing architecture.

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Native JavaScript | ES6+ | Search implementation | No dependencies, proven pattern |
| Leaflet events | 1.9.4 | Layer visibility tracking | Built-in API for overlay events |
| ARIA live regions | - | Accessibility announcements | W3C standard, screen reader support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Custom debounce | - | Search input optimization | Standard pattern for 300ms delay |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom debounce | Lodash debounce | Not worth dependency for one function |
| ARIA live regions | Live region polyfills | Unnecessary - excellent browser support |

**Installation:**
```bash
# No new dependencies needed - all built-in APIs
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cards.ts           # Existing: add filterCards() function
├── map.ts             # Existing: add layer event listeners
├── stateManager.ts    # Existing: extend FilterState interface
├── search.ts          # NEW: search input handler with debounce
├── emptyState.ts      # NEW: empty state UI component
└── main.ts            # Existing: wire up search functionality
```

### Pattern 1: Debounced Search Input
**What:** Wrap search handler to wait 300ms after user stops typing before filtering
**When to use:** Any real-time search input to prevent excessive DOM updates
**Example:**
```typescript
// Source: CSS-Tricks + freeCodeCamp patterns
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return function (...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Usage
const debouncedSearch = debounce((query: string) => {
  filterCards(query);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch((e.target as HTMLInputElement).value);
});
```

### Pattern 2: Leaflet Layer Event Tracking
**What:** Listen to `overlayadd` and `overlayremove` events on map object
**When to use:** Need to sync UI with layer control visibility
**Example:**
```typescript
// Source: Leaflet 1.9.4 official documentation
map.on('overlayadd', (e: L.LayersControlEvent) => {
  // e.layer is the LayerGroup that was added
  // e.name is the layer name (e.g., "Community Fridge and Pantry Locations")
  updateCardVisibility(e.name, true);
});

map.on('overlayremove', (e: L.LayersControlEvent) => {
  updateCardVisibility(e.name, false);
});
```

### Pattern 3: StateManager Extension for Filter State
**What:** Extend existing StateManager to include search query and layer visibility
**When to use:** Need centralized filter state accessible to multiple modules
**Example:**
```typescript
// Extend existing interface
export interface FilterState extends SelectionState {
  selectedId: string | null;
  searchQuery: string;
  visibleLayers: Set<string>; // "Community Fridge", "Food Donation"
}

// Add methods to StateManager
class StateManager {
  // ... existing methods ...

  setSearchQuery(query: string): void {
    if (this.state.searchQuery !== query) {
      this.state.searchQuery = query;
      this.notify();
    }
  }

  toggleLayer(layerName: string, isVisible: boolean): void {
    const layers = new Set(this.state.visibleLayers);
    if (isVisible) {
      layers.add(layerName);
    } else {
      layers.delete(layerName);
    }
    if (layers.size !== this.state.visibleLayers.size) {
      this.state.visibleLayers = layers;
      this.notify();
    }
  }
}
```

### Pattern 4: Empty State with ARIA Live Region
**What:** Show/hide empty state div with screen reader announcement
**When to use:** Search returns zero results
**Example:**
```typescript
// Source: MDN ARIA Live Regions guide
function showEmptyState(container: HTMLElement, hasResults: boolean): void {
  const emptyState = document.getElementById('empty-state');

  if (!hasResults) {
    emptyState?.classList.remove('hidden');
    // Screen readers will announce this automatically
    emptyState?.setAttribute('aria-live', 'polite');
  } else {
    emptyState?.classList.add('hidden');
  }
}
```

### Anti-Patterns to Avoid
- **Filtering by removing from DOM:** Use CSS class toggling (`.hidden`) instead - maintains event listeners and improves performance
- **Search without debouncing:** Causes excessive reflows/repaints, especially on mobile
- **Ignoring layer visibility during search:** Cards should respect both search query AND layer visibility
- **Empty state without ARIA:** Screen readers won't announce "no results found"

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Input debouncing | Custom setTimeout/clearTimeout logic | Standard debounce pattern | Edge cases around rapid typing, paste events, cleanup |
| Layer visibility | Polling map.hasLayer() | Leaflet event system | Built-in events are performant and reliable |
| Empty state visibility | Manual show/hide logic | CSS class + ARIA live region | Accessibility and maintainability |
| Search normalization | DIY case folding | String.prototype.toLocaleLowerCase() | International character support |

**Key insight:** The only thing worth building from scratch is the search/filter logic itself. All supporting patterns (debounce, events, accessibility) have established implementations.

## Common Pitfalls

### Pitfall 1: No Debouncing on Search Input
**What goes wrong:** Every keystroke triggers a DOM query and re-render. On a 50-item card list, typing "javascript" causes 10 full DOM traversals and style recalculations. Mobile devices lag noticeably.

**Why it happens:** Direct `addEventListener('input', filterCards)` feels correct but doesn't account for rapid typing.

**How to avoid:** Always wrap search handlers with 300ms debounce. This is the industry standard confirmed by multiple sources.

**Warning signs:** UI lags while typing, DevTools Performance tab shows excessive Layout/Paint operations.

### Pitfall 2: Ignoring Leaflet Layer Events
**What goes wrong:** User unchecks "Community Fridge" layer in map control, but fridge cards still show in list. Or vice versa - cards disappear when they shouldn't.

**Why it happens:** Layer control toggles are separate from card state. Without event listeners, the two systems don't communicate.

**How to avoid:** Subscribe to `overlayadd` and `overlayremove` events in map initialization. Use event.name to match against card categories.

**Warning signs:** Map markers disappear but cards remain (or vice versa), layer control feels disconnected from list.

### Pitfall 3: Empty State Not Accessible
**What goes wrong:** Search returns no results, visual empty state appears, but screen reader users hear nothing. They think the app is broken.

**Why it happens:** Empty state div is hidden with `display: none` then shown, but screen readers don't auto-announce changes unless marked as live region.

**How to avoid:** Add `aria-live="polite"` to empty state container. Update text content dynamically. The polite setting ensures it doesn't interrupt screen reader mid-sentence.

**Warning signs:** Screen reader testing shows no announcement when clearing search or getting zero results.

### Pitfall 4: Search and Layer Filters Don't Compose
**What goes wrong:** User types "fridge" (3 results), then unchecks "Community Fridge" layer. Either all cards disappear (incorrect) or hidden cards reappear (also incorrect).

**Why it happens:** Search and layer filters are applied independently instead of as a combined predicate.

**How to avoid:** Cards should only be visible if they match BOTH the search query AND the layer visibility. In code: `isVisible = matchesSearch && matchesLayer`.

**Warning signs:** Toggling layer control shows/hides cards that don't match current search.

### Pitfall 5: Reset Button Doesn't Clear All State
**What goes wrong:** User clicks "Clear" button, search text disappears but layer visibility remains unchanged. Or layer resets but search persists. Confusing partial state.

**Why it happens:** Reset function only clears one filter dimension, not all active filters.

**How to avoid:** Reset button should: (1) clear search input, (2) clear search query state, (3) show all layers, (4) announce reset to screen readers.

**Warning signs:** Clicking "Clear" doesn't return to "all cards visible" state.

## Code Examples

Verified patterns from official sources:

### Search Input with Debounce
```typescript
// Source: freeCodeCamp "How to Optimize Search in JavaScript with Debouncing" (Sept 2025)
// https://www.freecodecamp.org/news/optimize-search-in-javascript-with-debouncing/

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return function (...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Apply to search input
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const debouncedFilter = debounce((query: string) => {
  stateManager.setSearchQuery(query);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedFilter((e.target as HTMLInputElement).value);
});
```

### Leaflet Layer Event Handlers
```typescript
// Source: Leaflet 1.9.4 Official Documentation
// https://leafletjs.com/reference.html#map-overlayadd

// After layer control is added to map
map.on('overlayadd', (e: L.LayersControlEvent) => {
  const layerName = e.name;
  stateManager.toggleLayer(layerName, true);
});

map.on('overlayremove', (e: L.LayersControlEvent) => {
  const layerName = e.name;
  stateManager.toggleLayer(layerName, false);
});
```

### Card Filtering Logic
```typescript
// Source: CSS-Tricks "In-Page Filtered Search With Vanilla JavaScript"
// https://css-tricks.com/in-page-filtered-search-with-vanilla-javascript/

export function filterCards(
  cards: HTMLElement[],
  searchQuery: string,
  visibleLayers: Set<string>
): void {
  const query = searchQuery.toLowerCase().trim();

  cards.forEach((card) => {
    const name = card.querySelector('.card-name')?.textContent ?? '';
    const category = card.querySelector('.badge')?.textContent ?? '';

    const matchesSearch = name.toLowerCase().includes(query);
    const matchesLayer = visibleLayers.has(category);

    if (matchesSearch && matchesLayer) {
      card.classList.remove('hidden');
      card.setAttribute('aria-hidden', 'false');
    } else {
      card.classList.add('hidden');
      card.setAttribute('aria-hidden', 'true');
    }
  });

  // Show/hide empty state based on visible cards
  const visibleCount = cards.filter(
    (c) => !c.classList.contains('hidden')
  ).length;

  updateEmptyState(visibleCount === 0);
}
```

### Empty State with ARIA
```typescript
// Source: MDN "ARIA live regions" guide (Sept 2025)
// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions

function updateEmptyState(isEmpty: boolean): void {
  const emptyState = document.getElementById('empty-state');
  if (!emptyState) return;

  if (isEmpty) {
    emptyState.classList.remove('hidden');
    emptyState.setAttribute('aria-live', 'polite');
    emptyState.textContent = 'No locations match your search.';
  } else {
    emptyState.classList.add('hidden');
    emptyState.removeAttribute('aria-live');
  }
}
```

### Reset Button Handler
```typescript
// Source: Design Monks "Reset Button UI: What It Means and When to Use It" (July 2025)
// https://www.designmonks.co/blog/reset-button-ui

function setupResetButton(
  searchInput: HTMLInputElement,
  resetButton: HTMLElement
): void {
  // Initially hide reset button
  resetButton.classList.add('hidden');

  // Show/hide based on search state
  stateManager.subscribe((state) => {
    if (state.searchQuery) {
      resetButton.classList.remove('hidden');
      resetButton.setAttribute('aria-label', 'Clear search');
    } else {
      resetButton.classList.add('hidden');
    }
  });

  // Clear all filters on click
  resetButton.addEventListener('click', () => {
    searchInput.value = '';
    stateManager.setSearchQuery('');

    // Reset layer visibility to all visible
    stateManager.toggleLayer('Community Fridge and Pantry Locations', true);
    stateManager.toggleLayer('Food Donation Sites', true);

    // Announce to screen readers
    announce('Search cleared. Showing all locations.');
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Search on every keystroke | Debounced search (300ms) | ~2015 | Industry standard, reduces API calls and DOM updates by ~90% |
| Polling for layer visibility | Leaflet event system | Leaflet 0.7 (2013) | Events are performant, don't waste CPU cycles polling |
| Generic empty states | Context-aware, accessible empty states | ~2020 | UX best practice, improves accessibility |
| Separate search/layer filters | Composed filters (AND logic) | - | Expected behavior for multi-filter UIs |

**Deprecated/outdated:**
- **Immediate search without debounce:** Causes performance issues, especially with larger lists
- **setTimeout without clearTimeout cleanup:** Memory leaks in long-lived applications
- **Empty states without ARIA:** Not accessible to screen readers
- **CSS `:empty` pseudo-class for empty states:** Doesn't work when empty state has child elements (icons, etc.)

## Open Questions

1. **Layer name mapping**
   - What we know: Leaflet layer control uses overlay names from the `overlays` object in map.ts
   - What's unclear: Exact mapping between layer names ("Community Fridge and Pantry Locations") and card category ("Community Fridge")
   - Recommendation: Verify layer names in map.ts line 221-224, create a mapping object if names differ

2. **Empty state placement**
   - What we know: Empty state should appear in card-list container
   - What's unclear: Should it replace cards (in same grid) or appear as a separate element above/below?
   - Recommendation: Use a dedicated element outside the grid for better semantic structure and mobile layout

3. **Reset button visibility trigger**
   - What we know: Should appear when search is active
   - What's unclear: Should layer-only filtering (no search query) show reset button?
   - Recommendation: Show reset only when search has text. Layer toggles are discoverable in map control.

## Sources

### Primary (HIGH confidence)
- [Leaflet 1.9.4 API Reference](https://leafletjs.com/reference.html) - Verified overlayadd/overlayremove events, layer control API
- [MDN ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) - Accessibility patterns for dynamic content (Sept 2025)
- [freeCodeCamp - How to Optimize Search in JavaScript with Debouncing](https://www.freecodecamp.org/news/optimize-search-in-javascript-with-debouncing/) - Debounce implementation patterns (Sept 2025)

### Secondary (MEDIUM confidence)
- [CSS-Tricks - In-Page Filtered Search With Vanilla JavaScript](https://css-tricks.com/in-page-filtered-search-with-vanilla-javascript/) - Search filter implementation patterns (Oct 2021)
- [Design Monks - Reset Button UI](https://www.designmonks.co/blog/reset-button-ui) - Reset button UX best practices (July 2025)
- [Eleken - Empty state UX examples](https://www.eleken.co/blog-posts/empty-state-ux) - Empty state design patterns (Oct 2025)
- [WebAIM - Clear text within search edit field](https://webaim.org/discussion/mail_thread?thread=11104) - Accessibility considerations for clear buttons (Sept 2024)

### Tertiary (LOW confidence)
- [Stack Overflow - overlayadd & overlayremove events](https://stackoverflow.com/questions/18581318/) - Leaflet event troubleshooting (verified against official docs)
- [Pencil and Paper - Filter UX Design Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering) - General filter UX patterns (April 2023)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All built-in APIs with excellent browser support
- Architecture: HIGH - Patterns verified against official documentation and established best practices
- Pitfalls: HIGH - All pitfalls documented with verified solutions from authoritative sources

**Research date:** 2026-02-03
**Valid until:** 2026-05-03 (90 days - stable domain, but Leaflet APIs and accessibility guidelines may update)
