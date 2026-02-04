# Project Research Summary

**Project:** Pride Food Map - Chattanooga Food Resource Locator
**Domain:** Interactive location map with synchronized card list (Leaflet + TypeScript)
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

This is a community food resource map requiring a synchronized card list component. Users expect a master-detail pattern where clicking a map marker highlights its card and vice versa — this is standard UX for location-based applications (Yelp, Google Maps, restaurant finders).

The recommended approach uses **event-driven state management** without adding new libraries. The existing TypeScript + Vite + Leaflet + Vitest stack is sufficient. Implement a `StateManager` class for bi-directional marker-card synchronization, use `L.Util.stamp()` for unique marker IDs, and replace `setTimeout` patterns with `MutationObserver` for reliable DOM timing. All patterns are well-documented with proven implementations.

Key risks center on **circular event loops** (hover-triggered highlight cycles), **memory leaks** from uncleared event listeners during filtering, and **stale marker references** when the filter changes. Mitigation: Use state guards to prevent redundant updates, explicitly track and remove event handlers, and use stable IDs (not array indices) for marker-card associations.

## Key Findings

### Recommended Stack

No new libraries required. The existing TypeScript + Vite + Leaflet + Vitest stack is optimal for this feature set.

**Core technologies:**

- **Leaflet (existing)**: Map rendering and marker management — Use built-in event system (`whenReady`, `add`, `click`) instead of generic DOM timing
- **Vanilla TypeScript (existing)**: State management via custom `StateManager` class — Avoids framework complexity, uses event emitter pattern for cross-component communication
- **Vitest (existing)**: Test runner with `vi.spyOn` for type-safe mocking — Prefer `vi.spyOn` over `vi.mock` to avoid hoisting issues and `any` types
- **MutationObserver (native)**: Replace `setTimeout` for DOM detection — Event-driven timing is more reliable than arbitrary delays

**Key version considerations:**

- Vite 7.2.4: Confirm `vi.spyOn` compatibility during implementation
- Leaflet: Use `L.Util.stamp()` for unique marker IDs

### Expected Features

**Must have (table stakes):**

- **Synchronized map+list view** — Users expect clicking either view updates the other (master-detail pattern)
- **Search/filter by name** — Text input filters cards in real-time; overwhelming list without search feels broken
- **Category badges** — Visual distinction between fridge/donation locations is critical for users
- **Active state indication** — Border highlight (not background color) on both card and marker shows current selection
- **Keyboard navigation** — Tab through cards, Enter to select, Esc to deselect (accessibility requirement)
- **Mobile-responsive layout** — Stacked layout (map top, list below) on screens <768px

**Should have (competitive):**

- **Auto-scroll to active card** — When marker clicked, list smoothly scrolls to corresponding card
- **"Search this area" button** — Shows only locations in current map viewport (reduces cognitive load)
- **Empty state messaging** — "No locations found" with clear/reset option reduces user frustration

**Defer (v2+):**

- **Distance sorting** — "Nearest first" requires geolocation API and distance calculations
- **Status badges (Open/Closed)** — Requires hours data in CSV and time-zone-aware parsing
- **Favorite/bookmark locations** — Requires localStorage or user accounts for persistence

### Architecture Approach

Create a dedicated `cards.ts` module alongside existing `map.ts` with a shared `StateManager` for bi-directional communication.

**Major components:**

1. **`StateManager` class** — Centralized state object with pub/sub pattern; tracks `activeId`, `hoveredId`, and `visibleLayer`; both `map.ts` and `cards.ts` subscribe to changes
2. **`map.ts` (existing, enhanced)** — Leaflet map, markers, layer controls; exports `MarkerData` interface and marker registry for O(1) lookups
3. **`cards.ts` (new)** — Card list rendering, highlighting, and DOM manipulation; imports `MarkerData` from `map.ts`, subscribes to `StateManager` for active state
4. **`main.ts` (orchestrator)** — Initialization sequence: load CSV data → initialize map → render cards → wire up state subscriptions

**Data flow:** CSV data loaded once, passed to both map and cards; marker-card relationships stored via `L.Util.stamp()` IDs; state changes propagate through `StateManager` to both components.

### Critical Pitfalls

1. **Bidirectional highlighting infinite loop** — Add state guards to prevent redundant updates (check if already highlighted before updating); use "highlight source" flag to prevent echo effects; debounce rapid hover events
2. **Stale marker references after filter** — Use stable IDs (not array indices); remove event listeners explicitly with `marker.off('click', handler)` before rebuilding; store markers in `Map<string, L.Marker>` for O(1) lookups
3. **Event listener memory leaks** — Track handler references and remove explicitly during filter operations; use `layerGroup.clearLayers()` which should clean up Leaflet's internal listeners; verify with Chrome DevTools Memory profiler
4. **Z-index wars with popups** — Use Leaflet's `createPane()` API for custom layered content; set pane z-index between existing panes (e.g., 450); never use z-index above 1000 (reserved for controls)
5. **Over-engineered TypeScript mocks** — Prefer `vi.spyOn()` over `vi.mock()`; only mock external dependencies (fetch, Leaflet operations); use `Partial<>` utility type instead of `as any`

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Type Safety & Test Infrastructure

**Rationale:** Quick win that improves developer confidence; must complete before complex mocking is needed for card list tests
**Delivers:** Properly typed Vitest mocks, `vi.spyOn` pattern established, no `any` types in tests
**Addresses:** STACK.md Vitest recommendations
**Avoids:** PITFALLS.md "Over-engineered TypeScript mocks"
**Complexity:** LOW | Duration: Short

### Phase 2: Card List + Bi-directional Highlighting

