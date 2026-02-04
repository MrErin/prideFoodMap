# Pitfalls Research

**Domain:** Leaflet Map + Card List Synchronization with TypeScript Testing
**Researched:** 2026-02-03
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Bidirectional Highlighting Infinite Loop

**What goes wrong:**
When implementing bidirectional highlighting between map markers and card list items, the application enters an infinite render/update loop. Hovering a marker highlights the card, which triggers the card to re-highlight the marker, which triggers the marker to re-highlight the card, repeating endlessly.

**Why it happens:**
Developers create circular event handlers without proper state guards or memoization. The highlight state update triggers re-renders which re-attach event handlers, creating a cascade. This is especially common with React-Leaflet when using CircleMarker components and improper dependency arrays.

**How to avoid:**

1. Add state guards to prevent redundant updates (check if already highlighted before updating)
2. Use stable callback references with `useCallback` or equivalent
3. Implement a "highlight source" flag to prevent echo effects
4. Use memoization to prevent unnecessary re-renders of marker components
5. Consider debouncing rapid hover events

**Warning signs:**

- Browser becomes unresponsive when hovering over markers
- Console shows repeated state updates
- Profiler shows maximum CPU usage during simple interactions
- "Maximum update depth exceeded" React errors

**Phase to address:**
Phase 2 (Card List + Highlighting) - Build this correctly the first time

---

### Pitfall 2: Z-Index Wars with Popups and Custom Controls

**What goes wrong:**
Leaflet popups appear under layer controls, or custom card overlays appear below the map regardless of CSS z-index values. Developers attempt to fix by increasing z-index values endlessly without success.

**Why it happens:**
Leaflet uses an internal pane system with specific z-index ranges (tile pane: 200-400, overlay pane: 400-500, etc.). The map container and controls are carefully layered. Direct z-index manipulation conflicts with Leaflet's internal management. Custom overlays outside Leaflet's pane system don't integrate properly.

**How to avoid:**

1. Use Leaflet's `createPane()` API for custom layered content
2. Set pane z-index values between existing panes (e.g., 450 for overlays)
3. Use CSS to target specific panes: `.leaflet-pane.my-custom-pane { z-index: 450; }`
4. For non-Leaflet overlays, position them outside the map container with `position: fixed` or `absolute`
5. Never use z-index values above 1000 for Leaflet elements (reserved for controls)

**Warning signs:**

- Popups are clipped by map container edges
- Controls appear above popups regardless of z-index
- Increasing z-index has no effect
- Custom overlays are unclickable or obscured

**Phase to address:**
Phase 2 (Card List + Highlighting) - Plan overlay architecture before building

---

### Pitfall 3: Stale Marker References After Filter/Update

**What goes wrong:**
After filtering the location list or updating markers, clicking a marker highlights the wrong card, or hovering a card highlights the wrong marker. The map-list synchronization breaks.

**Why it happens:**
Event handlers capture marker references in closures that don't update when the marker array changes. Filter operations create new arrays but old references persist in event handlers. Markers removed from the map still have active event listeners pointing to DOM elements that no longer exist or have been repurposed.

**How to avoid:**

1. Store markers in a LayerGroup and use `clearLayers()` before rebuilding
2. Use stable IDs (not array indices) to link markers with cards
3. Remove event listeners explicitly: `marker.off('click', handler)`
4. Rebuild both map markers and list items together during filter updates
5. Consider a Map data structure to lookup markers by ID

**Warning signs:**

- Clicking marker N highlights card M (where N != M)
- Hover effects trigger on wrong elements after filtering
- Console shows errors accessing properties of undefined
- Memory usage increases with each filter operation

**Phase to address:**
Phase 3 (Search/Filter) - Design data flow with filter operations in mind

---

### Pitfall 4: Event Listener Memory Leaks

**What goes wrong:**
Memory usage increases over time as users interact with the map. After filtering multiple times, the application slows down significantly.

**Why it happens:**
Event listeners attached to markers are never removed when markers are cleared. Each filter operation adds new listeners without cleaning up old ones. The LayerGroup `clearLayers()` method removes layers from the map but doesn't automatically remove custom event handlers attached to those layers.

**How to avoid:**

1. Always store handler references to remove them later
2. Use `layerGroup.clearLayers()` which should clean up Leaflet's internal listeners
3. For custom DOM event listeners, track them and remove explicitly
4. Call `map.remove()` when destroying the map component
5. Use browser DevTools Memory profiler to detect listener leaks

**Warning signs:**

