import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * OptimizedImage Component
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - WebP format with fallback
 * - Responsive srcset for different screen sizes
 * - Placeholder skeleton while loading
 * - Error handling with fallback image
 *
 * T2-044: Image optimization implementation
 */

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean; // If true, skip lazy loading (for above-the-fold images)
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
}

/**
 * Convert image URL to WebP format
 * This assumes a CDN or image processing service that can serve WebP
 * Modify based on your actual CDN/image service
 */
const getWebPUrl = (url: string): string => {
  // Check if already WebP
  if (url.endsWith('.webp')) {
    return url;
  }

  // For production: CDN would handle WebP conversion
  // Example: CloudFront with Lambda@Edge or CloudFlare Images
  // return url.replace(/\.(jpg|jpeg|png)$/, '.webp');

  // For now, return original URL
  // TODO: Implement CDN-based WebP conversion in production
  return url;
};

/**
 * Generate srcset for responsive images
 * Creates URLs for different screen sizes
 */
const generateSrcSet = (src: string): string => {
  // For production: CDN would provide resized versions
  // Example: CloudFront with image resizing or Cloudinary
  // const sizes = [320, 640, 960, 1280, 1920];
  // return sizes.map(size => `${src}?w=${size} ${size}w`).join(', ');

  // For now, return single source
  // TODO: Implement CDN-based image resizing in production
  return src;
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  className,
  fallbackSrc = '/placeholder.png',
  priority = false,
  objectFit = 'cover',
  sizes = '100vw',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // If priority, load immediately
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return; // Skip lazy loading for priority images

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
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const webpSrc = getWebPUrl(src);
  const srcSet = generateSrcSet(src);
  const imageSrc = hasError ? fallbackSrc : (isInView ? webpSrc : '');

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
      }}
      className={className}
    >
      {/* Skeleton placeholder while loading */}
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}

      {/* Picture element for WebP with fallback */}
      <picture>
        {/* WebP source */}
        {!hasError && (
          <source
            type="image/webp"
            srcSet={isInView ? srcSet : undefined}
            sizes={sizes}
          />
        )}

        {/* Fallback img */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      </picture>
    </Box>
  );
};

/**
 * Example usage:
 *
 * <OptimizedImage
 *   src="/api/images/prescription-123.jpg"
 *   alt="Prescription image"
 *   width={400}
 *   height={300}
 *   objectFit="cover"
 *   priority={false} // Lazy load
 * />
 *
 * <OptimizedImage
 *   src="/logo.png"
 *   alt="MetaPharm Logo"
 *   width={200}
 *   height={60}
 *   priority={true} // Load immediately (above the fold)
 * />
 */
