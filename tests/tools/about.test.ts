import { describe, test, expect } from 'vitest';
import { handleAbout } from '../../src/tools/about.js';

describe('about tool', () => {
  test('returns server metadata', () => {
    const result = handleAbout();
    expect(result.name).toBe('Switzerland Pest Management MCP');
    expect(result.description).toContain('Pflanzenschutzmittelverzeichnis');
    expect(result.jurisdiction).toEqual(['CH']);
    expect(result.tools_count).toBe(10);
    expect(result.links).toHaveProperty('homepage');
    expect(result.links).toHaveProperty('repository');
    expect(result._meta).toHaveProperty('disclaimer');
  });

  test('lists data sources', () => {
    const result = handleAbout();
    expect(result.data_sources).toContain('BLW Pflanzenschutzmittelverzeichnis (psm.admin.ch)');
    expect(result.data_sources).toContain('Agroscope Pflanzenschutzempfehlungen');
    expect(result.data_sources.length).toBe(4);
  });

  test('includes version', () => {
    const result = handleAbout();
    expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
