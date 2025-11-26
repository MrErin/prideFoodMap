import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadCSV, announce } from '../map.ts';

describe('loadCSV', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load and parse CSV data', async () => {
    const mockCSV =
      'latitude,longitude,locationName,description\n40.7128,-74.0060,New York,Big Apple';

    (global.fetch as any).mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(mockCSV) });

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
    (global.fetch as any).mockResolvedValueOnce({ ok: false, statusText: 'Not Found' });

    await expect(loadCSV('/data/missing.csv')).rejects.toThrow(
      'Failed to load /data/missing.csv: Not Found'
    );
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(loadCSV('/data/test.csv')).rejects.toThrow('Network error');
  });

  it('should parse CSV with multiple rows', async () => {
    const mockCSV = `latitude,longitude,locationName,description
    40.7128,-74.0060,New York,Big Apple
    34.0522,-118.2437,Los Angeles,City of Angels
    41.8781,-87.6298,Chicago,Windy City`;

    (global.fetch as any).mockResolvedValueOnce({ ok: true, text: () => mockCSV });

    const result = await loadCSV('/data/test.csv');

    expect(result).toHaveLength(3);
    expect(result[1].locationName).toBe('Los Angeles');
    expect(result[2].locationName).toBe('Chicago');
  });

  it('should handle empty CSV', async () => {
    const mockCSV = 'latitude,longitude,locationName,description\\n';

    (global.fetch as any).mockResolvedValueOnce({ ok: true, text: () => mockCSV });

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
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(announcerElement);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should set text content on announcements element', () => {
    announce('Test message');

    vi.advanceTimersByTime(100);

    expect(announcerElement.textContent).toBe('Test message');
  });

  it('should clear content before setting new text', () => {
    announcerElement.textContent = 'Old message';

    announce('New message');

    //before time has advanced
    expect(announcerElement.textContent).toBe('');

    vi.advanceTimersByTime(100);
    expect(announcerElement.textContent).toBe('New message');
  });

  it('should handle missing announcements element gracefully', () => {
    if (announcerElement.parentNode) {
      document.body.removeChild(announcerElement);
    }

    expect(() => announce('Test')).not.toThrow();
    vi.advanceTimersByTime(100);

    document.body.appendChild(announcerElement);
  });
});
