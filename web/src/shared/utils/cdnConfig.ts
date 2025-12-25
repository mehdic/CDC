/**
 * CDN Configuration and Asset Optimization
 *
 * This module provides CDN URL management and asset optimization utilities
 * for the MetaPharm Connect platform.
 *
 * Features:
 * - Environment-based CDN URL configuration
 * - Asset URL generation with cache busting
 * - Image format detection and WebP support
 * - Preload link generation for critical assets
 *
 * @module cdnConfig
 */

/**
 * CDN Provider configurations
 */
export type CDNProvider = 'cloudflare' | 'cloudfront' | 'akamai' | 'fastly' | 'local';

/**
 * CDN configuration interface
 */
export interface CDNConfig {
  /** CDN provider identifier */
  provider: CDNProvider;
  /** Base URL for static assets */
  baseUrl: string;
  /** Base URL for images (may have different CDN) */
  imageBaseUrl: string;
  /** Whether to use WebP images when supported */
  useWebP: boolean;
  /** Default cache TTL in seconds */
  defaultCacheTTL: number;
  /** Image quality for compression (1-100) */
  imageQuality: number;
}

/**
 * Cache control presets for different asset types
 */
export const CACHE_CONTROL_PRESETS = {
  /** Immutable assets with content hash - cache for 1 year */
  immutable: 'public, max-age=31536000, immutable',
  /** Static assets that rarely change - cache for 1 week */
  static: 'public, max-age=604800',
  /** Dynamic content - cache for 1 hour with revalidation */
  dynamic: 'public, max-age=3600, stale-while-revalidate=86400',
  /** User-specific content - no caching */
  private: 'private, no-cache, no-store, must-revalidate',
  /** API responses - short cache */
  api: 'public, max-age=60, stale-while-revalidate=300',
} as const;

/**
 * Asset type to cache control mapping
 */
export const ASSET_CACHE_MAPPING: Record<string, string> = {
  '.js': CACHE_CONTROL_PRESETS.immutable,
  '.css': CACHE_CONTROL_PRESETS.immutable,
  '.woff': CACHE_CONTROL_PRESETS.immutable,
  '.woff2': CACHE_CONTROL_PRESETS.immutable,
  '.ttf': CACHE_CONTROL_PRESETS.immutable,
  '.eot': CACHE_CONTROL_PRESETS.immutable,
  '.png': CACHE_CONTROL_PRESETS.static,
  '.jpg': CACHE_CONTROL_PRESETS.static,
  '.jpeg': CACHE_CONTROL_PRESETS.static,
  '.webp': CACHE_CONTROL_PRESETS.static,
  '.avif': CACHE_CONTROL_PRESETS.static,
  '.svg': CACHE_CONTROL_PRESETS.static,
  '.gif': CACHE_CONTROL_PRESETS.static,
  '.ico': CACHE_CONTROL_PRESETS.static,
  '.json': CACHE_CONTROL_PRESETS.dynamic,
  '.html': CACHE_CONTROL_PRESETS.dynamic,
};

/**
 * Get CDN configuration based on environment
 */
function getCDNConfig(): CDNConfig {
  const env = import.meta.env;

  // Development environment - use local assets
  if (env.DEV || env.MODE === 'development') {
    return {
      provider: 'local',
      baseUrl: '',
      imageBaseUrl: '',
      useWebP: true,
      defaultCacheTTL: 0,
      imageQuality: 85,
    };
  }

  // Production/Staging - use CDN
  const cdnUrl = env.VITE_CDN_URL || '';
  const imageCdnUrl = env.VITE_IMAGE_CDN_URL || cdnUrl;
  const provider = (env.VITE_CDN_PROVIDER as CDNProvider) || 'cloudflare';

  return {
    provider,
    baseUrl: cdnUrl,
    imageBaseUrl: imageCdnUrl,
    useWebP: env.VITE_USE_WEBP !== 'false',
    defaultCacheTTL: parseInt(env.VITE_CACHE_TTL || '86400', 10),
    imageQuality: parseInt(env.VITE_IMAGE_QUALITY || '85', 10),
  };
}

/**
 * Singleton CDN configuration instance
 */
export const cdnConfig = getCDNConfig();

/**
 * Check if WebP is supported in the current browser
 */
export function isWebPSupported(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const dataUrl = canvas.toDataURL('image/webp');
    return dataUrl ? dataUrl.indexOf('data:image/webp') === 0 : false;
  } catch {
    // Canvas not supported or other error
    return false;
  }
}

// Cache WebP support check
let webPSupportCached: boolean | null = null;

/**
 * Get cached WebP support status
 */
export function getWebPSupport(): boolean {
  if (webPSupportCached === null) {
    webPSupportCached = isWebPSupported();
  }
  return webPSupportCached;
}

/**
 * Generate CDN URL for an asset
 *
 * @param assetPath - Relative path to the asset
 * @param options - Optional configuration
 * @returns Full CDN URL for the asset
 */
export function getCDNUrl(
  assetPath: string,
  options: {
    forceLocal?: boolean;
    version?: string;
  } = {}
): string {
  const { forceLocal = false, version } = options;

  if (forceLocal || !cdnConfig.baseUrl) {
    return assetPath;
  }

  // Remove leading slash if present
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  // Add version query param if provided
  const versionParam = version ? `?v=${version}` : '';

  return `${cdnConfig.baseUrl}/${cleanPath}${versionParam}`;
}

