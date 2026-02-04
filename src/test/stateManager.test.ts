/**
 * Unit tests for StateManager
 * Observer pattern state management for single-selection state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateManager } from '../stateManager';

describe('StateManager', () => {
  let manager: StateManager;

  beforeEach(() => {
    manager = new StateManager();
  });

  describe('initial state', () => {
    it('should have selectedId = null initially', () => {
      const state = manager.getState();
      expect(state.selectedId).toBeNull();
    });

    it('should return immutable state snapshot', () => {
      const state1 = manager.getState();
      const state2 = manager.getState();

      // Same values but different object references
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });

  describe('setSelected', () => {
    it('should update state and notify listeners when setting new ID', () => {
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.setSelected('marker-123');

      expect(manager.getState().selectedId).toBe('marker-123');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ selectedId: 'marker-123' }));
    });

    it('should deselect previous and notify with new ID', () => {
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.setSelected('marker-123');
      manager.setSelected('marker-456');

      expect(manager.getState().selectedId).toBe('marker-456');
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ selectedId: 'marker-123' })
      );
      expect(listener).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ selectedId: 'marker-456' })
      );
    });

    it('should be a no-op when setting same ID twice', () => {
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.setSelected('marker-123');
      manager.setSelected('marker-123');

      expect(manager.getState().selectedId).toBe('marker-123');
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearSelection', () => {
    it('should set selectedId to null and notify listeners', () => {
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.setSelected('marker-123');
      listener.mockClear(); // Reset after setSelected

      manager.clearSelection();

      expect(manager.getState().selectedId).toBeNull();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ selectedId: null }));
    });

    it('should be a no-op when already null', () => {
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.clearSelection();
      manager.clearSelection();

      expect(manager.getState().selectedId).toBeNull();
      expect(listener).toHaveBeenCalledTimes(0);
    });

    it('should notify listeners when clearing after selection', () => {
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.setSelected('marker-123');
      manager.clearSelection();

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ selectedId: 'marker-123' })
      );
      expect(listener).toHaveBeenNthCalledWith(2, expect.objectContaining({ selectedId: null }));
    });
  });

  describe('subscribe', () => {
    it('should return unsubscribe function that removes listener', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = manager.subscribe(listener1);
      manager.subscribe(listener2);

      manager.setSelected('marker-123');
      unsubscribe1();
      manager.setSelected('marker-456');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);
    });

    it('should allow multiple listeners to receive updates', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      manager.subscribe(listener1);
      manager.subscribe(listener2);
      manager.subscribe(listener3);

      manager.setSelected('marker-123');
      manager.clearSelection();

      expect(listener1).toHaveBeenCalledTimes(2);
      expect(listener2).toHaveBeenCalledTimes(2);
      expect(listener3).toHaveBeenCalledTimes(2);
    });

    it('should not notify unsubscribed listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = manager.subscribe(listener1);
      manager.subscribe(listener2);

      unsubscribe1();

      manager.setSelected('marker-123');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should allow resubscribing after unsubscribe', () => {
      const listener = vi.fn();

      const unsubscribe1 = manager.subscribe(listener);
      manager.setSelected('marker-123');
      unsubscribe1();

      const unsubscribe2 = manager.subscribe(listener);
      manager.setSelected('marker-456');
      unsubscribe2();

      expect(listener).toHaveBeenCalledTimes(2); // Once per subscription period
      expect(listener).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ selectedId: 'marker-123' })
      );
      expect(listener).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ selectedId: 'marker-456' })
      );
    });
  });

  describe('state immutability', () => {
    it('should not allow external mutation of state object', () => {
      const state = manager.getState();

      // Attempt to mutate returned state
      expect(() => {
        (state as any).selectedId = 'hacked';
      }).not.toThrow();

      // Verify internal state unchanged
      expect(manager.getState().selectedId).toBeNull();
    });

    it('should return new object on each getState call', () => {
      const state1 = manager.getState();
      const state2 = manager.getState();

      expect(state1).not.toBe(state2);
    });
  });
});
