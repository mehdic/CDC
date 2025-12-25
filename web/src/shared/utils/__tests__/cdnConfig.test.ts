/**
 * CDN Configuration Tests
 *
 * Tests for CDN URL generation, cache headers, and asset optimization utilities.
 *
 * @module cdnConfig.test
 */

import {
  getCDNUrl,
  getOptimizedImageUrl,
  generateSrcSet,
  generateSizes,
  getCacheControlHeader,
  isWebPSupported,
  CACHE_CONTROL_PRESETS,
  ASSET_CACHE_MAPPING,
  cdnConfig,
} from '../cdnConfig';

// Mock import.meta.env
const mockEnv = {
  DEV: true,
  MODE: 'development',
  VITE_CDN_URL: '',
  VITE_IMAGE_CDN_URL: '',
  VITE_CDN_PROVIDER: 'local',
  VITE_USE_WEBP: 'true',
  VITE_CACHE_TTL: '86400',
  VITE_IMAGE_QUALITY: '85',
};

// Mock the import.meta.env
jest.mock('../cdnConfig', () => {
  const originalModule = jest.requireActual('../cdnConfig');
  return {
    ...originalModule,
    cdnConfig: {
      provider: 'local',
      baseUrl: '',
      imageBaseUrl: '',
      useWebP: true,
      defaultCacheTTL: 0,
      imageQuality: 85,
    },
  };
});

