# Feature Research

**Domain:** Interactive location map with synchronized list view (community food resources)
**Researched:** 2026-02-03
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Synchronized map+list view** | Standard pattern in location apps (Yelp, restaurants, travel) — users expect clicking list highlights marker and vice versa | MEDIUM | Master-detail pattern is expected UX; bi-directional linking required |
| **Search/filter by name** | Users expect to find locations by text search; overwhelming list without search feels broken | LOW | Basic text input with real-time filtering is minimum expectation |
| **Category badges/tags** | Visual categorization helps users quickly identify location types (fridge vs donation) | LOW | Color-coded badges are standard pattern for map-based apps |
| **Clear "active" state indication** | When selection is made, users must see which item is active across both views | LOW | Visual feedback (border highlight, shadow) is expected behavior |
| **Keyboard navigation** | Accessibility requirement; users must navigate list without mouse | MEDIUM | Tab through cards, Enter to select, arrow keys within list |
| **Mobile-responsive layout** | Users access food resources on phones; stacked layout (map above list) expected | MEDIUM | Split view on desktop, stacked on mobile |
| **Alphabetical list ordering** | Predictable sorting helps users scan for known locations | LOW | Simple sort by location name |
| **Location type filtering** | Toggle buttons for showing/hiding marker types are standard map UX | LOW | Layer control already exists; should sync with list |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"Search this area" button** | Shows only locations visible in current map viewport — reduces cognitive load when map is zoomed to specific area | HIGH | MapTiler tutorial shows this pattern; requires viewport calculations |
| **Auto-scroll to active card** | When marker clicked, list scrolls to and highlights corresponding card | MEDIUM | Requires tracking card positions and smooth scroll behavior |
| **Empty state messaging** | "No locations found" with helpful guidance reduces user frustration | LOW | Adds polish but not critical for MVP |
| **Quick actions on cards** | "Get directions" or "Call" buttons directly on card for immediate action | MEDIUM | External links (Google Maps, phone) add utility |
| **Status badges (Open/Closed)** | If hours data available, showing open/closed status is high-value | HIGH | Requires real-time data or hours parsing; consider for v2 |
| **Distance sorting** | "Nearest first" option helps users find closest resources | HIGH | Requires geolocation API and distance calculations |
| **Favorite/bookmark locations** | Users can save frequently-visited locations for quick access | HIGH | Requires local storage or user accounts |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Background color highlight for active state** | Seems like obvious way to show selection | Can conflict with card background, reduces accessibility for color-blind users | Use border highlight (3px solid) with focus-visible indicator |
| **Real-time map pan filters list** | Seems helpful to show only visible locations | List jumping around as user pans map is disorienting; hard to find specific location | Use "Search this area" button instead — user controls when to filter |
| **Multiple active selections** | Allows comparing multiple locations | Breaks mental model of "single active selection"; unclear which marker corresponds to which card | Single selection only; click elsewhere or active card clears previous |
| **Animated bouncing markers** | Draws attention to selected location | Can be distracting, motion sensitivity issues, may not work well with Leaflet's default marker icons | Simple CSS border highlight on marker icon or swap to "selected" icon |
| **Complex multi-field search** | Seems powerful to search by address, zip, name, etc. | Overwhelming for simple use case; vanilla TS implementation becomes complex quickly | Single text search on location name; add fields if users request |

## Feature Dependencies

```
[Card list rendering]
    └──requires──> [CSV data parsing]
                  └──requires──> [Location data structure]

[Category badges]
    └──requires──> [Location type field in data]
                  └──enhances──> [Card list rendering]

[Search/filter by name]
    └──requires──> [Card list rendering]
    └──conflicts──> [Real-time viewport filtering] (choose one or use button)

[Bi-directional highlighting]
    └──requires──> [Marker-card relationship tracking]
                  └──requires──> [Card list rendering]
                  └──requires──> [Active state management]

[Keyboard navigation]
    └──requires──> [Active state management]
    └──enhances──> [Accessibility]
```

### Dependency Notes

