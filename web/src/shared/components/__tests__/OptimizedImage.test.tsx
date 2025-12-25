/**
 * OptimizedImage Component Tests
 *
 * Tests for lazy loading, CDN integration, and image optimization features.
 *
 * @module OptimizedImage.test
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OptimizedImage } from '../OptimizedImage';

// Mock IntersectionObserver with proper implementation
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
const mockUnobserve = jest.fn();

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(public callback: IntersectionObserverCallback) {}

  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock cdnConfig
jest.mock('../../utils/cdnConfig', () => ({
  getOptimizedImageUrl: jest.fn((src: string) => src),
  generateSrcSet: jest.fn((src: string) => `${src} 320w, ${src} 640w`),
  generateSizes: jest.fn(() => '100vw'),
  getWebPSupport: jest.fn(() => false), // Return false to simplify testing
  cdnConfig: {
    provider: 'local',
    baseUrl: '',
    imageBaseUrl: '',
    useWebP: true,
    defaultCacheTTL: 0,
    imageQuality: 85,
  },
}));

describe('OptimizedImage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockUnobserve.mockClear();
  });

  describe('Basic Rendering', () => {
    test('renders with required props', () => {
      render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

      // Should show skeleton initially (not in view)
      const skeleton = screen.getByRole('img', { name: /loading test image/i });
      expect(skeleton).toBeInTheDocument();
    });

    test('renders with priority loading', async () => {
      render(<OptimizedImage src="/test-image.jpg" alt="Test image" priority />);

      // Priority images should render immediately
      const picture = screen.getByRole('img');
      expect(picture).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          className="custom-class"
        />
      );

      const element = screen.getByRole('img');
      expect(element).toHaveClass('custom-class');
    });

    test('renders with data-testid', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          priority
          data-testid="test-image"
        />
      );

      expect(screen.getByTestId('test-image')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    test('sets up IntersectionObserver for lazy loading', () => {
      render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

      expect(mockObserve).toHaveBeenCalled();
    });

    test('does not set up observer for priority images', () => {
      mockObserve.mockClear();
      render(<OptimizedImage src="/test-image.jpg" alt="Test image" priority />);

      // Priority images render immediately, no observer needed
      expect(mockObserve).not.toHaveBeenCalled();
    });

    test('disconnects observer on unmount', () => {
      const { unmount } = render(
        <OptimizedImage src="/test-image.jpg" alt="Test image" />
      );

      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('Placeholders', () => {
    test('shows skeleton placeholder by default', () => {
      render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

      const skeleton = screen.getByRole('img', { name: /loading test image/i });
      expect(skeleton).toHaveClass('animate-pulse');
    });

    test('shows blur placeholder when blurDataURL provided', () => {
      const blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
      );

      const element = screen.getByRole('img', { name: /loading test image/i });
      expect(element).toHaveStyle({ filter: 'blur(20px)' });
    });

    test('shows empty placeholder when specified', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          placeholder="empty"
        />
      );

      const element = screen.getByRole('img', { name: /loading test image/i });
      expect(element).not.toHaveClass('animate-pulse');
    });
  });

  describe('Error Handling', () => {
    test('shows error fallback when image fails to load', async () => {
      const onError = jest.fn();
      render(
        <OptimizedImage
          src="/nonexistent.jpg"
          alt="Test image"
          onError={onError}
          priority // Use priority to skip lazy loading
        />
      );

      const img = screen.getByRole('img');
      fireEvent.error(img);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    test('uses fallbackSrc when provided and image fails', async () => {
      render(
        <OptimizedImage
          src="/nonexistent.jpg"
          alt="Test image"
          fallbackSrc="/fallback.jpg"
          priority
        />
      );

      const img = screen.getByRole('img');
      fireEvent.error(img);

      await waitFor(() => {
        expect(img).toHaveAttribute('src', '/fallback.jpg');
      });
    });
  });

  describe('Image Loading', () => {
    test('calls onLoad when image loads successfully', async () => {
      const onLoad = jest.fn();
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          onLoad={onLoad}
          priority
        />
      );

      const img = screen.getByRole('img');
      fireEvent.load(img);

      expect(onLoad).toHaveBeenCalled();
    });

    test('sets loading attribute based on priority', () => {
      render(
        <OptimizedImage src="/test-image.jpg" alt="Test image" priority />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'eager');
    });
  });

  describe('Image Dimensions', () => {
    test('applies width and height', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={800}
          height={600}
          priority
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('width', '800');
      expect(img).toHaveAttribute('height', '600');
    });

    test('applies objectFit style', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          objectFit="contain"
          priority
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveStyle({ objectFit: 'contain' });
    });
  });

  describe('Picture Element and Sources', () => {
    test('renders picture element with sources', () => {
      render(
        <OptimizedImage src="/test-image.jpg" alt="Test image" priority />
      );

      const picture = document.querySelector('picture');
      expect(picture).toBeInTheDocument();

      const sources = picture?.querySelectorAll('source');
      expect(sources?.length).toBeGreaterThan(0);
    });

    test('renders source elements for srcset', () => {
      render(
        <OptimizedImage src="/test-image.jpg" alt="Test image" priority />
      );

      // Since getWebPSupport returns false in mock, there may not be a WebP source
      // but there should be a fallback source
      const sources = document.querySelectorAll('source');
      expect(sources.length).toBeGreaterThanOrEqual(1);
    });

    test('applies sizes attribute to sources', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      );

      const source = document.querySelector('source');
      expect(source).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
    });
  });

  describe('Opacity Transition', () => {
    test('starts with opacity 0', () => {
      render(
        <OptimizedImage src="/test-image.jpg" alt="Test image" priority />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveClass('opacity-0');
    });

    test('transitions to opacity 100 on load', async () => {
      render(
        <OptimizedImage src="/test-image.jpg" alt="Test image" priority />
      );

      const img = screen.getByRole('img');
      fireEvent.load(img);

      await waitFor(() => {
        expect(img).toHaveClass('opacity-100');
      });
    });
  });

  describe('Accessibility', () => {
    test('includes alt text', () => {
      render(
        <OptimizedImage src="/test-image.jpg" alt="Descriptive alt text" priority />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Descriptive alt text');
    });

    test('skeleton has appropriate aria-label', () => {
      render(<OptimizedImage src="/test-image.jpg" alt="Test image" />);

      const skeleton = screen.getByRole('img');
      // aria-label contains "Loading" and the alt text
      expect(skeleton).toHaveAttribute('aria-label');
      expect(skeleton.getAttribute('aria-label')).toContain('Test image');
    });
  });
});