describe('CDN Configuration', () => {
  describe('cdnConfig object', () => {
    test('should have correct structure in development', () => {
      expect(cdnConfig).toHaveProperty('provider');
      expect(cdnConfig).toHaveProperty('baseUrl');
      expect(cdnConfig).toHaveProperty('imageBaseUrl');
      expect(cdnConfig).toHaveProperty('useWebP');
      expect(cdnConfig).toHaveProperty('defaultCacheTTL');
      expect(cdnConfig).toHaveProperty('imageQuality');
    });

    test('should use local provider in development', () => {
      expect(cdnConfig.provider).toBe('local');
    });
  });

  describe('getCDNUrl', () => {
    test('should return original path when no CDN configured', () => {
      const result = getCDNUrl('/assets/image.png');
      expect(result).toBe('/assets/image.png');
    });

    test('should return original path when forceLocal is true', () => {
      const result = getCDNUrl('/assets/image.png', { forceLocal: true });
      expect(result).toBe('/assets/image.png');
    });

    test('should handle paths with leading slash', () => {
      const result = getCDNUrl('/assets/image.png');
      expect(result).toBe('/assets/image.png');
    });

    test('should handle paths without leading slash', () => {
      const result = getCDNUrl('assets/image.png');
      expect(result).toBe('assets/image.png');
    });

    test('should add version query param when provided', () => {
      const result = getCDNUrl('/assets/image.png', { version: '1.0.0' });
      // In local mode, version is not added because no CDN base URL
      expect(result).toBe('/assets/image.png');
    });
  });

  describe('getOptimizedImageUrl', () => {
    test('should return original path when no image CDN configured', () => {
      const result = getOptimizedImageUrl('/images/photo.jpg');
      expect(result).toBe('/images/photo.jpg');
    });

    test('should return original path for local development', () => {
      const result = getOptimizedImageUrl('/images/photo.jpg', {
        width: 800,
        height: 600,
        quality: 90,
      });
      expect(result).toBe('/images/photo.jpg');
    });
  });

  describe('generateSrcSet', () => {
    test('should generate srcset with default widths', () => {
      const result = generateSrcSet('/images/photo.jpg');
      expect(result).toContain('320w');
      expect(result).toContain('640w');
      expect(result).toContain('960w');
      expect(result).toContain('1280w');
      expect(result).toContain('1920w');
    });

    test('should generate srcset with custom widths', () => {
      const result = generateSrcSet('/images/photo.jpg', [400, 800, 1200]);
      expect(result).toContain('400w');
      expect(result).toContain('800w');
      expect(result).toContain('1200w');
      expect(result).not.toContain('320w');
    });

    test('should return comma-separated values', () => {
      const result = generateSrcSet('/images/photo.jpg', [400, 800]);
      expect(result).toContain(', ');
    });
  });

  describe('generateSizes', () => {
    test('should generate default sizes attribute', () => {
      const result = generateSizes();
      expect(result).toContain('100vw');
      expect(result).toContain('50vw');
      expect(result).toContain('33vw');
    });

    test('should generate custom sizes attribute', () => {
      const result = generateSizes({
        '(max-width: 480px)': '100vw',
        '(max-width: 768px)': '75vw',
        default: '50vw',
      });
      expect(result).toContain('480px');
      expect(result).toContain('768px');
      expect(result).toContain('50vw');
    });

    test('should place default size at end', () => {
      const result = generateSizes({
        '(max-width: 480px)': '100vw',
        default: '50vw',
      });
      expect(result.endsWith('50vw')).toBe(true);
    });
  });

  describe('getCacheControlHeader', () => {
    test('should return immutable cache for JS files', () => {
      const result = getCacheControlHeader('/js/app.js');
      expect(result).toBe(CACHE_CONTROL_PRESETS.immutable);
      expect(result).toContain('max-age=31536000');
      expect(result).toContain('immutable');
    });

    test('should return immutable cache for CSS files', () => {
      const result = getCacheControlHeader('/css/styles.css');
      expect(result).toBe(CACHE_CONTROL_PRESETS.immutable);
    });

    test('should return static cache for images', () => {
      const result = getCacheControlHeader('/images/photo.png');
      expect(result).toBe(CACHE_CONTROL_PRESETS.static);
      expect(result).toContain('max-age=604800');
    });

    test('should return immutable cache for fonts', () => {
      const result = getCacheControlHeader('/fonts/roboto.woff2');
      expect(result).toBe(CACHE_CONTROL_PRESETS.immutable);
    });

    test('should return dynamic cache for JSON files', () => {
      const result = getCacheControlHeader('/data/config.json');
      expect(result).toBe(CACHE_CONTROL_PRESETS.dynamic);
      expect(result).toContain('stale-while-revalidate');
    });

    test('should return dynamic cache for unknown extensions', () => {
      const result = getCacheControlHeader('/files/unknown.xyz');
      expect(result).toBe(CACHE_CONTROL_PRESETS.dynamic);
    });

    test('should handle uppercase extensions', () => {
      const result = getCacheControlHeader('/images/photo.PNG');
      expect(result).toBe(CACHE_CONTROL_PRESETS.static);
    });
  });

  describe('CACHE_CONTROL_PRESETS', () => {
    test('immutable preset should have correct headers', () => {
      expect(CACHE_CONTROL_PRESETS.immutable).toContain('public');
      expect(CACHE_CONTROL_PRESETS.immutable).toContain('max-age=31536000');
      expect(CACHE_CONTROL_PRESETS.immutable).toContain('immutable');
    });

    test('static preset should have 1 week cache', () => {
      expect(CACHE_CONTROL_PRESETS.static).toContain('public');
      expect(CACHE_CONTROL_PRESETS.static).toContain('max-age=604800');
    });

    test('dynamic preset should have revalidation', () => {
      expect(CACHE_CONTROL_PRESETS.dynamic).toContain('stale-while-revalidate');
    });

    test('private preset should prevent caching', () => {
      expect(CACHE_CONTROL_PRESETS.private).toContain('private');
      expect(CACHE_CONTROL_PRESETS.private).toContain('no-cache');
      expect(CACHE_CONTROL_PRESETS.private).toContain('no-store');
    });

    test('api preset should have short cache', () => {
      expect(CACHE_CONTROL_PRESETS.api).toContain('max-age=60');
    });
  });

  describe('ASSET_CACHE_MAPPING', () => {
    test('should map common extensions to cache presets', () => {
      expect(ASSET_CACHE_MAPPING['.js']).toBe(CACHE_CONTROL_PRESETS.immutable);
      expect(ASSET_CACHE_MAPPING['.css']).toBe(CACHE_CONTROL_PRESETS.immutable);
      expect(ASSET_CACHE_MAPPING['.woff2']).toBe(CACHE_CONTROL_PRESETS.immutable);
      expect(ASSET_CACHE_MAPPING['.png']).toBe(CACHE_CONTROL_PRESETS.static);
      expect(ASSET_CACHE_MAPPING['.jpg']).toBe(CACHE_CONTROL_PRESETS.static);
      expect(ASSET_CACHE_MAPPING['.webp']).toBe(CACHE_CONTROL_PRESETS.static);
    });
  });

  describe('isWebPSupported', () => {
    // Note: This test may vary based on the test environment
    test('should return a boolean', () => {
      const result = isWebPSupported();
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('CDN Configuration - Production Simulation', () => {
  // These tests verify the logic for production scenarios
  // They use the actual functions but the CDN config remains 'local'

  test('getCDNUrl should handle edge cases', () => {
    // Empty path
    expect(getCDNUrl('')).toBe('');

    // Path with query string
    expect(getCDNUrl('/image.png?v=1')).toBe('/image.png?v=1');

    // Path with hash
    expect(getCDNUrl('/image.png#section')).toBe('/image.png#section');
  });

  test('generateSrcSet should handle edge cases', () => {
    // Empty widths array
    const result = generateSrcSet('/image.jpg', []);
    expect(result).toBe('');

    // Single width
    const singleResult = generateSrcSet('/image.jpg', [800]);
    expect(singleResult).toContain('800w');
  });

  test('generateSizes should handle empty breakpoints', () => {
    const result = generateSizes({});
    expect(result).toBe('100vw'); // Default fallback
  });
});