- **Card list rendering requires CSV data parsing**: Can't render cards without location data; existing CSV parsing provides this
- **Category badges requires location type field**: Badges need `type` field (fridge/donation) which exists in current CSV structure
- **Search/filter by name conflicts with real-time viewport filtering**: Both filtering on the same list creates confusion; recommended approach is text search by default with optional "Search this area" button for viewport-based filtering
- **Bi-directional highlighting requires marker-card relationship tracking**: Need to map each marker ID to its corresponding card DOM element and vice versa
- **Keyboard navigation enhances accessibility**: Once active state is managed, keyboard navigation (Tab/Enter/Arrow keys) provides accessible alternative to mouse

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Card list below map** — Core feature; users need list view alternative to map-only
- [ ] **Category badges on cards** — Visual distinction between fridge/donation is critical for users
- [ ] **Alphabetical ordering** — Predictable scanning; easy to implement with Array.sort()
- [ ] **Bi-directional highlighting (card ↔ marker)** — Users expect clicking either view updates the other
- [ ] **Search by location name** — Text input filters cards in real-time; expected behavior
- [ ] **Active state visual feedback** — Border highlight on both card and marker shows current selection
- [ ] **Mobile-responsive layout** — Stacked layout (map top, list bottom) on small screens
- [ ] **Keyboard navigation basics** — Tab through cards, Enter to select, Esc to deselect
- [ ] **ARIA attributes for accessibility** — `aria-selected`, `aria-label`, role attributes on cards

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **"Search this area" button** — Triggered after map view changes (zoom/pan) for viewport-filtered results
- [ ] **Auto-scroll to active card** — Smooth scroll when marker clicked to bring corresponding card into view
- [ ] **Empty state messaging** — "No locations match your search" with clear/reset option
- [ ] **Focus management** — Return focus to card after marker interaction; maintain logical tab order

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Distance sorting** — "Sort by nearest" requires geolocation API and distance calculations
- [ ] **Status badges (Open/Closed)** — Requires hours data in CSV and time-zone-aware calculations
- [ ] **Favorite/bookmark locations** — Requires localStorage or user accounts for persistence
- [ ] **Quick action buttons** — "Get directions" link to Google Maps, phone number links
- [ ] **Advanced filtering** — Filter by multiple attributes (hours, amenities, etc.)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Card list rendering | HIGH | LOW | P1 |
| Bi-directional highlighting | HIGH | MEDIUM | P1 |
| Search by name | HIGH | LOW | P1 |
| Category badges | HIGH | LOW | P1 |
| Active state feedback | HIGH | LOW | P1 |
| Alphabetical ordering | MEDIUM | LOW | P1 |
| Mobile responsive layout | HIGH | MEDIUM | P1 |
| Keyboard navigation | HIGH | MEDIUM | P1 |
| ARIA accessibility | HIGH | MEDIUM | P1 |
| Auto-scroll to card | MEDIUM | MEDIUM | P2 |
| "Search this area" button | MEDIUM | HIGH | P2 |
| Empty state messaging | LOW | LOW | P2 |
| Distance sorting | MEDIUM | HIGH | P3 |
| Status badges (Open/Closed) | MEDIUM | HIGH | P3 |
| Favorite locations | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (table stakes)
- P2: Should have, add when possible (differentiators)
- P3: Nice to have, future consideration (post-MVP)

## Competitor Feature Analysis

| Feature | Google Maps | Yelp | MapTiler Example | Our Approach |
|---------|-------------|------|------------------|--------------|
| List/map sync | Yes (sidebar) | Yes (left panel) | Yes (tutorial example) | Stacked layout (map top, list below) |
| Search/filter | Yes (multi-field) | Yes (categories + text) | Yes (viewport-based) | Text search by name only (MVP) |
| Category badges | Yes (map icons) | Yes (price, categories) | Yes (custom icons) | Color-coded badges on cards |
| Active state | Yes (border highlight) | Yes (background + border) | Yes (icon swap) | Border highlight on card + marker |
| Mobile layout | Yes (full-screen map toggle) | Yes (map/list tabs) | Yes (responsive) | Stacked layout (map always visible) |
| Keyboard nav | Yes (full support) | Partial | Unknown | Full keyboard navigation (P1) |

## Mobile vs Desktop Patterns

### Desktop (768px+)
- **Split layout**: Map takes upper ~50% viewport, list below
- **Hover states**: Cards show hover effect, `:hover` + `:focus-visible` for keyboard users
- **Click interaction**: Click card → highlight marker, center map on location
- **Scrollbar**: Vertical scroll for card list, map stays fixed

### Mobile (<768px)
- **Stacked layout**: Map top ~40vh, list below (scrollable)
- **Touch targets**: Min 44px height for cards (WCAG 2.5.5)
- **Tap interaction**: Tap card → highlight marker, smooth pan to location
- **Compact badges**: Smaller font size, stacked badges if needed
- **Scroll behavior**: Consider auto-scrolling list to active card after marker tap

## Accessibility Considerations

### Card Selection State
- Use `aria-selected="true"` on active card within the list container
- Border highlight (3-4px solid color) provides visual indication
- Don't rely on background color alone (WCAG SC 1.4.1)
- Ensure minimum 3:1 contrast ratio for highlight border

### Keyboard Navigation
- Tab through cards using `tabindex="0"` on cards
- Enter or Space to select a card
- Arrow keys (optional enhancement) to navigate between cards
- Escape to deselect current selection
- Focus visible indicator required (`:focus-visible` pseudo-class)

### Screen Reader Support
- Cards in `<ul>` with `<li>` wrappers (PatternFly recommendation)
- `aria-label` on list container: "List of food locations (X results)"
- Each card: `aria-label` or `aria-labelledby` pointing to card title
- Hidden input (`hasSelectableInput` pattern) for proper selection state
- Announce selection changes: "Downtown Fridge selected"

### Focus Management
- When marker clicked: Set focus on corresponding card
- When card clicked: Highlight marker but don't move focus from list
- Return focus after modal/interaction completes
- Logical tab order: Search input → Card list → Map controls

## Sources

- [MapTiler SDK JS - How to sync the map with a list of places](https://docs.maptiler.com/sdk-js/examples/list-of-places/) — HIGH confidence, official documentation showing bi-directional sync pattern with "Search this area" button
- [Setproduct - Badge UI Design Exploration](https://www.setproduct.com/blog/badge-ui-design) — MEDIUM confidence, comprehensive badge design patterns (filtering, categorizing use cases)
- [PatternFly - Card Accessibility](https://www.patternfly.org/components/card/accessibility) — HIGH confidence, official accessibility documentation for card components with selection states
- [MDN - ARIA states and properties](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes) — HIGH confidence, official ARIA attribute documentation
- [UX StackExchange - Interactive UI patterns for map apps](https://ux.stackexchange.com/questions/17380/any-good-examples-of-interactive-ui-patterns-for-map-apps) — LOW confidence, community discussion on map UX patterns
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) — HIGH confidence, official W3C accessibility patterns
- [Material Design 3 - Chips Guidelines](https://m3.material.io/components/chips/guidelines) — MEDIUM confidence, filter chip design patterns for mobile

---
*Feature research for: Interactive location map with synchronized list view*
*Researched: 2026-02-03*
