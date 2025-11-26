import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
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
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  priority = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Loading skeleton
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`${className} bg-gray-200 animate-pulse`}
        style={{ width: width || '100%', height: height || 'auto' }}
        role="img"
        aria-label={`Loading ${alt}`}
      />
    );
  }

  // Error fallback
  if (hasError) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center text-gray-400`}
        style={{ width: width || '100%', height: height || 'auto' }}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
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
    <picture>
      {/* WebP source for modern browsers */}
      <source
        type="image/webp"
        srcSet={generateSrcSet(getWebPSource(src))}
        sizes={sizes}
      />

      {/* Fallback for browsers that don't support WebP */}
      <source
        type={`image/${src.split('.').pop()}`}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
      />

      {/* Fallback img tag */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
      />
    </picture>
  );
};

export default OptimizedImage;
