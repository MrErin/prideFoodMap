import * as L from 'leaflet';
import Papa from 'papaparse';
import type { StateManager } from './stateManager.js';

export interface MarkerData {
  locationName: string;
  description?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
}

const baseURL = import.meta.env.BASE_URL;

// Module-level map for marker-card linking using L.Util.stamp() IDs
const markerCardMap: Map<string, L.Marker> = new Map();

const fridgeIcon: L.Icon = L.icon({
  iconUrl: `${baseURL}icons/fridge.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const donationIcon: L.Icon = L.icon({
  iconUrl: `${baseURL}icons/donation.png`,
  iconSize: [32, 28],
  iconAnchor: [12, 41],
});

export const loadCSV = async (url: string): Promise<MarkerData[]> => {
  const response: Response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.statusText}`);
  }
  const text: string = await response.text();
  const result = Papa.parse<MarkerData>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  return result.data;
};

export const announce = (message: string): void => {
  const announcer = document.getElementById('announcements');
  if (announcer) {
    announcer.textContent = '';
    requestAnimationFrame(() => {
      announcer.textContent = message;
    });
  }
};

export const addMarkersFromCSV = (
  data: MarkerData[],
  layerGroup: L.LayerGroup,
  icon: L.Icon,
  layerName: string,
  stateManager: StateManager
): string[] => {
  let markersAdded = 0;
  const markerIds: string[] = [];

  data.forEach((row: MarkerData, index: number) => {
    const lat: number = row.latitude;
    const lng: number = row.longitude;
    const name: string = row.locationName;

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const marker: L.Marker = L.marker([lat, lng], {
        icon: icon,
        alt: `${name} ${layerName} location marker`,
      });

      marker.on('add', () => {
        const element = marker.getElement();
        if (element) {
          element.setAttribute('role', 'button');
          element.setAttribute('aria-label', `${name} - Click for details`);
          element.setAttribute('tabindex', '0');

          element.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const markerId = L.Util.stamp(marker).toString();
              stateManager.setSelected(markerId);
            }
          });
        }
      });

      // Generate unique marker ID using L.Util.stamp() and store for linking
      const markerId = L.Util.stamp(marker).toString();
      markerCardMap.set(markerId, marker);
      markerIds.push(markerId);

      marker.addTo(layerGroup);
      markersAdded++;
    } else {
      console.warn(`Invalid coordinates at row ${index + 1}:`, { lat, lng, row });
    }
  });
  announce(`${markersAdded} ${layerName} locations loaded`);
  return markerIds;
};

/**
 * Highlights a marker by adding the 'marker-selected' CSS class.
 * Clears all other marker highlights when a new marker is selected.
 * @param markerId - The ID of the marker to highlight, or null to clear all highlights
 */
export function highlightMarker(markerId: string | null): void {
  requestAnimationFrame(() => {
    // Clear all marker highlights first
    markerCardMap.forEach((marker) => {
      const element = marker.getElement();
      if (element) {
        element.classList.remove('marker-selected');
      }
    });

    // Highlight the selected marker
    if (markerId !== null) {
      const marker = markerCardMap.get(markerId);
      if (marker) {
        const element = marker.getElement();
        if (element) {
          element.classList.add('marker-selected');
        }
      }
    }
  });
}

/**
 * Sets up click handlers on all markers to update selection state via StateManager.
 * @param stateManager - The StateManager instance to notify of selection changes
 * @returns Cleanup function that removes all click handlers
 */
export function setupMarkerClickHandlers(stateManager: StateManager): () => void {
  const cleanupFunctions: Array<() => void> = [];

  markerCardMap.forEach((marker) => {
    const markerId = L.Util.stamp(marker).toString();

    const clickHandler = () => {
      stateManager.setSelected(markerId);
    };

    marker.on('click', clickHandler);

    // Store cleanup function for this marker
    cleanupFunctions.push(() => {
      marker.off('click', clickHandler);
    });
  });

  // Return cleanup function that removes all handlers
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
}

