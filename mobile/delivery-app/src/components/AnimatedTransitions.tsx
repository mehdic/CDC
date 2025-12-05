/**
 * Animated Transitions Component
 * Provides screen transitions, list item animations, and modal animations
 * MetaPharm Connect - Delivery App
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  ViewStyle,
  StyleProp,
  LayoutAnimation,
  UIManager,
  Platform,
  FlatListProps,
  FlatList,
  Easing,
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Screen Fade In/Out Transition
 * Animates screen entry/exit with fade effect
 */
interface FadeInScreenProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInScreen: React.FC<FadeInScreenProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Slide In Transition
 * Animates screen entry from left, right, top, or bottom
 */
interface SlideInScreenProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  duration?: number;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export const SlideInScreen: React.FC<SlideInScreenProps> = ({
  children,
  direction = 'right',
  duration = 400,
  delay = 0,
  distance = 300,
  style,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [slideAnim, duration, delay]);

  const getTransform = () => {
    switch (direction) {
      case 'left':
        return slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        });
      case 'right':
        return slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-distance, 0],
        });
      case 'top':
        return slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        });
      case 'bottom':
        return slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-distance, 0],
        });
      default:
        return 0;
    }
  };

  const transform = ['top', 'bottom'].includes(direction)
    ? [{ translateY: getTransform() }]
    : [{ translateX: getTransform() }];

  return (
    <Animated.View
      style={[
        style,
        {
          transform,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Scale In Transition
 * Animates screen entry with scale effect
 */
interface ScaleInScreenProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  fromScale?: number;
  style?: StyleProp<ViewStyle>;
}

export const ScaleInScreen: React.FC<ScaleInScreenProps> = ({
  children,
  duration = 300,
  delay = 0,
  fromScale = 0.8,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(fromScale)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [scaleAnim, opacityAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Animated List Item
 * Provides fade-in and slide animations for list items
 */
interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  animation?: 'fade' | 'slide' | 'scale';
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index = 0,
  delay = 30,
  duration = 300,
  style,
  animation = 'fade',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const itemDelay = index * delay;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (animation === 'fade') {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }).start();
      } else if (animation === 'slide') {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]).start();
      } else if (animation === 'scale') {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]).start();
      }
    }, itemDelay);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, scaleAnim, duration, itemDelay, animation]);

  const animationStyles = {
    opacity: fadeAnim,
    transform:
      animation === 'slide'
        ? [{ translateY: slideAnim }]
        : animation === 'scale'
          ? [{ scale: scaleAnim }]
          : [{ translateY: 0 }],
  };

  return (
    <Animated.View style={[style, animationStyles]}>
      {children}
    </Animated.View>
  );
};

/**
 * Modal Bottom Sheet Animation
 * Animates modal from bottom with backdrop fade
 */
interface AnimatedModalProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  visible = false,
  onClose,
  children,
  duration = 300,
  style,
}) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const isHiddenRef = useRef(!visible);

  useEffect(() => {
    if (visible) {
      isHiddenRef.current = false;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 400,
          duration,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isHiddenRef.current = true;
      });
    }
  }, [visible, slideAnim, backdropAnim, duration]);

  if (isHiddenRef.current) {
    return null;
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: backdropAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          style,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

/**
 * Rotation Animation
 * Continuously rotates a component (useful for loading spinners)
 */
interface RotationAnimationProps {
  children: React.ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const RotationAnimation: React.FC<RotationAnimationProps> = ({
  children,
  duration = 1000,
  style,
}) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    ).start();
  }, [rotationAnim, duration]);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Bounce Animation
 * Creates a bouncing effect (useful for attention-grabbing)
 */
interface BounceAnimationProps {
  children: React.ReactNode;
  duration?: number;
  bounceAmount?: number;
  style?: StyleProp<ViewStyle>;
}

export const BounceAnimation: React.FC<BounceAnimationProps> = ({
  children,
  duration = 500,
  bounceAmount = 10,
  style,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -bounceAmount,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim, duration, bounceAmount]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY: bounceAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default {
  FadeInScreen,
  SlideInScreen,
  ScaleInScreen,
  AnimatedListItem,
  AnimatedModal,
  RotationAnimation,
  BounceAnimation,
};
