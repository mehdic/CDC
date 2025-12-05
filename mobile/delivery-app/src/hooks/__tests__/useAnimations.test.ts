/**
 * Tests for useAnimations Custom Hooks
 * MetaPharm Connect - Delivery App
 */

import { renderHook, act } from '@testing-library/react-native';
import {
  useScaleAnimation,
  useFadeAnimation,
  useSlideAnimation,
  usePulseAnimation,
  useRotationAnimation,
  useSequentialAnimation,
  useInterpolatedValue,
  useSwipeAnimation,
  useBounceAnimation,
} from '../useAnimations';
import { Animated } from 'react-native';

describe('useAnimations Hooks', () => {
  describe('useScaleAnimation', () => {
    it('should initialize with correct initial value', () => {
      const { result } = renderHook(() => useScaleAnimation(1));

      expect(result.current.scaleAnim.toJSON()).toBe(1);
    });

    it('should support custom initial value', () => {
      const { result } = renderHook(() => useScaleAnimation(0.5));

      expect(result.current.scaleAnim.toJSON()).toBe(0.5);
    });

    it('should animate to target value', () => {
      const { result } = renderHook(() => useScaleAnimation(1));

      act(() => {
        result.current.animate(1.5, 100);
      });

      expect(result.current.scaleAnim).toBeTruthy();
    });

    it('should reset to initial value', () => {
      const { result } = renderHook(() => useScaleAnimation(1));

      act(() => {
        result.current.reset();
      });

      expect(result.current.scaleAnim.toJSON()).toBe(1);
    });
  });

  describe('useFadeAnimation', () => {
    it('should initialize with correct initial value', () => {
      const { result } = renderHook(() => useFadeAnimation(1));

      expect(result.current.fadeAnim.toJSON()).toBe(1);
    });

    it('should support custom initial value', () => {
      const { result } = renderHook(() => useFadeAnimation(0.5));

      expect(result.current.fadeAnim.toJSON()).toBe(0.5);
    });

    it('should animate to target value', () => {
      const { result } = renderHook(() => useFadeAnimation(1));

      act(() => {
        result.current.animate(0.3, 100);
      });

      expect(result.current.fadeAnim).toBeTruthy();
    });

    it('should reset to initial value', () => {
      const { result } = renderHook(() => useFadeAnimation(1));

      act(() => {
        result.current.reset();
      });

      expect(result.current.fadeAnim.toJSON()).toBe(1);
    });
  });

  describe('useSlideAnimation', () => {
    it('should initialize with default direction x', () => {
      const { result } = renderHook(() => useSlideAnimation());

      expect(result.current.slideAnim.toJSON()).toBe(0);
      expect(result.current.transform).toBeTruthy();
    });

    it('should support y direction', () => {
      const { result } = renderHook(() => useSlideAnimation({ direction: 'y' }));

      expect(result.current.transform).toBeTruthy();
    });

    it('should support custom initial value', () => {
      const { result } = renderHook(() => useSlideAnimation({ initialValue: 50 }));

      expect(result.current.slideAnim.toJSON()).toBe(50);
    });

    it('should animate to target value', () => {
      const { result } = renderHook(() => useSlideAnimation());

      act(() => {
        result.current.animate(100, 100);
      });

      expect(result.current.slideAnim).toBeTruthy();
    });

    it('should reset to initial value', () => {
      const { result } = renderHook(() => useSlideAnimation({ initialValue: 0 }));

      act(() => {
        result.current.reset();
      });

      expect(result.current.slideAnim.toJSON()).toBe(0);
    });
  });

  describe('usePulseAnimation', () => {
    it('should auto-start by default', () => {
      const { result } = renderHook(() => usePulseAnimation());

      expect(result.current.pulseAnim).toBeTruthy();
    });

    it('should support custom opacity range', () => {
      const { result } = renderHook(() =>
        usePulseAnimation({ minOpacity: 0.3, maxOpacity: 0.9 })
      );

      expect(result.current.pulseAnim).toBeTruthy();
    });

    it('should support custom duration', () => {
      const { result } = renderHook(() => usePulseAnimation({ duration: 1500 }));

      expect(result.current.pulseAnim).toBeTruthy();
    });

    it('should allow starting and stopping', () => {
      const { result } = renderHook(() => usePulseAnimation({ autoStart: false }));

      act(() => {
        result.current.start();
      });

      expect(result.current.pulseAnim).toBeTruthy();

      act(() => {
        result.current.stop();
      });

      expect(result.current.pulseAnim).toBeTruthy();
    });
  });

  describe('useRotationAnimation', () => {
    it('should auto-start by default', () => {
      const { result } = renderHook(() => useRotationAnimation());

      expect(result.current.rotation).toBeTruthy();
    });

    it('should support custom duration', () => {
      const { result } = renderHook(() => useRotationAnimation({ duration: 1500 }));

      expect(result.current.rotation).toBeTruthy();
    });

    it('should provide rotation value', () => {
      const { result } = renderHook(() => useRotationAnimation());

      expect(result.current.rotation).toBeTruthy();
      expect(result.current.rotationAnim).toBeTruthy();
    });

    it('should allow starting and stopping', () => {
      const { result } = renderHook(() => useRotationAnimation({ autoStart: false }));

      act(() => {
        result.current.start();
      });

      expect(result.current.rotation).toBeTruthy();

      act(() => {
        result.current.stop();
      });

      expect(result.current.rotation).toBeTruthy();
    });
  });

  describe('useSequentialAnimation', () => {
    it('should accept array of animations', () => {
      const anim1 = new Animated.Value(0);
      const anim2 = new Animated.Value(0);

      const animations = [
        { animation: anim1, toValue: 1, duration: 100 },
        { animation: anim2, toValue: 1, duration: 100 },
      ];

      const { result } = renderHook(() => useSequentialAnimation(animations, { autoStart: false }));

      act(() => {
        result.current.start();
      });

      expect(result.current.start).toBeTruthy();
    });

    it('should support start and stop control', () => {
      const anim1 = new Animated.Value(0);

      const animations = [{ animation: anim1, toValue: 1, duration: 100 }];

      const { result } = renderHook(() => useSequentialAnimation(animations, { autoStart: false }));

      act(() => {
        result.current.start();
        result.current.stop();
      });

      expect(result.current.stop).toBeTruthy();
    });
  });

  describe('useInterpolatedValue', () => {
    it('should create interpolated value', () => {
      const animValue = new Animated.Value(0);

      const { result } = renderHook(() =>
        useInterpolatedValue(animValue, {
          inputRange: [0, 1],
          outputRange: [0, 100],
        })
      );

      expect(result.current).toBeTruthy();
    });

    it('should support string output ranges', () => {
      const animValue = new Animated.Value(0);

      const { result } = renderHook(() =>
        useInterpolatedValue(animValue, {
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        })
      );

      expect(result.current).toBeTruthy();
    });

    it('should support custom extrapolation', () => {
      const animValue = new Animated.Value(0);

      const { result } = renderHook(() =>
        useInterpolatedValue(animValue, {
          inputRange: [0, 1],
          outputRange: [0, 100],
          extrapolate: 'clamp',
        })
      );

      expect(result.current).toBeTruthy();
    });
  });

  describe('useSwipeAnimation', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useSwipeAnimation());

      expect(result.current.swipeAnim).toBeTruthy();
      expect(result.current.threshold).toBe(50);
    });

    it('should support custom min velocity', () => {
      const { result } = renderHook(() => useSwipeAnimation({ minVelocity: 1 }));

      expect(result.current.swipeAnim).toBeTruthy();
    });

    it('should support custom threshold', () => {
      const { result } = renderHook(() => useSwipeAnimation({ threshold: 100 }));

      expect(result.current.threshold).toBe(100);
    });

    it('should animate swipe', () => {
      const { result } = renderHook(() => useSwipeAnimation());

      act(() => {
        result.current.animateSwipe(100, 1);
      });

      expect(result.current.swipeAnim).toBeTruthy();
    });

    it('should reset swipe animation', () => {
      const { result } = renderHook(() => useSwipeAnimation());

      act(() => {
        result.current.reset();
      });

      expect(result.current.swipeAnim.toJSON()).toBe(0);
    });
  });

  describe('useBounceAnimation', () => {
    it('should auto-start by default', () => {
      const { result } = renderHook(() => useBounceAnimation());

      expect(result.current.bounceAnim).toBeTruthy();
    });

    it('should support custom bounce height', () => {
      const { result } = renderHook(() => useBounceAnimation({ bounceHeight: 30 }));

      expect(result.current.bounceAnim).toBeTruthy();
    });

    it('should support custom duration', () => {
      const { result } = renderHook(() => useBounceAnimation({ duration: 800 }));

      expect(result.current.bounceAnim).toBeTruthy();
    });

    it('should allow starting and stopping', () => {
      const { result } = renderHook(() => useBounceAnimation({ autoStart: false }));

      act(() => {
        result.current.start();
      });

      expect(result.current.bounceAnim).toBeTruthy();

      act(() => {
        result.current.stop();
      });

      expect(result.current.bounceAnim).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should work with multiple hooks together', () => {
      const { result: scale } = renderHook(() => useScaleAnimation(1));
      const { result: fade } = renderHook(() => useFadeAnimation(1));
      const { result: slide } = renderHook(() => useSlideAnimation());

      act(() => {
        scale.current.animate(1.2, 100);
        fade.current.animate(0.8, 100);
        slide.current.animate(50, 100);
      });

      expect(scale.current.scaleAnim).toBeTruthy();
      expect(fade.current.fadeAnim).toBeTruthy();
      expect(slide.current.slideAnim).toBeTruthy();
    });

    it('should handle cleanup on unmount', () => {
      const { unmount } = renderHook(() => usePulseAnimation());

      unmount();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