/**
 * Sets up Leaflet overlay add/remove event listeners for layer visibility tracking.
 *
 * Listens for Leaflet's overlayadd and overlayremove events from the layer control,
 * maps the layer names to card categories, and updates the StateManager accordingly.
 * Returns a cleanup function to properly remove event listeners on teardown.
 *
 * @param map - The Leaflet map instance
 * @param stateManager - The StateManager instance to notify of layer changes
 * @returns Cleanup function that removes all event listeners
 */
export function setupLayerEventListeners(map: L.Map, stateManager: StateManager): () => void {
  const cleanupFunctions: Array<() => void> = [];

  // Map layer control overlay names to card category badges
  const layerNameMapping: Record<string, string> = {
    'Community Fridge and Pantry Locations': 'Community Fridge',
    'Food Donation Sites': 'Food Donation',
  };

  const overlayAddHandler = (e: L.LayersControlEvent) => {
    const category = layerNameMapping[e.name];
    if (category) {
      stateManager.toggleLayer(category, true);
    }
  };

  const overlayRemoveHandler = (e: L.LayersControlEvent) => {
    const category = layerNameMapping[e.name];
    if (category) {
      stateManager.toggleLayer(category, false);
    }
  };

  map.on('overlayadd', overlayAddHandler);
  map.on('overlayremove', overlayRemoveHandler);

  // Store cleanup functions for both listeners
  cleanupFunctions.push(() => map.off('overlayadd', overlayAddHandler));
  cleanupFunctions.push(() => map.off('overlayremove', overlayRemoveHandler));

  // Return combined cleanup function
  return () => cleanupFunctions.forEach((fn) => fn());
}

export interface InitializeMapResult {
  map: L.Map;
  fridgeData: MarkerData[];
  donationData: MarkerData[];
  fridgeMarkerIds: string[];
  donationMarkerIds: string[];
}

export const initializeMap = async (
  stateManager: StateManager
): Promise<InitializeMapResult> => {
  const map: L.Map = L.map('map').setView([37.8, -96], 4); // Default center USA

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  const fridgeLayer: L.LayerGroup = L.layerGroup().addTo(map);
  const donationLayer: L.LayerGroup = L.layerGroup().addTo(map);

  try {
    const [fridgeData, donationData] = await Promise.all([
      loadCSV(`${baseURL}data/fridgePins.csv`),
      loadCSV(`${baseURL}data/donationPins.csv`),
    ]);

    const fridgeMarkerIds = addMarkersFromCSV(
      fridgeData,
      fridgeLayer,
      fridgeIcon,
      'Community Fridge',
      stateManager
    );
    const donationMarkerIds = addMarkersFromCSV(
      donationData,
      donationLayer,
      donationIcon,
      'Food Donation',
      stateManager
    );

    const allMarkers: L.Layer[] = [...fridgeLayer.getLayers(), ...donationLayer.getLayers()];
    if (allMarkers.length > 0) {
      const group: L.FeatureGroup = L.featureGroup(allMarkers);
      map.fitBounds(group.getBounds().pad(0.1));
    } else {
      console.warn('No markers were added to the map');
    }

    const overlays: { [key: string]: L.LayerGroup } = {
      'Community Fridge and Pantry Locations': fridgeLayer,
      'Food Donation Sites': donationLayer,
    };

    // Add control first, then enhance with ARIA attributes
    L.control.layers(undefined, overlays, { collapsed: false }).addTo(map);

    // Map is already ready since we've added tiles and layers
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const controlElement = document.querySelector('.leaflet-control-layers');
      if (controlElement) {
        controlElement.setAttribute('role', 'group');
        controlElement.setAttribute('aria-label', 'Map Layer Controls');

        const inputs = controlElement.querySelectorAll('input[type="checkbox"]');
        inputs.forEach((input, idx) => {
          input.setAttribute(
            'aria-label',
            idx === 0 ? 'Show Community Fridge and Pantry Locations' : 'Show Food Donation Sites'
          );
        });
      }
    });

    announce(
      'Map loaded. Use Tab to navigate between markers, Enter to open details, arrow keys to pan, plus and minus to zoom.'
    );

    return { map, fridgeData, donationData, fridgeMarkerIds, donationMarkerIds };
  } catch (error) {
    console.error('Error loading CSV files:', error);
    announce('Error loading map data. Please try again later.');
    throw error;
  }
};