- Memory profile shows steady increase with each filter operation
- Performance degrades after 10+ filter operations
- Event handlers fire multiple times for single interactions
- "Maximum call stack size exceeded" errors

**Phase to address:**
Phase 3 (Search/Filter) - Implement proper cleanup from the start

---

### Pitfall 5: Fake Timer Test Flakiness

**What goes wrong:**
Tests using `vi.useFakeTimers()` pass locally but fail in CI, or fail intermittently. Tests that mock `setTimeout` don't properly wait for promises to resolve.

**Why it happens:**
`vi.useFakeTimers()` doesn't automatically advance time for promise callbacks. The existing `announce()` function uses `setTimeout`, and tests may not advance timers enough. When combining fake timers with `vi.waitFor()`, the interaction is complex: `vi.waitFor` automatically advances timers, but only within each check interval.

**How to avoid:**

1. Replace `setTimeout` with test-deferrable promises where possible
2. When using fake timers, manually advance after async operations: `vi.advanceTimersByTime(100)`
3. Use `vi.waitFor()` with fake timers (it auto-advances within check intervals)
4. Always restore real timers in `afterEach`: `vi.useRealTimers()`
5. Consider `vi.useRealTimers()` for integration tests where timing isn't critical
6. Use `vi.stubGlobal()` for `setTimeout` to track calls

**Warning signs:**

- Tests pass locally but fail in CI
- "Received 0 timeouts" errors
- Async operations never complete in tests
- Tests timeout after 5000ms

**Phase to address:**
Phase 4 (Test Refactoring) - Fix timing issues when refactoring tests

---

### Pitfall 6: Over-Engineered TypeScript Mocks

**What goes wrong:**
Tests become brittle and break when implementation details change. Mocks are more complex than the code being tested. Type assertions (`as any`) bypass TypeScript's safety.

**Why it happens:**
Developers mock everything "for isolation" and end up testing mock behavior instead of real behavior. Complex mock setups with `vi.mock()` create tight coupling to implementation. Using `any` types on mocks loses TypeScript's compile-time checks.

**How to avoid:**

1. Prefer `vi.spyOn()` over `vi.mock()` for existing module methods
2. Only mock external dependencies (fetch, Leaflet map operations)
3. Use `expectTypeOf()` to verify types without implementation coupling
4. Create test factory functions to build consistent mock data
5. Use Partial<> utility type instead of `as any` for optional mock properties
6. Focus on behavior, not implementation

**Warning signs:**

- Mock setup is longer than test code
- Tests break when refactoring non-tested code
- Multiple `as any` assertions in a single test
- Mock return values don't match actual function signatures

