# Card List Architecture for Leaflet Map

## Module Structure

### Recommended: Separate Module (`cards.ts`)

Create `/home/erinmeaker/Documents/source/prideFoodMap/src/cards.ts` alongside `map.ts`.

**Rationale:**
- Single Responsibility: `map.ts` handles Leaflet logic, `cards.ts` handles DOM rendering
- `cards.ts` imports from `map.ts` (not vice versa) - cleaner dependency direction
- Easier to test card logic in isolation
- Future: Can add `filters.ts` without bloating either file

```
src/
├── main.ts      # Entry point, orchestrates initialization
├── map.ts       # Leaflet map, markers, layer controls
├── cards.ts     # Card list rendering, state management
└── types.ts     # Shared interfaces (optional, if grow)
```

## State Management (Vanilla TypeScript)

### Active Item Tracking Pattern

Use a **central state object** with **custom event emitter** for cross-component communication.

```typescript
// cards.ts
interface AppState {
  activeId: string | null;
  hoveredId: string | null;
  visibleLayer: 'fridge' | 'donation' | 'both';
}

class StateManager {
  private state: AppState;
  private listeners: Map<string, Set<(state: AppState) => void>> = new Map();

  constructor() {
    this.state = {
      activeId: null,
      hoveredId: null,
      visibleLayer: 'both'
    };
  }

  // Subscribe to state changes
  on(event: 'active' | 'hover' | 'filter', callback: (state: AppState) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // Update active item
  setActive(id: string | null) {
    this.state.activeId = id;
    this.notify('active');
  }

  // Update filter
  setFilter(layer: 'fridge' | 'donation' | 'both') {
    this.state.visibleLayer = layer;
    this.notify('filter');
  }

  private notify(event: string) {
    this.listeners.get(event)?.forEach(cb => cb(this.state));
  }

  get() { return this.state; }
}

export const stateManager = new StateManager();
```

**Usage:**
- `cards.ts` subscribes to state changes to update highlighting
- `map.ts` subscribes to state changes to open popups/highlight markers
- Both can trigger state changes (card click, marker click, layer toggle)

## Event Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   cards.ts  │         │StateManager │         │   map.ts    │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ Card click            │                       │
       ├──────────────────────>│ setActive(id)         │
       │                       ├──────────────────────>│ Marker popup open
       │                       │                       │ Marker highlight
       │                       │                       │
       │                       │    Marker click       │
       │                       │<──────────────────────┤
       │ setActive(id)         │                       │
       │<──────────────────────┤                       │
       │ Card highlight        │                       │
       │                       │                       │
       │                       │    Layer change       │
       │                       │<──────────────────────┤
       │ setFilter(layer)      │                       │
       │<──────────────────────┤                       │
       │ Filter cards          │                       │
       │                       │                       │
```

### Implementation Details

**Card → Marker (card click):**
```typescript
// cards.ts
cardElement.addEventListener('click', () => {
  stateManager.setActive(markerId);
});

// map.ts
stateManager.on('active', (state) => {
  if (state.activeId) {
    const marker = markerMap.get(state.activeId);
    marker?.openPopup();
    highlightMarker(marker);
  }
});
```

**Marker → Card (marker click):**
```typescript
// map.ts
marker.on('click', () => {
  stateManager.setActive(markerId);
});

// cards.ts
stateManager.on('active', (state) => {
  document.querySelectorAll('.card').forEach(card => {
    card.classList.toggle('active', card.dataset.id === state.activeId);
  });
});
```

**Layer Control → Cards (filter sync):**
```typescript
// map.ts
layerControl.on('change', (visibleLayers) => {
  stateManager.setFilter(determineVisibleLayer(visibleLayers));
});

// cards.ts
stateManager.on('filter', (state) => {
  document.querySelectorAll('.card').forEach(card => {
    const cardLayer = card.dataset.layer;
    card.hidden = !isLayerVisible(cardLayer, state.visibleLayer);
  });
});
```

## Component Boundaries

### `map.ts` Responsibilities
- Leaflet map initialization
- Marker creation from CSV data
- Layer control management
- Marker popup logic
- **Exports:**
  - `MarkerData` interface
  - Marker registry (for lookups)
  - Layer change events
- **Imports:** None (Leaflet imported, no internal deps)

### `cards.ts` Responsibilities
- Card HTML rendering from `MarkerData`
- Card list filtering based on layer visibility
- Card highlighting on state changes
- Card click event handling
- **Exports:**
  - `renderCards(data, containerId)` function
- **Imports:**
  - `MarkerData` from `map.ts`
  - `stateManager` from local state

### `main.ts` Responsibilities
- Initialization orchestration
- CSS imports
- Error handling
- **Flow:**
  1. Load CSV data via `map.ts`
  2. Initialize map with data
  3. Render cards with same data
  4. Subscribe all components to state manager

## Data Flow Summary

1. **Shared Data Source:** CSV data loaded once, passed to both map and cards
2. **Shared Identity:** Use `locationName + lat + lng` as unique ID for marker↔card mapping
3. **Bidirectional Sync:** State manager enables any component to trigger updates in others
4. **Layer Propagation:** Layer control changes trigger both marker visibility AND card filtering

## Key Implementation Considerations

- **Marker Registry:** Map markers need a `Map<string, L.Marker>` for O(1) lookups by ID
- **Debounce:** Hover state changes may need debouncing if performance issues arise
- **Accessibility:** Card focus should sync with marker focus, maintain `aria-activedescendant`
- **Mobile:** Consider bottom sheet or collapsible panel for card list on small screens
