import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadCSV, announce } from '../map.ts';

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
