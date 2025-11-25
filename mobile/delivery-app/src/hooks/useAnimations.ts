/**
 * Custom Animation Hooks
 * Provides reusable animation logic for common patterns
 * MetaPharm Connect - Delivery App
 */

import { useRef, useEffect, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * useScaleAnimation
 * Creates a scale animation that can be controlled
 */
export const useScaleAnimation = (initialValue: number = 1) => {
  const scaleAnim = useRef(new Animated.Value(initialValue)).current;

  const animate = useCallback(
    (toValue: number, duration: number = 300) => {
      Animated.timing(scaleAnim, {
        toValue,
        duration,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    },
    [scaleAnim]
  );

  const reset = useCallback(() => {
    scaleAnim.setValue(initialValue);
  }, [scaleAnim, initialValue]);

  return { scaleAnim, animate, reset };
};

/**
 * useFadeAnimation
 * Creates a fade animation that can be controlled
 */
export const useFadeAnimation = (initialValue: number = 1) => {
  const fadeAnim = useRef(new Animated.Value(initialValue)).current;

  const animate = useCallback(
    (toValue: number, duration: number = 300) => {
      Animated.timing(fadeAnim, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim]
  );

  const reset = useCallback(() => {
    fadeAnim.setValue(initialValue);
  }, [fadeAnim, initialValue]);

  return { fadeAnim, animate, reset };
};

/**
 * useSlideAnimation
 * Creates a slide animation in X or Y direction
 */
interface UseSlideAnimationOptions {
  direction?: 'x' | 'y';
  initialValue?: number;
}

export const useSlideAnimation = (options: UseSlideAnimationOptions = {}) => {
  const { direction = 'x', initialValue = 0 } = options;
  const slideAnim = useRef(new Animated.Value(initialValue)).current;

  const animate = useCallback(
    (toValue: number, duration: number = 300) => {
      Animated.timing(slideAnim, {
        toValue,
        duration,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    },
    [slideAnim]
  );

  const reset = useCallback(() => {
    slideAnim.setValue(initialValue);
  }, [slideAnim, initialValue]);

  const transform =
    direction === 'x' ? [{ translateX: slideAnim }] : [{ translateY: slideAnim }];

  return { slideAnim, animate, reset, transform };
};

/**
 * usePulseAnimation
 * Creates a continuous pulse effect
 */
interface UsePulseAnimationOptions {
  minOpacity?: number;
  maxOpacity?: number;
  duration?: number;
  autoStart?: boolean;
}

export const usePulseAnimation = (options: UsePulseAnimationOptions = {}) => {
  const {
    minOpacity = 0.5,
    maxOpacity = 1,
    duration = 1000,
    autoStart = true,
  } = options;

  const pulseAnim = useRef(new Animated.Value(maxOpacity)).current;
  const animationRef = useRef<any>(null);

  const start = useCallback(() => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: minOpacity,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: maxOpacity,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current.start();
  }, [pulseAnim, minOpacity, maxOpacity, duration]);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      start();
      return () => stop();
    }
  }, [autoStart, start, stop]);

  return { pulseAnim, start, stop };
};

/**
 * useRotationAnimation
 * Creates a continuous rotation effect
 */
interface UseRotationAnimationOptions {
  duration?: number;
  autoStart?: boolean;
}

export const useRotationAnimation = (options: UseRotationAnimationOptions = {}) => {
  const { duration = 1000, autoStart = true } = options;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<any>(null);

  const start = useCallback(() => {
    animationRef.current = Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    );
    animationRef.current.start();
  }, [rotationAnim, duration]);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  }, []);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (autoStart) {
      start();
      return () => stop();
    }
  }, [autoStart, start, stop]);

  return { rotationAnim, rotation, start, stop };
};

/**
 * useSequentialAnimation
 * Plays multiple animations in sequence
 */
interface SequentialAnimationItem {
  animation: Animated.Animated;
  toValue: number;
  duration: number;
}

export const useSequentialAnimation = (
  animations: SequentialAnimationItem[],
  options: { autoStart?: boolean } = {}
) => {
  const { autoStart = true } = options;
  const animationRef = useRef<any>(null);

  const start = useCallback(() => {
    const sequence = animations.map((item) =>
      Animated.timing(item.animation, {
        toValue: item.toValue,
        duration: item.duration,
        useNativeDriver: true,
      })
    );

    animationRef.current = Animated.sequence(sequence);
    animationRef.current.start();
  }, [animations]);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      start();
      return () => stop();
    }
  }, [autoStart, start, stop]);

  return { start, stop };
};

/**
 * useInterpolatedValue
 * Creates interpolated animation values
 */
interface UseInterpolatedValueOptions {
  inputRange: number[];
  outputRange: (string | number)[];
  extrapolate?: 'extend' | 'clamp' | 'identity';
}

export const useInterpolatedValue = (
  animationValue: Animated.Value,
  options: UseInterpolatedValueOptions
) => {
  const { inputRange, outputRange, extrapolate = 'extend' } = options;

  return animationValue.interpolate({
    inputRange,
    outputRange,
    extrapolate: extrapolate as any,
  });
};

/**
 * useSwipeAnimation
 * Creates animation for swipe gestures
 */
interface UseSwipeAnimationOptions {
  minVelocity?: number;
  threshold?: number;
}

export const useSwipeAnimation = (options: UseSwipeAnimationOptions = {}) => {
  const { minVelocity = 0.5, threshold = 50 } = options;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const animateSwipe = useCallback(
    (distance: number, velocity: number, onComplete?: () => void) => {
      if (Math.abs(velocity) > minVelocity) {
        // Swipe detected - animate to completion
        Animated.timing(swipeAnim, {
          toValue: distance > 0 ? 1 : -1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          if (onComplete) {
            onComplete();
          }
        });
      } else {
        // Reset to initial position
        Animated.timing(swipeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    },
    [swipeAnim, minVelocity]
  );

  const reset = useCallback(() => {
    swipeAnim.setValue(0);
  }, [swipeAnim]);

  return { swipeAnim, animateSwipe, reset, threshold };
};

/**
 * useBounceAnimation
 * Creates a bouncing effect animation
 */
interface UseBounceAnimationOptions {
  bounceHeight?: number;
  duration?: number;
  autoStart?: boolean;
}

export const useBounceAnimation = (
  options: UseBounceAnimationOptions = {}
) => {
  const { bounceHeight = 20, duration = 600, autoStart = true } = options;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<any>(null);

  const start = useCallback(() => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -bounceHeight,
          duration: duration / 2,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ])
    );
    animationRef.current.start();
  }, [bounceAnim, bounceHeight, duration]);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      start();
      return () => stop();
    }
  }, [autoStart, start, stop]);

  return { bounceAnim, start, stop };
};

export default {
  useScaleAnimation,
  useFadeAnimation,
  useSlideAnimation,
  usePulseAnimation,
  useRotationAnimation,
  useSequentialAnimation,
  useInterpolatedValue,
  useSwipeAnimation,
  useBounceAnimation,
};