/**
 * Generate optimized image URL with CDN and format support
 *
 * @param imagePath - Relative path to the image
 * @param options - Image optimization options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  imagePath: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  } = {}
): string {
  const { width, height, quality = cdnConfig.imageQuality, format = 'auto', fit = 'cover' } = options;

  if (!cdnConfig.imageBaseUrl) {
    return imagePath;
  }

  // Remove leading slash
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

  // Build transformation parameters based on CDN provider
  const params: string[] = [];

  if (width) params.push(`w=${width}`);
  if (height) params.push(`h=${height}`);
  if (quality) params.push(`q=${quality}`);
  if (fit) params.push(`fit=${fit}`);

  // Auto-detect best format
  if (format === 'auto') {
    if (getWebPSupport() && cdnConfig.useWebP) {
      params.push('f=webp');
    }
  } else {
    params.push(`f=${format}`);
  }

  // Generate URL based on CDN provider
  switch (cdnConfig.provider) {
    case 'cloudflare':
      // Cloudflare Images format: /cdn-cgi/image/{params}/{path}
      if (params.length > 0) {
        return `${cdnConfig.imageBaseUrl}/cdn-cgi/image/${params.join(',')}/${cleanPath}`;
      }
      return `${cdnConfig.imageBaseUrl}/${cleanPath}`;

    case 'cloudfront': {
      // CloudFront with Lambda@Edge or CloudFront Functions
      const cfParams = params.length > 0 ? `?${params.join('&')}` : '';
      return `${cdnConfig.imageBaseUrl}/${cleanPath}${cfParams}`;
    }

    case 'akamai': {
      // Akamai Image Manager
      const akamaiParams = params.length > 0 ? `?imwidth=${width || 'auto'}` : '';
      return `${cdnConfig.imageBaseUrl}/${cleanPath}${akamaiParams}`;
    }

    case 'fastly': {
      // Fastly Image Optimizer
      const fastlyParams = params.length > 0 ? `?${params.join('&')}` : '';
      return `${cdnConfig.imageBaseUrl}/${cleanPath}${fastlyParams}`;
    }

    default:
      return `${cdnConfig.imageBaseUrl}/${cleanPath}`;
  }
}

/**
 * Generate srcset for responsive images
 *
 * @param imagePath - Path to the image
 * @param widths - Array of widths to generate
 * @returns srcset string for responsive images
 */
export function generateSrcSet(
  imagePath: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map((width) => {
      const url = getOptimizedImageUrl(imagePath, { width });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 *
 * @param breakpoints - Object mapping breakpoint to size
 * @returns sizes string
 */
export function generateSizes(
  breakpoints: Record<string, string> = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    default: '33vw',
  }
): string {
  const entries = Object.entries(breakpoints);
  const defaultSize = breakpoints.default || '100vw';

  return entries
    .filter(([key]) => key !== 'default')
    .map(([mediaQuery, size]) => `${mediaQuery} ${size}`)
    .concat([defaultSize])
    .join(', ');
}

/**
 * Preload critical asset
 *
 * @param href - URL of the asset to preload
 * @param as - Type of resource
 * @param options - Additional preload options
 */
export function preloadAsset(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch',
  options: {
    crossorigin?: 'anonymous' | 'use-credentials';
    type?: string;
    media?: string;
    fetchpriority?: 'high' | 'low' | 'auto';
  } = {}
): void {
  if (typeof document === 'undefined') return;

  // Check if already preloaded
  const existing = document.querySelector(`link[rel="preload"][href="${href}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;

  if (options.crossorigin) link.crossOrigin = options.crossorigin;
  if (options.type) link.type = options.type;
  if (options.media) link.media = options.media;
  if (options.fetchpriority) link.setAttribute('fetchpriority', options.fetchpriority);

  document.head.appendChild(link);
}

/**
 * Preconnect to CDN origin
 *
 * @param url - CDN URL to preconnect to
 */
export function preconnectCDN(url: string): void {
  if (typeof document === 'undefined' || !url) return;

  const origin = new URL(url).origin;

  // Check if already preconnected
  const existing = document.querySelector(`link[rel="preconnect"][href="${origin}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);

  // Also add dns-prefetch for browsers that don't support preconnect
  const dnsPrefetch = document.createElement('link');
  dnsPrefetch.rel = 'dns-prefetch';
  dnsPrefetch.href = origin;
  document.head.appendChild(dnsPrefetch);
}

/**
 * Initialize CDN connections
 * Call this early in app initialization for faster asset loading
 */
export function initCDNConnections(): void {
  if (cdnConfig.baseUrl) {
    preconnectCDN(cdnConfig.baseUrl);
  }
  if (cdnConfig.imageBaseUrl && cdnConfig.imageBaseUrl !== cdnConfig.baseUrl) {
    preconnectCDN(cdnConfig.imageBaseUrl);
  }
}

/**
 * Get cache control header for an asset type
 *
 * @param assetPath - Path to the asset
 * @returns Cache-Control header value
 */
export function getCacheControlHeader(assetPath: string): string {
  const extension = assetPath.substring(assetPath.lastIndexOf('.')).toLowerCase();
  return ASSET_CACHE_MAPPING[extension] || CACHE_CONTROL_PRESETS.dynamic;
}

export default {
  config: cdnConfig,
  getCDNUrl,
  getOptimizedImageUrl,
  generateSrcSet,
  generateSizes,
  preloadAsset,
  preconnectCDN,
  initCDNConnections,
  getCacheControlHeader,
  isWebPSupported,
  getWebPSupport,
  CACHE_CONTROL_PRESETS,
  ASSET_CACHE_MAPPING,
};
