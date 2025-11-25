/**
 * Pressable Feedback Component
 * Provides haptic feedback and scale/opacity animations on press
 * MetaPharm Connect - Delivery App
 */

import React, { useRef } from 'react';
import {
  View,
  Animated,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  Vibration,
  Alert,
  TouchableOpacityProps,
} from 'react-native';

/**
 * Props for PressableFeedback component
 */
interface PressableFeedbackProps extends Omit<TouchableOpacityProps, 'style'> {
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  scaleValue?: number;
  duration?: number;
  haptic?: boolean;
  hapticStrength?: 'light' | 'medium' | 'heavy';
}

/**
 * PressableFeedback Component
 * Wraps children with animated press feedback including scale and opacity
 * Provides optional haptic feedback on press
 */
export const PressableFeedback: React.FC<PressableFeedbackProps> = ({
  onPress,
  onLongPress,
  children,
  style,
  activeOpacity = 0.7,
  scaleValue = 0.95,
  duration = 100,
  haptic = true,
  hapticStrength = 'light',
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  /**
   * Get haptic feedback strength
   */
  const getHapticDuration = (): number => {
    switch (hapticStrength) {
      case 'light':
        return 10;
      case 'medium':
        return 20;
      case 'heavy':
        return 40;
      default:
        return 10;
    }
  };

  /**
   * Handle press in animation
   */
  const handlePressIn = () => {
    if (haptic) {
      Vibration.vibrate(getHapticDuration());
    }

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: scaleValue,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: activeOpacity,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Handle press out animation
   */
  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Handle press with haptic feedback
   */
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  /**
   * Handle long press with stronger haptic
   */
  const handleLongPress = () => {
    if (onLongPress) {
      Vibration.vibrate(getHapticDuration() * 1.5);
      onLongPress();
    }
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        style={style}
        activeOpacity={1}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Success Feedback Animation
 * Plays a success animation with feedback
 */
interface SuccessFeedbackProps {
  duration?: number;
  children: React.ReactNode;
  onAnimationComplete?: () => void;
}

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
  duration = 300,
  children,
  onAnimationComplete,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    Vibration.vibrate([0, 100, 50, 150]); // Success vibration pattern

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: duration * 0.2,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: duration * 0.2,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [duration, scaleAnim, onAnimationComplete]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Error Feedback Animation
 * Plays a shake animation with error feedback
 */
interface ErrorFeedbackProps {
  duration?: number;
  children: React.ReactNode;
  onAnimationComplete?: () => void;
  shakeAmount?: number;
}

export const ErrorFeedback: React.FC<ErrorFeedbackProps> = ({
  duration = 400,
  children,
  onAnimationComplete,
  shakeAmount = 10,
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Vibration.vibrate([0, 100, 100, 100]); // Error vibration pattern

    Animated.sequence(
      Array.from({ length: 6 }, (_, i) =>
        Animated.timing(shakeAnim, {
          toValue: i % 2 === 0 ? shakeAmount : -shakeAmount,
          duration: duration / 6,
          useNativeDriver: true,
        })
      )
    ).start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [duration, shakeAnim, onAnimationComplete, shakeAmount]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Loading Feedback Animation
 * Plays a pulse animation during loading
 */
interface LoadingFeedbackProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export const LoadingFeedback: React.FC<LoadingFeedbackProps> = ({
  children,
  isLoading = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!isLoading) {
      pulseAnim.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isLoading, pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          opacity: pulseAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default {
  PressableFeedback,
  SuccessFeedback,
  ErrorFeedback,
  LoadingFeedback,
};
