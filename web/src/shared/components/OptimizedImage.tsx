import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  getOptimizedImageUrl,
  generateSrcSet as cdnGenerateSrcSet,
  generateSizes,
  getWebPSupport,
  cdnConfig,
} from '../utils/cdnConfig';

interface OptimizedImageProps {
  /** Source URL of the image */
  src: string;
  /** Alternative text for accessibility */
  alt: string;
  /** CSS class name */
  className?: string;
  /** Width of the image */
  width?: number;
  /** Height of the image */
  height?: number;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Priority loading for above-the-fold images */
  priority?: boolean;
  /** Image quality (1-100) for CDN optimization */
  quality?: number;
  /** Whether to use CDN optimization */
  useCDN?: boolean;
  /** Placeholder type while loading */
  placeholder?: 'skeleton' | 'blur' | 'empty';
  /** Blur placeholder data URL */
  blurDataURL?: string;
  /** Fallback image on error */
  fallbackSrc?: string;
  /** Fetch priority hint */
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Object fit style */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Data test id for testing */
  'data-testid'?: string;
}

/**
 * OptimizedImage Component
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - WebP format support with fallback
 * - Responsive images with srcset
 * - Loading placeholder/skeleton
 * - Priority loading for above-the-fold images
 * - CDN integration with dynamic optimization
 * - Blur-up placeholder effect
 * - Error handling with fallback
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  priority = false,
  quality = 85,
  useCDN = true,
  placeholder = 'skeleton',
  blurDataURL,
  fallbackSrc,
  fetchPriority = 'auto',
  objectFit = 'cover',
  onLoad,
  onError,
  'data-testid': testId,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate CDN-optimized URL
  const optimizedSrc = useCDN && cdnConfig.baseUrl
    ? getOptimizedImageUrl(src, { width, height, quality, format: 'auto' })
    : src;

  // Generate responsive srcset with CDN
  const responsiveSrcSet = useCDN && cdnConfig.baseUrl
    ? cdnGenerateSrcSet(src, [320, 640, 960, 1280, 1920])
    : undefined;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Generate WebP source with fallback
  const getWebPSource = (imageSrc: string): string => {
    const extension = imageSrc.split('.').pop()?.toLowerCase();
    if (extension === 'svg' || extension === 'gif') {
      return imageSrc; // Don't convert SVG or GIF to WebP
    }
    return imageSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  };

  // Generate srcset for responsive images
  const generateSrcSet = (imageSrc: string): string => {
    const baseUrl = imageSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const extension = imageSrc.split('.').pop();
    return `${baseUrl}-320w.${extension} 320w,
            ${baseUrl}-640w.${extension} 640w,
            ${baseUrl}-1024w.${extension} 1024w,
            ${baseUrl}-1920w.${extension} 1920w`;
  };

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Get current source (with fallback on error)
  const currentSrc = hasError && fallbackSrc ? fallbackSrc : optimizedSrc;

  // Loading skeleton placeholder
  if (!isInView && placeholder === 'skeleton') {
    return (
      <div
        ref={imgRef}
        className={`${className} bg-gray-200 animate-pulse`}
        style={{
          width: width || '100%',
          height: height || 'auto',
          objectFit,
        }}
        role="img"
        aria-label={`Loading ${alt}`}
        data-testid={testId}
      />
    );
  }

  // Blur placeholder
  if (!isInView && placeholder === 'blur' && blurDataURL) {
    return (
      <div
        ref={imgRef}
        className={className}
        style={{
          width: width || '100%',
          height: height || 'auto',
          backgroundImage: `url(${blurDataURL})`,
          backgroundSize: objectFit,
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
        }}
        role="img"
        aria-label={`Loading ${alt}`}
        data-testid={testId}
      />
    );
  }

  // Empty placeholder (just reserves space)
  if (!isInView && placeholder === 'empty') {
    return (
      <div
        ref={imgRef}
        style={{
          width: width || '100%',
          height: height || 'auto',
        }}
        role="img"
        aria-label={`Loading ${alt}`}
        data-testid={testId}
      />
    );
  }

  // Error fallback
  if (hasError && !fallbackSrc) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center text-gray-400`}
        style={{ width: width || '100%', height: height || 'auto' }}
        role="img"
        aria-label={alt}
        data-testid={testId}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <picture data-testid={testId}>
      {/* WebP source for modern browsers */}
      {getWebPSupport() && (
        <source
          type="image/webp"
          srcSet={responsiveSrcSet || generateSrcSet(getWebPSource(src))}
          sizes={sizes}
        />
      )}

      {/* Fallback for browsers that don't support WebP */}
      <source
        type={`image/${src.split('.').pop()}`}
        srcSet={responsiveSrcSet || generateSrcSet(src)}
        sizes={sizes}
      />

      {/* Fallback img tag */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        style={{ objectFit }}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        // @ts-expect-error - fetchPriority not yet in React types
        fetchpriority={priority ? 'high' : fetchPriority}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
      />
    </picture>
  );
});

// Add display name for debugging
OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