**Phase to address:**
Phase 4 (Test Refactoring) - Simplify mocks while improving type safety

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut                           | Immediate Benefit                   | Long-term Cost                                      | When Acceptable                                          |
| ---------------------------------- | ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `as any` on mocks                  | Faster test writing, no type errors | Loses type safety, mocks can diverge from real APIs | Only for third-party libraries without types             |
| `setTimeout` for timing            | Simple implementation               | Tests need fake timers, introduces nondeterminism   | Only for actual delayed UI updates, never for sequencing |
| Array indices as IDs               | Simple, no need for unique IDs      | Breaks on filter/sort, stale references             | Never in production - always use stable IDs              |
| Global test setup                  | Less test boilerplate               | Hidden dependencies, harder to debug                | Only for truly shared fixtures (DOM, test container)     |
| Ignoring z-index with `!important` | Quick visual fix                    | Fragile to Leaflet updates, breaks pane system      | Never - use proper pane management                       |
| Event handlers in closures         | Less code                           | Memory leaks, stale references                      | Use bound methods or remove handlers explicitly          |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration   | Common Mistake                                      | Correct Approach                                            |
| ------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| Leaflet Map   | Creating map before DOM is ready                    | Use `DOMContentLoaded` or mount in component effect         |
| CSV Loading   | No error handling for fetch failures                | Wrap in try/catch, show user-friendly error                 |
| ARIA Live     | Only announcing first update (content not clearing) | Clear text content, then setTimeout before setting new text |
| Layer Control | Assuming checkboxes exist immediately               | Use MutationObserver or delay after control creation        |
| Custom Icons  | Broken icon paths in production                     | Use `import.meta.env.BASE_URL` prefix for all assets        |
| Marker Events | Not cleaning up listeners on filter                 | Track handlers and `.off()` them before rebuild             |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap                                | Symptoms                        | Prevention                                   | When It Breaks      |
| ----------------------------------- | ------------------------------- | -------------------------------------------- | ------------------- |
| Re-rendering all markers on filter  | Lag during typing, UI freeze    | Update only visible markers, virtualize list | 50+ locations       |
| No marker clustering                | Map unusable at zoomed-out view | Use Leaflet.markercluster for 100+ markers   | 100+ markers        |
| Synchronous CSV parsing             | Page freeze during load         | Already using PapaParse (async) - keep it    | Large CSV files     |
| Naive search (O(n) string contains) | Lag with each keystroke         | Debounce input, consider indexed search      | 200+ locations      |
| Rebuilding entire DOM on filter     | Flash of unstyled content       | Update existing elements instead of replace  | Any size, poor UX   |
| Real-time map bounds check          | Map drag is choppy              | Throttle/debounce bounds check events        | Any interactive map |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake                               | Risk                                     | Prevention                                             |
| ------------------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| CSV injection in location names       | Formula injection when users export data | Sanitize input, escape special characters (=, +, -, @) |
| Unescaped HTML in popups              | XSS if CSV contains malicious content    | Use textContent or sanitize HTML                       |
| CORS misconfiguration on CSV endpoint | Data can be loaded by any site           | Verify origin header, use same-origin if possible      |
| Leaflet version downgrade             | Known vulnerabilities exploited          | Pin Leaflet version in package.json, use `npm audit`   |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall                                   | User Impact                      | Better Approach                                       |
| ----------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| Map auto-pans on every hover              | Motion sickness, loss of context | Only pan on click/focus, not hover                    |
| Search filters without "No results" state | User thinks app is broken        | Show friendly message when filter yields 0 results    |
| Marker hover triggers popup immediately   | Popups cover other content       | Use highlight effect, popup only on click             |
| ARIA announcements on every keystroke     | Screen reader spam               | Debounce announcements, announce only final results   |
| List card hover jumps map view            | Disorienting, hard to explore    | Smooth pan, consider viewport bounds, allow disable   |
| Keyboard trap in map                      | Can't tab past map controls      | Ensure all interactive elements have proper tab order |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Marker-Card Sync:** Often missing cleanup on filter — verify hover works correctly after typing in search
- [ ] **Keyboard Navigation:** Often missing arrow key navigation — verify Tab focuses markers, Enter opens popup
- [ ] **Screen Reader Announcements:** Often missing filter result count — verify "5 results found" announces
- [ ] **Mobile Touch:** Often missing touch event handling — verify tap works same as click on mobile
- [ ] **Error States:** Often missing CSV load failure — verify broken CSV shows friendly error
- [ ] **Loading States:** Often missing spinner during initial load — verify users know data is loading
- [ ] **Focus Management:** Often missing focus return after modal/popup — verify focus goes back to triggering element

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall              | Recovery Cost | Recovery Steps                                                                                                        |
| -------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| Infinite render loop | MEDIUM        | 1. Add source tracking to state updates 2. Add early-return guards 3. Profile with React DevTools to find cycle       |
| Z-index conflicts    | LOW           | 1. Identify correct pane for content 2. Use `map.createPane()` 3. Move element to proper pane                         |
| Stale references     | HIGH          | 1. Add unique IDs to all data 2. Rebuild event handlers on filter 3. Clear LayerGroup properly                        |
| Memory leaks         | HIGH          | 1. Use Chrome DevTools Memory profiler 2. Find detached DOM elements 3. Trace event listeners 4. Add explicit cleanup |
| Flaky timer tests    | LOW           | 1. Replace setTimeout with promises 2. Use vi.waitFor() 3. Add explicit timer advances                                |
| Brittle mocks        | MEDIUM        | 1. Identify what each test actually needs 2. Replace complex mocks with spies 3. Add proper types                     |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall                         | Prevention Phase                   | Verification                                                          |
| ------------------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Bidirectional highlighting loop | Phase 2 (Card List + Highlighting) | Test rapid hover in both directions, verify no CPU spike              |
| Z-index wars                    | Phase 2 (Card List + Highlighting) | Verify popups appear above all elements, test with browser zoom       |
| Stale marker references         | Phase 3 (Search/Filter)            | Filter by typing, click marker, verify correct card highlights        |
| Event listener leaks            | Phase 3 (Search/Filter)            | Filter 20 times, check Chrome DevTools Memory for listener count      |
| Fake timer flakiness            | Phase 4 (Test Refactoring)         | Run tests 100 times locally, verify all pass consistently             |
| Over-engineered mocks           | Phase 4 (Test Refactoring)         | Count mock lines vs test lines, refactor if mocks > test code         |
| ARIA announcement failures      | Phase 2 (Card List + Highlighting) | Test with NVDA/VoiceOver, verify all interactions announce            |
| Performance degradation         | Phase 3 (Search/Filter)            | Load 200 locations, filter rapidly, verify < 100ms response time      |
| Keyboard navigation gaps        | Phase 2 (Card List + Highlighting) | Navigate entire map with keyboard only, verify all elements reachable |
| Mobile touch issues             | Phase 2 (Card List + Highlighting) | Test on real mobile device, verify tap works everywhere click does    |

