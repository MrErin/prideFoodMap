/**
 * StateManager - Observer pattern state management for single-selection state
 *
 * Provides a single source of truth for selection state between map markers
 * and DOM cards. Decouples marker and card logic through subscribe/notify pattern.
 */

/**
 * Selection state shape
 */
export interface SelectionState {
  selectedId: string | null;
}

/**
 * Filter state extending SelectionState with search query
 *
 * Extends the base SelectionState to include search functionality.
 * Used for filtering markers and cards based on user search input.
 */
export interface FilterState extends SelectionState {
  searchQuery: string;
  visibleLayers: Set<string>;
}

/**
 * Listener type for state changes
 */
export type StateListener = (state: FilterState) => void;

/**
 * StateManager manages single-selection state with Observer pattern
 *
 * @example
 * ```typescript
 * const manager = new StateManager();
 * const unsubscribe = manager.subscribe((state) => {
 *   console.log('Selected:', state.selectedId);
 * });
 * manager.setSelected('marker-123');
 * unsubscribe();
 * ```
 */
export class StateManager {
  private state: FilterState = {
    selectedId: null,
    searchQuery: '',
    visibleLayers: new Set(['Community Fridge', 'Food Donation'])
  };
  private listeners: StateListener[] = [];

  /**
   * Get current state as immutable snapshot
   * @returns Copy of current state
   */
  getState(): FilterState {
    // Return new object to prevent external mutation
    return { ...this.state };
  }

  /**
   * Set the selected item ID
   * Notifies listeners only if ID actually changes
   * @param id - The ID to select
   */
  setSelected(id: string): void {
    if (this.state.selectedId !== id) {
      this.state.selectedId = id;
      this.notify();
    }
  }

  /**
   * Clear the current selection
   * Notifies listeners only if something was selected
   */
  clearSelection(): void {
    if (this.state.selectedId !== null) {
      this.state.selectedId = null;
      this.notify();
    }
  }

  /**
   * Sets the search query and notifies listeners if value changed.
   *
   * Follows the same change-detection pattern as setSelected -
   * only triggers notification when the searchQuery value actually changes.
   *
   * @param query - The new search query string
   */
  setSearchQuery(query: string): void {
    if (this.state.searchQuery !== query) {
      this.state.searchQuery = query;
      this.notify();
    }
  }

  /**
   * Toggles a layer's visibility and notifies listeners if changed.
   *
   * Uses immutable pattern - creates new Set before mutating to prevent
   * external reference issues. Only notifies when the Set actually changes.
   *
   * @param layerName - The layer name to toggle
   * @param isVisible - Whether the layer should be visible
   */
  toggleLayer(layerName: string, isVisible: boolean): void {
    const layers = new Set(this.state.visibleLayers);
    if (isVisible) {
      layers.add(layerName);
    } else {
      layers.delete(layerName);
    }
    // Only notify if Set actually changed
    if (layers.size !== this.state.visibleLayers.size ||
        ![...layers].every(l => this.state.visibleLayers.has(l))) {
      this.state.visibleLayers = layers;
      this.notify();
    }
  }

  /**
   * Subscribe to state changes
   * @param listener - Callback function to receive state updates
   * @returns Unsubscribe function
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    const stateSnapshot = this.getState();
    this.listeners.forEach((listener) => {
      listener(stateSnapshot);
    });
  }
}