**Rationale:** Core feature that users expect; foundational for all other features; most complex interaction pattern
**Delivers:** `cards.ts` module, `StateManager` class, marker-card sync via `L.Util.stamp()`, keyboard navigation, ARIA attributes
**Uses:** Leaflet events system, MutationObserver for DOM detection
**Implements:** ARCHITECTURE.md component boundaries
**Addresses:** FEATURES.md table stakes (synchronized view, active state, keyboard nav)
**Avoids:** PITFALLS.md infinite loop, z-index wars
**Complexity:** MEDIUM | Duration: Medium

### Phase 3: Search/Filter with Cleanup

**Rationale:** Depends on Phase 2 (card list must exist to filter); proper cleanup patterns prevent memory leaks
**Delivers:** Real-time search by name, layer filtering synced between map and cards, explicit event listener cleanup, empty state messaging
**Uses:** `StateManager.setFilter()`, marker registry for O(1) lookups
**Addresses:** FEATURES.md "Search/filter by name"
**Avoids:** PITFALLS.md stale references, memory leaks
**Complexity:** MEDIUM | Duration: Medium

### Phase 4: Polish & Technical Debt

**Rationale:** Defer timing fixes until core features work; less critical for user value
**Delivers:** `setTimeout` → MutationObserver refactoring, auto-scroll to active card, "Search this area" button, improved accessibility announcements
**Uses:** `map.whenReady()` events, `requestAnimationFrame` for visual updates
**Addresses:** STACK.md event-driven timing recommendations, FEATURES.md differentiators
**Avoids:** PITFALLS.md "Fake timer test flakiness"
**Complexity:** LOW-MEDIUM | Duration: Medium

### Phase Ordering Rationale

- **Phase 1 first** because test infrastructure is easier to establish before complex card list code exists; reduces refactoring later
- **Phase 2 second** because bi-directional sync is the hardest interaction pattern; all other features build on this foundation
- **Phase 3 third** because filtering requires stable marker IDs from Phase 2 and proper cleanup prevents hard-to-diagnose memory leaks
- **Phase 4 last** because polish features (auto-scroll, viewport search) don't block core functionality; technical debt removal is safer once app is working

This order follows dependency chains from ARCHITECTURE.md: card list requires marker data → search requires card list → polish requires working search. It also addresses PITFALLS.md prevention by building cleanup patterns into Phase 3.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 2:** Bi-directional sync implementation details; while patterns are documented, exact event handler attachment points may need exploration based on existing code structure
- **Phase 3:** Filter performance with 32+ markers; may need debouncing or virtualization if current data set grows

Phases with standard patterns (skip research-phase):

- **Phase 1:** Vitest mocking patterns are well-documented; `vi.spyOn` usage is straightforward
- **Phase 4:** MutationObserver and `requestAnimationFrame` are standard Web APIs with extensive documentation

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                           |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | All recommendations from official docs (Leaflet, Vitest) or high-quality community sources                                      |
| Features     | HIGH       | Table stakes features verified against competitor analysis (Google Maps, Yelp, MapTiler)                                        |
| Architecture | HIGH       | Event-driven state pattern is standard for vanilla TypeScript apps; component boundaries follow single responsibility principle |
| Pitfalls     | HIGH       | All pitfalls documented with specific prevention strategies from multiple sources; recovery strategies included                 |

**Overall confidence:** HIGH

All research backed by official documentation or high-quality community sources with multiple corroborating references. Implementation patterns are proven in production applications.

### Gaps to Address

Minor gaps to validate during implementation:

- **MutationObserver performance:** Research confirms pattern works but hasn't tested with current marker set (32+ locations); monitor during Phase 2 implementation
- **Vitest 7.2.4 compatibility:** STACK.md notes `vi.spyOn` should work but version-specific quirks may emerge; verify during Phase 1
- **Mobile scroll behavior:** Auto-scroll to active card on mobile may need viewport height calculations; test on real device during Phase 4

None of these gaps justify blocking roadmap creation. They can be addressed during phase execution with `/gsd:research-phase` if needed.

## Sources

### Primary (HIGH confidence)

- [Leaflet Official Reference](https://leafletjs.com/reference.html) — Built-in event system, marker API, `L.Util.stamp()`
- [Vitest Mock Functions API](https://vitest.dev/api/mock) — Official mock documentation, `vi.spyOn` usage
- [PatternFly Card Accessibility](https://www.patternfly.org/components/card/accessibility) — Card selection states, ARIA attributes
- [MDN ARIA Reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) — `aria-selected`, live regions
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/) — Official accessibility patterns

### Secondary (MEDIUM confidence)

- [MapTiler SDK JS - List of Places](https://docs.maptiler.com/sdk-js/examples/list-of-places/) — Bi-directional sync pattern with "Search this area" button
- [StackOverflow: Leaflet sidebar div active on marker click](https://stackoverflow.com/questions/22256520) — Marker-card association examples
- [GIS StackExchange: Dynamic map sidebar](https://gis.stackexchange.com/questions/340698) — Working `L.Util.stamp()` example
- [GitHub: vi.spyOn vs vi.mock discussion](https://github.com/vitest-dev/vitest/discussions/4224) — Mocking best practices
- [Leaflet Working with Map Panes](https://leafletjs.com/examples/map-panes/) — Pane system for z-index management

### Tertiary (LOW confidence)

- [UX StackExchange: Map UI patterns](https://ux.stackexchange.com/questions/17380) — Community discussion on map UX
- [掘金: MutationObserver即时更新](https://juejin.cn/post/7368884169755918370) — Chinese article on MutationObserver optimization (translated)

---

_Research completed: 2026-02-03_
_Ready for roadmap: yes_
