import * as L from 'leaflet';
import Papa from 'papaparse';

interface MarkerData {
    latitude: number;
    longitude: number;
    locationName: string;
    description?: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    icon: string
}

const fridgeIcon: L.Icon = L.icon({
    iconUrl: '/icons/fridge.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const donationIcon: L.Icon = L.icon({
    iconUrl: '/icons/donation.png',
    iconSize: [32, 28],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

async function loadCSV(url: string): Promise<MarkerData[]> {
    const response: Response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.statusText}`);
    }
    const text: string = await response.text();
    const result = Papa.parse<MarkerData>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
    });

    if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
    }

    return result.data;
}

function addMarkersFromCSV(data: MarkerData[], layerGroup: L.LayerGroup, icon: L.Icon): void {
    let markersAdded = 0;

    data.forEach((row: MarkerData, index: number) => {
        const lat: number = row.latitude;
        const lng: number = row.longitude;
        const name: string = row.locationName;
        const description: string = row.description || '';
        const address: string = `${row.street}, ${row.city}, ${row.state} ${row.zip}`

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            const marker: L.Marker = L.marker([lat, lng], { icon: icon });

            let popupContent: string = '';
            if (name) popupContent += `<strong>${name}</strong><br>`;
            if (description) popupContent += description;
            if (address) popupContent += `<br><small>${address}</small>`;
            if (popupContent) {
                marker.bindPopup(popupContent);
            }

            marker.addTo(layerGroup);
            markersAdded++;
        } else {
            console.warn(`Invalid coordinates at row ${index + 1}:`, { lat, lng, row });
        }
    });
}

export async function initializeMap(): Promise<void> {
    const map: L.Map = L.map('map').setView([37.8, -96], 4); // Default center USA

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    const fridgeLayer: L.LayerGroup = L.layerGroup().addTo(map);
    const donationLayer: L.LayerGroup = L.layerGroup().addTo(map);

    try {
        const [fridgeData, donationData] = await Promise.all([
            loadCSV('/data/fridgePins.csv'),
            loadCSV('/data/donationPins.csv')
        ]);

        addMarkersFromCSV(fridgeData, fridgeLayer, fridgeIcon);
        addMarkersFromCSV(donationData, donationLayer, donationIcon);

        const allMarkers: L.Layer[] = [...fridgeLayer.getLayers(), ...donationLayer.getLayers()];
        if (allMarkers.length > 0) {
            const group: L.FeatureGroup = L.featureGroup(allMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        } else {
            console.warn('No markers were added to the map');
        }

        const overlays: { [key: string]: L.LayerGroup } = {
            "Fridge Locations": fridgeLayer,
            "Donation Locations": donationLayer
        };

        L.control.layers(undefined, overlays, { collapsed: false }).addTo(map);
    } catch (error) {
        console.error('Error loading CSV files:', error);
        throw error;
    }
}