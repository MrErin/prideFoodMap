import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as L from 'leaflet';
import { loadCSV, announce, addMarkersFromCSV, initializeMap, MarkerData } from '../map.ts';

// Type-safe Response mock helper
const createMockResponse = (text: string, ok = true): Partial<Response> => ({
  ok,
  status: ok ? 200 : 404,
  statusText: ok ? 'OK' : 'Not Found',
  text: () => Promise.resolve(text),
  headers: new Headers(),
  redirected: false,
  url: '',
  clone: () => ({} as Response),
  json: () => Promise.resolve({}),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  body: null,
  bodyUsed: false,
});

describe('loadCSV', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(
      async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
        return createMockResponse('', true) as Response;
      }
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should load and parse CSV data', async () => {
    const mockCSV =
      'latitude,longitude,locationName,description\n40.7128,-74.0060,New York,Big Apple';

    fetchSpy.mockResolvedValueOnce(createMockResponse(mockCSV, true) as Response);

    const result = await loadCSV('/data/test.csv');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      latitude: 40.7128,
      longitude: -74.006,
      locationName: 'New York',
      description: 'Big Apple',
    });
  });

  it('should throw an error when the fetch fails', async () => {
    fetchSpy.mockResolvedValueOnce(createMockResponse('', false) as Response);

    await expect(loadCSV('/data/missing.csv')).rejects.toThrow(
      'Failed to load /data/missing.csv: Not Found'
    );
  });

  it('should handle network errors', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    await expect(loadCSV('/data/test.csv')).rejects.toThrow('Network error');
  });

  it('should parse CSV with multiple rows', async () => {
    const mockCSV = `latitude,longitude,locationName,description
    40.7128,-74.0060,New York,Big Apple
    34.0522,-118.2437,Los Angeles,City of Angels
    41.8781,-87.6298,Chicago,Windy City`;

    fetchSpy.mockResolvedValueOnce(createMockResponse(mockCSV, true) as Response);

    const result = await loadCSV('/data/test.csv');

    expect(result).toHaveLength(3);
    expect(result[1].locationName).toBe('Los Angeles');
    expect(result[2].locationName).toBe('Chicago');
  });

  it('should handle empty CSV', async () => {
    const mockCSV = 'latitude,longitude,locationName,description\\n';

    fetchSpy.mockResolvedValueOnce(createMockResponse(mockCSV, true) as Response);

    const result = await loadCSV('/data/test.csv');

    expect(result).toHaveLength(0);
  });
});
describe('announce', () => {
  let announcerElement: HTMLElement;

  beforeEach(() => {
    announcerElement = document.createElement('div');
    announcerElement.setAttribute('id', 'announcements');
    document.body.appendChild(announcerElement);
  });

  afterEach(() => {
    document.body.removeChild(announcerElement);
  });

  it('should set text content on announcements element', async () => {
    announce('Test message');

    await vi.waitFor(() => {
      expect(announcerElement.textContent).toBe('Test message');
    });
  });

  it('should clear content before setting new text', async () => {
    announcerElement.textContent = 'Old message';

    announce('New message');

    // Before next frame
    expect(announcerElement.textContent).toBe('');

    await vi.waitFor(() => {
      expect(announcerElement.textContent).toBe('New message');
    });
  });

  it('should handle missing announcements element gracefully', () => {
    if (announcerElement.parentNode) {
      document.body.removeChild(announcerElement);
    }

    expect(() => announce('Test')).not.toThrow();

    document.body.appendChild(announcerElement);
  });
});

