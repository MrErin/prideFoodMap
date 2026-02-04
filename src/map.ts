import * as L from 'leaflet';
import Papa from 'papaparse';

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
  popupAnchor: [1, -34],
});

const donationIcon: L.Icon = L.icon({
  iconUrl: `${baseURL}icons/donation.png`,
  iconSize: [32, 28],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
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
  layerName: string
): void => {
  let markersAdded = 0;

  data.forEach((row: MarkerData, index: number) => {
    const lat: number = row.latitude;
    const lng: number = row.longitude;
    const name: string = row.locationName;
    const description: string = row.description || '';
    const address: string = `${row.street || ''}, ${row.city || ''}, ${row.state || ''} ${row.zip || ''}`;

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const marker: L.Marker = L.marker([lat, lng], {
        icon: icon,
        alt: `${name} ${layerName} location marker`,
      });

      let popupContent: string = '';
      if (name) popupContent += `<strong>${name}</strong>`;
      if (description) popupContent += `<br>${description}`;
      if (address) popupContent += `<br><small>${address}</small>`;
      if (popupContent) {
        marker.bindPopup(popupContent);
      }

      marker.on('add', () => {
        const element = marker.getElement();
        if (element) {
          element.setAttribute('role', 'button');
          element.setAttribute('aria-label', `${name} - Click for details`);
          element.setAttribute('tabindex', '0');

          element.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              marker.openPopup();
            }
          });
        }
      });
      marker.on('popupopen', () => {
        announce(`Showing details for ${name}`);
      });
      marker.addTo(layerGroup);
      markersAdded++;
    } else {
      console.warn(`Invalid coordinates at row ${index + 1}:`, { lat, lng, row });
    }
  });
  announce(`${markersAdded} ${layerName} locations loaded`);
};

export interface InitializeMapResult {
  fridgeData: MarkerData[];
  donationData: MarkerData[];
}

export const initializeMap = async (): Promise<InitializeMapResult> => {
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

    addMarkersFromCSV(fridgeData, fridgeLayer, fridgeIcon, 'Community Fridge');
    addMarkersFromCSV(donationData, donationLayer, donationIcon, 'Food Donation');

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

    return { fridgeData, donationData };
  } catch (error) {
    console.error('Error loading CSV files:', error);
    announce('Error loading map data. Please try again later.');
    throw error;
  }
};
