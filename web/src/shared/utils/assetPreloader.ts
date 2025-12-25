/**
 * Asset Preloader Utility
 *
 * Manages preloading of critical assets to improve performance metrics:
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Time to Interactive (TTI)
 *
 * Features:
 * - Preload critical fonts, images, and scripts
 * - Prefetch route chunks for faster navigation
 * - Preconnect to CDN origins
 * - Priority-based loading
 *
 * @module assetPreloader
 */

import { preloadAsset, preconnectCDN, cdnConfig, getCDNUrl } from './cdnConfig';

/**
 * Asset types for preloading
 */
export type AssetType = 'script' | 'style' | 'image' | 'font' | 'fetch';

/**
 * Priority levels for asset loading
 */
export type Priority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Asset definition for preloading
 */
export interface PreloadAsset {
  /** URL of the asset */
  url: string;
  /** Type of asset */
  as: AssetType;
  /** Loading priority */
  priority: Priority;
  /** CORS mode */
  crossorigin?: 'anonymous' | 'use-credentials';
  /** MIME type */
  type?: string;
  /** Media query for conditional loading */
  media?: string;
}

/**
 * Critical assets that should be preloaded on app initialization
 */
const CRITICAL_ASSETS: PreloadAsset[] = [
  // Critical fonts - preload for faster text rendering
  {
    url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
    as: 'style',
    priority: 'critical',
  },
  {
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    as: 'style',
    priority: 'critical',
  },
];

/**
 * CDN origins to preconnect to
 */
const CDN_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

/**
 * Route chunk mappings for prefetching
 */
const ROUTE_CHUNKS: Record<string, string[]> = {
  '/pharmacist': ['pharmacist-dashboard', 'pharmacist-inventory'],
  '/doctor': ['doctor-dashboard', 'doctor-prescriptions'],
  '/patient': ['patient-dashboard', 'patient-ecommerce'],
  '/nurse': ['nurse-dashboard', 'nurse-orders'],
  '/delivery': ['delivery-dashboard', 'delivery-tracking'],
};

/**
 * Initialize asset preloading on app start
 */
export function initAssetPreloading(): void {
  // Preconnect to CDN origins
  CDN_ORIGINS.forEach((origin) => {
    preconnectCDN(origin);
  });

  // Preconnect to configured CDN
  if (cdnConfig.baseUrl) {
    preconnectCDN(cdnConfig.baseUrl);
  }

  // Preload critical assets
  CRITICAL_ASSETS.forEach((asset) => {
    if (asset.priority === 'critical') {
      preloadAsset(asset.url, asset.as, {
        crossorigin: asset.crossorigin,
        type: asset.type,
        media: asset.media,
        fetchpriority: 'high',
      });
    }
  });
}

/**
 * Preload assets for a specific route
 *
 * @param path - The route path to preload assets for
 */
export function preloadRouteAssets(path: string): void {
  // Find matching route chunks
  const chunks = Object.entries(ROUTE_CHUNKS).find(([route]) =>
    path.startsWith(route)
  )?.[1];

  if (chunks) {
    chunks.forEach((chunk) => {
      const chunkUrl = getCDNUrl(`/js/${chunk}.js`);
      preloadAsset(chunkUrl, 'script', {
        fetchpriority: 'low',
      });
    });
  }
}

/**
 * Prefetch a module chunk
 *
 * @param chunkName - Name of the chunk to prefetch
 */
export function prefetchChunk(chunkName: string): void {
  if (typeof document === 'undefined') return;

  const chunkUrl = getCDNUrl(`/js/${chunkName}.js`);

  // Check if already prefetched
  const existing = document.querySelector(`link[rel="prefetch"][href*="${chunkName}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = chunkUrl;
  link.as = 'script';
  document.head.appendChild(link);
}

/**
 * Preload an image for faster rendering
 *
 * @param src - Image source URL
 * @param options - Preload options
 */
export function preloadImage(
  src: string,
  options: {
    priority?: Priority;
    srcset?: string;
    sizes?: string;
  } = {}
): void {
  const { priority = 'medium' } = options;

  const imageUrl = getCDNUrl(src);

  preloadAsset(imageUrl, 'image', {
    fetchpriority: priority === 'critical' || priority === 'high' ? 'high' : 'auto',
  });
}

/**
 * Preload multiple images
 *
 * @param images - Array of image sources
 */
export function preloadImages(images: string[]): void {
  images.forEach((src, index) => {
    // First 3 images get high priority
    const priority: Priority = index < 3 ? 'high' : 'low';
    preloadImage(src, { priority });
  });
}

/**
 * Preload a font file
 *
 * @param fontUrl - URL of the font file
 * @param fontType - Font format (woff2, woff, ttf)
 */
export function preloadFont(
  fontUrl: string,
  fontType: 'woff2' | 'woff' | 'ttf' = 'woff2'
): void {
  if (typeof document === 'undefined') return;

  const url = getCDNUrl(fontUrl);

  // Check if already preloaded
  const existing = document.querySelector(`link[rel="preload"][href="${url}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = 'font';
  link.type = `font/${fontType}`;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * Lazy load an image using Intersection Observer
 *
 * @param img - Image element to lazy load
 * @param src - Image source URL
 */
export function lazyLoadImage(img: HTMLImageElement, src: string): void {
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported
    img.loading = 'lazy';
    img.src = getCDNUrl(src);
  } else {
    // Fallback to Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = getCDNUrl(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );
    observer.observe(img);
  }
}

/**
 * Preload critical CSS
 *
 * @param cssUrl - URL of the CSS file
 */
export function preloadCSS(cssUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const url = getCDNUrl(cssUrl);

    // Check if already loaded
    const existing = document.querySelector(`link[href="${url}"]`);
    if (existing) {
      resolve();
      return;
    }

    // Preload then apply
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'style';
    preloadLink.href = url;

    preloadLink.onload = () => {
      // Convert to stylesheet
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = url;
      document.head.appendChild(styleLink);
      resolve();
    };

    preloadLink.onerror = () => {
      reject(new Error(`Failed to preload CSS: ${url}`));
    };

    document.head.appendChild(preloadLink);
  });
}

/**
 * Preload assets on hover (for navigation)
 *
 * @param element - Element to attach hover listener to
 * @param assets - Assets to preload on hover
 */
export function preloadOnHover(
  element: HTMLElement,
  assets: PreloadAsset[]
): () => void {
  let hoverTimeout: NodeJS.Timeout | null = null;

  const handleMouseEnter = () => {
    // Delay preloading by 100ms to avoid unnecessary preloads
    hoverTimeout = setTimeout(() => {
      assets.forEach((asset) => {
        preloadAsset(getCDNUrl(asset.url), asset.as, {
          crossorigin: asset.crossorigin,
          type: asset.type,
        });
      });
    }, 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  // Return cleanup function
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
  };
}

/**
 * Get preload hints for SSR/SSG
 *
 * @returns Array of preload link objects for HTML rendering
 */
export function getPreloadHints(): Array<{
  rel: string;
  href: string;
  as: string;
  type?: string;
  crossorigin?: string;
}> {
  return CRITICAL_ASSETS.filter((asset) => asset.priority === 'critical').map(
    (asset) => ({
      rel: 'preload',
      href: asset.url,
      as: asset.as,
      type: asset.type,
      crossorigin: asset.crossorigin,
    })
  );
}

export default {
  initAssetPreloading,
  preloadRouteAssets,
  prefetchChunk,
  preloadImage,
  preloadImages,
  preloadFont,
  lazyLoadImage,
  preloadCSS,
  preloadOnHover,
  getPreloadHints,
};
