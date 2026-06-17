/**
 * map - Map initialization and marker management
 *
 * Handles Leaflet map setup, CSV data loading, marker creation,
 * and event handling for marker interactions. Provides accessibility
 * features including keyboard navigation and screen reader support.
 */

import * as L from 'leaflet';
import Papa from 'papaparse';
import type GeoJSON from 'geojson';
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

/**
 * Loads a GeoJSON file from the given URL.
 * @param url - The URL path to the GeoJSON file
 * @returns Promise resolving to a GeoJSON FeatureCollection
 * @throws Error if the file fails to load or is invalid
 */
export const loadGeoJSON = async (url: string): Promise<GeoJSON.FeatureCollection> => {
  const response: Response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.statusText}`);
  }
  return response.json();
};

export interface MarkerMap {
  ids: (string | null)[];
  markers: Map<string, L.Marker>;
}

export const addMarkersFromCSV = (
  data: MarkerData[],
  layerGroup: L.LayerGroup,
  icon: L.Icon,
  layerName: string,
  stateManager: StateManager
): MarkerMap => {
  let markersAdded = 0;
  const markerIds: (string | null)[] = [];
  const markers: Map<string, L.Marker> = new Map();

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
      markers.set(markerId, marker);
      markerIds.push(markerId);

      marker.addTo(layerGroup);
      markersAdded++;
    } else {
      console.warn(`Invalid coordinates at row ${index + 1}:`, { lat, lng, row });
      markerIds.push(null);
    }
  });
  announce(`${markersAdded} ${layerName} locations loaded`);
  return { ids: markerIds, markers };
};

/**
 * Highlights a marker by adding the 'marker-selected' CSS class.
 * Clears all other marker highlights when a new marker is selected.
 * @param markerMap - Map of marker IDs to marker objects
 * @param markerId - The ID of the marker to highlight, or null to clear all highlights
 */
export const highlightMarker = (
  markerMap: Map<string, L.Marker>,
  markerId: string | null
): void => {
  requestAnimationFrame(() => {
    // Clear all marker highlights first
    markerMap.forEach((marker) => {
      const element = marker.getElement();
      if (element) {
        element.classList.remove('marker-selected');
      }
    });

    // Highlight the selected marker
    if (markerId !== null) {
      const marker = markerMap.get(markerId);
      if (marker) {
        const element = marker.getElement();
        if (element) {
          element.classList.add('marker-selected');
        }
      }
    }
  });
};

/**
 * Sets up click handlers on all markers to update selection state via StateManager.
 * @param markerMap - Map of marker IDs to marker objects
 * @param stateManager - The StateManager instance to notify of selection changes
 * @returns Cleanup function that removes all click handlers
 */
export const setupMarkerClickHandlers = (
  markerMap: Map<string, L.Marker>,
  stateManager: StateManager
): (() => void) => {
  const cleanupFunctions: Array<() => void> = [];

  markerMap.forEach((marker) => {
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
};

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
export const setupLayerEventListeners = (map: L.Map, stateManager: StateManager): (() => void) => {
  const cleanupFunctions: Array<() => void> = [];

  // Map layer control overlay names to card category badges
  const layerNameMapping: Record<string, string> = {
    'Community Fridge and Pantry Locations': 'Community Fridge',
    'Food Donation Sites': 'Food Donation',
    'Service Area': 'Service Area',
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
};

export interface InitializeMapResult {
  map: L.Map;
  fridgeData: MarkerData[];
  donationData: MarkerData[];
  fridgeMarkers: Map<string, L.Marker>;
  donationMarkers: Map<string, L.Marker>;
  fridgeMarkerIds: (string | null)[];
  donationMarkerIds: (string | null)[];
}

export const initializeMap = async (stateManager: StateManager): Promise<InitializeMapResult> => {
  const map: L.Map = L.map('map').setView([37.8, -96], 4); // Default center USA

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  const fridgeLayer: L.LayerGroup = L.layerGroup().addTo(map);
  const donationLayer: L.LayerGroup = L.layerGroup().addTo(map);

  try {
    const [fridgeData, donationData, serviceAreaGeoJSON] = await Promise.all([
      loadCSV(`${baseURL}data/fridgePins.csv`),
      loadCSV(`${baseURL}data/donationPins.csv`),
      loadGeoJSON(`${baseURL}data/serviceArea.json`).catch((error) => {
        console.warn('Service area boundary failed to load:', error);
        return null;
      }),
    ]);

    const fridgeMarkerMap = addMarkersFromCSV(
      fridgeData,
      fridgeLayer,
      fridgeIcon,
      'Community Fridge',
      stateManager
    );
    const donationMarkerMap = addMarkersFromCSV(
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

    const overlays: { [key: string]: L.Layer } = {
      'Community Fridge and Pantry Locations': fridgeLayer,
      'Food Donation Sites': donationLayer,
    };

    // Add service area boundary if available
    if (serviceAreaGeoJSON) {
      const serviceAreaLayer = L.geoJSON(serviceAreaGeoJSON, {
        style: {
          color: '#0060df',
          weight: 2,
          opacity: 0.8,
          dashArray: '5,5',
          fill: true,
          fillColor: '#0060df',
          fillOpacity: 0.05,
        },
      }).addTo(map);
      overlays['Service Area'] = serviceAreaLayer;
    }

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
        const overlayLabels = Object.keys(overlays);
        inputs.forEach((input, idx) => {
          const layerName = overlayLabels[idx];
          if (layerName) {
            input.setAttribute('aria-label', `Toggle ${layerName}`);
          }
        });
      }
    });

    announce(
      'Map loaded. Use Tab to navigate between markers, Enter to open details, arrow keys to pan, plus and minus to zoom.'
    );

    return {
      map,
      fridgeData,
      donationData,
      fridgeMarkers: fridgeMarkerMap.markers,
      donationMarkers: donationMarkerMap.markers,
      fridgeMarkerIds: fridgeMarkerMap.ids,
      donationMarkerIds: donationMarkerMap.ids,
    };
  } catch (error) {
    console.error('Error loading CSV files:', error);
    announce('Error loading map data. Please try again later.');
    throw error;
  }
};