describe('addMarkersFromCSV', () => {
  let layerGroup: L.LayerGroup;
  let icon: L.Icon;

  beforeEach(() => {
    // Create real Leaflet instances - no mocking needed
    layerGroup = L.layerGroup();
    icon = L.icon({
      iconUrl: 'test.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  });

  it('should create markers from valid CSV data', () => {
    const data: MarkerData[] = [
      {
        latitude: 40.7128,
        longitude: -74.006,
        locationName: 'Test Location',
        description: 'Test Description',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    expect(layerGroup.getLayers()).toHaveLength(1);
    const marker = layerGroup.getLayers()[0] as L.Marker;
    expect(marker.getLatLng()).toEqual({ lat: 40.7128, lng: -74.006 });
  });

  it('should create markers with popup content', () => {
    const data: MarkerData[] = [
      {
        latitude: 40.7128,
        longitude: -74.006,
        locationName: 'Test Location',
        description: 'Test Description',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    const marker = layerGroup.getLayers()[0] as L.Marker;
    const popup = marker.getPopup();
    expect(popup).toBeTruthy();
    expect(popup?.getContent()).toContain('Test Location');
    expect(popup?.getContent()).toContain('123 Main St');
  });

  it('should skip invalid coordinates (NaN)', () => {
    const data: MarkerData[] = [
      {
        latitude: NaN,
        longitude: -74.006,
        locationName: 'Invalid Location',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    expect(layerGroup.getLayers()).toHaveLength(0);
  });

  it('should skip zero coordinates', () => {
    const data: MarkerData[] = [
      {
        latitude: 0,
        longitude: 0,
        locationName: 'Zero Coordinates',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    expect(layerGroup.getLayers()).toHaveLength(0);
  });

  it('should handle multiple valid markers', () => {
    const data: MarkerData[] = [
      {
        latitude: 40.7128,
        longitude: -74.006,
        locationName: 'New York',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
      {
        latitude: 34.0522,
        longitude: -118.2437,
        locationName: 'Los Angeles',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
      {
        latitude: 41.8781,
        longitude: -87.6298,
        locationName: 'Chicago',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    expect(layerGroup.getLayers()).toHaveLength(3);
  });

  it('should handle markers with missing optional description', () => {
    const data: MarkerData[] = [
      {
        latitude: 40.7128,
        longitude: -74.006,
        locationName: 'Test Location',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    const marker = layerGroup.getLayers()[0] as L.Marker;
    expect(marker.getPopup()).toBeTruthy();
  });

  it('should add ARIA attributes to marker elements', () => {
    const data: MarkerData[] = [
      {
        latitude: 40.7128,
        longitude: -74.006,
        locationName: 'Test Location',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    const marker = layerGroup.getLayers()[0] as L.Marker;

    // Verify the marker has the 'add' event listener registered
    // The event listener adds ARIA attributes when the marker is added to DOM
    expect(marker.listens('add')).toBe(true);

    // Verify the marker has popupopen event listener for announcements
    expect(marker.listens('popupopen')).toBe(true);
  });

  it('should filter out mix of valid and invalid coordinates', () => {
    const data: MarkerData[] = [
      {
        latitude: 40.7128,
        longitude: -74.006,
        locationName: 'Valid',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
      {
        latitude: NaN,
        longitude: -74.006,
        locationName: 'Invalid',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
      {
        latitude: 34.0522,
        longitude: -118.2437,
        locationName: 'Also Valid',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
    ];

    addMarkersFromCSV(data, layerGroup, icon, 'Test Layer');

    expect(layerGroup.getLayers()).toHaveLength(2);
  });
});

describe('initializeMap', () => {
  let mapContainer: HTMLElement;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create map container
    mapContainer = document.createElement('div');
    mapContainer.setAttribute('id', 'map');
    document.body.appendChild(mapContainer);

    // Mock fetch to avoid network requests
    const createMockResponse = (text: string): Partial<Response> => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(text),
      headers: new Headers(),
      redirected: false,
      url: '',
      clone: () => ({} as Response),
      json: () => Promise.resolve({}),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      body: null,
      bodyUsed: false,
    });

    const mockFridgeCSV = `latitude,longitude,locationName,description,street,city,state,zip
35.0456,-85.2672,Chattanooga Fridge,Community fridge,123 Main St,Chattanooga,TN,37402`;

    const mockDonationCSV = `latitude,longitude,locationName,description,street,city,state,zip
35.0556,-85.2572,Donation Site,Food donation,456 Oak Ave,Chattanooga,TN,37403`;

    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('fridgePins.csv')) {
          return createMockResponse(mockFridgeCSV) as Response;
        }
        if (url.includes('donationPins.csv')) {
          return createMockResponse(mockDonationCSV) as Response;
        }
        return createMockResponse('') as Response;
      }
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.restoreAllMocks();
    if (mapContainer.parentNode) {
      document.body.removeChild(mapContainer);
    }
  });

  it('should initialize map with tile layer', async () => {
    await expect(initializeMap()).resolves.not.toThrow();

    const mapContainer = document.getElementById('map');
    expect(mapContainer?.querySelector('.leaflet-map-pane')).toBeTruthy();
  });

  it('should create layer groups for fridges and donations', async () => {
    await initializeMap();

    const mapContainer = document.getElementById('map');
    const leafletContainer = mapContainer?.querySelector('.leaflet-map-pane');
    expect(leafletContainer).toBeTruthy();
  });

  it('should fit map bounds to markers', async () => {
    await initializeMap();

    const mapContainer = document.getElementById('map');
    expect(mapContainer?.querySelector('.leaflet-marker-icon')).toBeTruthy();
  });

  it('should add layer control to map', async () => {
    await initializeMap();

    const controlElement = document.querySelector('.leaflet-control-layers');
    expect(controlElement).toBeTruthy();
  });

  it('should add ARIA attributes to layer control', async () => {
    await initializeMap();

    await vi.waitFor(
      () => {
        const controlElement = document.querySelector('.leaflet-control-layers');
        expect(controlElement?.getAttribute('role')).toBe('group');
        expect(controlElement?.getAttribute('aria-label')).toBe('Map Layer Controls');
      },
      { timeout: 1000 }
    );
  });

  it('should handle CSV loading errors gracefully', async () => {
    fetchSpy.mockRestore();
    fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    await expect(initializeMap()).rejects.toThrow();
  });

  it('should handle empty CSV data', async () => {
    fetchSpy.mockRestore();
    const createEmptyResponse = (): Partial<Response> => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('latitude,longitude,locationName\n'),
      headers: new Headers(),
      redirected: false,
      url: '',
      clone: () => ({} as Response),
      json: () => Promise.resolve({}),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      body: null,
      bodyUsed: false,
    });

    fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(createEmptyResponse() as Response)
      .mockResolvedValueOnce(createEmptyResponse() as Response);

    await expect(initializeMap()).resolves.not.toThrow();
  });
});