## Sources

### Leaflet-Specific Sources

- [Leaflet Accessibility Guide](https://leafletjs.com/examples/accessibility/) - Official guide on marker labeling and keyboard navigation
- [Working with Map Panes](https://leafletjs.com/examples/map-panes/) - Official pane system documentation
- [GitHub Issue: Memory not freed with layer groups (#8538)](https://github.com/Leaflet/Leaflet/issues/8538) - Memory leak with clearLayers()
- [GitHub Issue: Marker click events bug (#2619)](https://github.com/Leaflet/Leaflet/issues/2619) - Marker event timing issues
- [StackOverflow: Leaflet popup on mouseover removes click event](https://stackoverflow.com/questions/14141988/leaflet-popup-on-mouseover-removes-click-event) - Event conflicts
- [StackOverflow: Leaflet highlight marker on mouseover](https://stackoverflow.com/questions/36614071/leaflet-highlight-marker-when-mouseover-with-different-colors) - Marker highlighting patterns
- [GitHub Issue: react-leaflet marker infinite loop](https://stackoverflow.com/questions/64527846/react-leaflet-mapping-an-array-of-circlemarker-goes-into-an-infinite-loop) - Circular rendering issues
- [StackOverflow: Clear markers from map](https://stackoverflow.com/questions/33212532/how-to-clear-the-markers-from-the-map) - Proper cleanup patterns

### Testing & TypeScript Sources

- [Vitest Timers Documentation](https://vitest.dev/guide/mocking/timers) - Official fake timer guide
- [Vitest waitUntil and fake timers discussion](https://github.com/vitest-dev/vitest/discussions/7431) - waitFor + fake timers interaction
- [Using Fake Timers - Testing Library](https://testing-library.com/docs/using-fake-timers/) - Best practices for DOM testing
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking) - Official mocking documentation
- [vi.spyOn vs vi.mock discussion](https://github.com/vitest-dev/vitest/discussions/4224) - Mocking best practices
- [How to avoid flaky tests in Vitest](https://trunk.io/blog/how-to-avoid-and-detect-flaky-tests-in-vitest) - Flaky test prevention
- [10 Jest/Vitest Patterns That Reduce Flaky Tests](https://medium.com/@Modexa/10-jest-vitest-patterns-that-reduce-flaky-tests-4105009ead56) - Anti-patterns and solutions

### Performance Sources

- [Optimizing Leaflet Performance with Large Number of Markers](https://medium.com/@silvajohnny777/optimizing-leaflet-performance-with-a-large-number-of-markers-0dea18c2ec99) - Performance strategies
- [Best practices for handling thousands of markers](https://stackoverflow.com/questions/21795319/best-practices-for-handling-thousands-of-markers-with-leaflet) - Server-side filtering
- [Rendering Leaflet clusters fast and dynamically](https://dev.to/agakadela/rendering-leaflet-clusters-fast-and-dynamically-let-s-compare-3-methods-291p) - 10x performance improvement
- [Performance optimization with 12000+ markers](https://dev.to/azyzz/performance-optimization-when-adding-12000-markers-to-the-map-that-renders-fast-with-elixir-liveview-and-leafletjs-54pf) - Large-scale case study

### Accessibility Sources

- [ARIA Live Regions - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) - Live region documentation
- [Accessible notifications with ARIA Live Regions - Sara Soueidan](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-1/) - In-depth guide
- [The Complete Guide to ARIA Live Regions](https://www.a11y-collective.com/blog/aria-live/) - Developer comprehensive guide
- [StackOverflow: Adding accessibility to Leaflet map](https://stackoverflow.com/questions/79701376/adding-accessibility-to-a-leaflet-map) - Map-specific ARIA discussion

---

_Pitfalls research for: Leaflet Map + Card List Synchronization with TypeScript Testing_
_Researched: 2026-02-03_
