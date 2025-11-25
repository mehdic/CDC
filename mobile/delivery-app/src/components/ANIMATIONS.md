# UX Animations Documentation

This document describes the animation components and hooks available in the MetaPharm Connect Delivery App.

## Overview

The animation system provides:
- **Press Feedback**: Interactive feedback on button/component press
- **Screen Transitions**: Smooth screen entry animations
- **List Animations**: Staggered list item animations
- **Modal Animations**: Bottom sheet and overlay animations
- **Custom Hooks**: Reusable animation logic

## Components

### PressableFeedback

Wraps components with animated press feedback including scale, opacity, and haptic feedback.

**Usage:**
```typescript
import { PressableFeedback } from './components/PressableFeedback';

<PressableFeedback
  onPress={() => console.log('Pressed')}
  scaleValue={0.95}
  duration={100}
  haptic={true}
  hapticStrength="medium"
>
  <Text>Press Me</Text>
</PressableFeedback>
```

**Props:**
- `onPress`: Function called on press
- `onLongPress`: Function called on long press
- `activeOpacity`: Opacity when pressed (default: 0.7)
- `scaleValue`: Scale factor when pressed (default: 0.95)
- `duration`: Animation duration in ms (default: 100)
- `haptic`: Enable haptic feedback (default: true)
- `hapticStrength`: 'light' | 'medium' | 'heavy' (default: 'light')
- `children`: Content to render
- `style`: Custom styling

### SuccessFeedback

Plays a success animation with celebration bounce and haptic feedback pattern.

**Usage:**
```typescript
import { SuccessFeedback } from './components/PressableFeedback';

<SuccessFeedback
  duration={300}
  onAnimationComplete={() => console.log('Done')}
>
  <Text>Success!</Text>
</SuccessFeedback>
```

**Props:**
- `duration`: Animation duration in ms (default: 300)
- `onAnimationComplete`: Callback when animation completes
- `children`: Content to render

### ErrorFeedback

Plays a shake animation with error vibration pattern.

**Usage:**
```typescript
import { ErrorFeedback } from './components/PressableFeedback';

<ErrorFeedback
  duration={400}
  shakeAmount={10}
  onAnimationComplete={() => console.log('Shake done')}
>
  <Text>Error!</Text>
</ErrorFeedback>
```

**Props:**
- `duration`: Animation duration in ms (default: 400)
- `shakeAmount`: Shake distance in pixels (default: 10)
- `onAnimationComplete`: Callback when animation completes
- `children`: Content to render

### LoadingFeedback

Plays a continuous pulse animation during loading states.

**Usage:**
```typescript
import { LoadingFeedback } from './components/PressableFeedback';

<LoadingFeedback isLoading={isLoading}>
  <Text>Loading...</Text>
</LoadingFeedback>
```

**Props:**
- `isLoading`: Whether animation should play
- `children`: Content to render

### FadeInScreen

Animates screen entry with fade effect.

**Usage:**
```typescript
import { FadeInScreen } from './components/AnimatedTransitions';

<FadeInScreen duration={300} delay={100}>
  <ScreenContent />
</FadeInScreen>
```

**Props:**
- `duration`: Animation duration in ms (default: 300)
- `delay`: Delay before animation starts (default: 0)
- `style`: Custom styling
- `children`: Content to render

### SlideInScreen

Animates screen entry from any direction (left, right, top, bottom).

**Usage:**
```typescript
import { SlideInScreen } from './components/AnimatedTransitions';

<SlideInScreen
  direction="right"
  duration={400}
  distance={300}
>
  <ScreenContent />
</SlideInScreen>
```

**Props:**
- `direction`: 'left' | 'right' | 'top' | 'bottom' (default: 'right')
- `duration`: Animation duration in ms (default: 400)
- `delay`: Delay before animation starts
- `distance`: Slide distance in pixels (default: 300)
- `style`: Custom styling
- `children`: Content to render

### ScaleInScreen

Animates screen entry with scale effect.

**Usage:**
```typescript
import { ScaleInScreen } from './components/AnimatedTransitions';

<ScaleInScreen fromScale={0.8} duration={300}>
  <ScreenContent />
</ScaleInScreen>
```

**Props:**
- `fromScale`: Starting scale value (default: 0.8)
- `duration`: Animation duration in ms (default: 300)
- `delay`: Delay before animation starts
- `style`: Custom styling
- `children`: Content to render

### AnimatedListItem

Provides fade, slide, or scale animations for list items with staggered timing.

**Usage:**
```typescript
import { AnimatedListItem } from './components/AnimatedTransitions';

{items.map((item, index) => (
  <AnimatedListItem
    key={item.id}
    index={index}
    animation="slide"
    delay={30}
    duration={300}
  >
    <ListItemComponent item={item} />
  </AnimatedListItem>
))}
```

**Props:**
- `index`: Item index for staggered animation (default: 0)
- `delay`: Delay between items in ms (default: 30)
- `duration`: Animation duration in ms (default: 300)
- `animation`: 'fade' | 'slide' | 'scale' (default: 'fade')
- `style`: Custom styling
- `children`: Content to render

### AnimatedModal

Animates modal from bottom with backdrop fade.

**Usage:**
```typescript
import { AnimatedModal } from './components/AnimatedTransitions';

<AnimatedModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  duration={300}
>
  <ModalContent />
</AnimatedModal>
```

**Props:**
- `visible`: Whether modal is shown
- `onClose`: Callback when modal should close
- `duration`: Animation duration in ms (default: 300)
- `style`: Custom styling
- `children`: Content to render

### RotationAnimation

Continuously rotates a component (useful for spinners).

**Usage:**
```typescript
import { RotationAnimation } from './components/AnimatedTransitions';

<RotationAnimation duration={1000}>
  <LoadingSpinner />
</RotationAnimation>
```

**Props:**
- `duration`: Full rotation duration in ms (default: 1000)
- `style`: Custom styling
- `children`: Content to render

### BounceAnimation

Creates a continuous bouncing effect.

**Usage:**
```typescript
import { BounceAnimation } from './components/AnimatedTransitions';

<BounceAnimation bounceAmount={20} duration={600}>
  <AttentionGrabber />
</BounceAnimation>
```

**Props:**
- `bounceAmount`: Bounce height in pixels (default: 10)
- `duration`: Complete bounce cycle duration in ms (default: 500)
- `style`: Custom styling
- `children`: Content to render

## Custom Hooks

### useScaleAnimation

Creates a controllable scale animation.

**Usage:**
```typescript
import { useScaleAnimation } from './hooks/useAnimations';

const { scaleAnim, animate, reset } = useScaleAnimation(1);

// Animate to 1.2
animate(1.2, 300);

// Reset to initial
reset();

return (
  <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
    <Content />
  </Animated.View>
);
```

### useFadeAnimation

Creates a controllable fade animation.

**Usage:**
```typescript
import { useFadeAnimation } from './hooks/useAnimations';

const { fadeAnim, animate, reset } = useFadeAnimation(1);

animate(0.5, 300); // Fade to 50% opacity
reset(); // Fade back to 100%
```

### useSlideAnimation

Creates a controllable slide animation in X or Y direction.

**Usage:**
```typescript
import { useSlideAnimation } from './hooks/useAnimations';

const { slideAnim, animate, reset, transform } = useSlideAnimation({
  direction: 'x',
  initialValue: 0
});

animate(100, 300); // Slide 100px right

return (
  <Animated.View style={[{ transform }]}>
    <Content />
  </Animated.View>
);
```

### usePulseAnimation

Creates a continuous pulse effect.

**Usage:**
```typescript
import { usePulseAnimation } from './hooks/useAnimations';

const { pulseAnim, start, stop } = usePulseAnimation({
  minOpacity: 0.5,
  maxOpacity: 1,
  duration: 1000,
  autoStart: true
});

return (
  <Animated.View style={[{ opacity: pulseAnim }]}>
    <Content />
  </Animated.View>
);
```

### useRotationAnimation

Creates a continuous rotation effect.

**Usage:**
```typescript
import { useRotationAnimation } from './hooks/useAnimations';

const { rotation, start, stop } = useRotationAnimation({
  duration: 1000,
  autoStart: true
});

return (
  <Animated.View style={[{ transform: [{ rotate: rotation }] }]}>
    <LoadingSpinner />
  </Animated.View>
);
```

### useBounceAnimation

Creates a continuous bounce effect.

**Usage:**
```typescript
import { useBounceAnimation } from './hooks/useAnimations';

const { bounceAnim, start, stop } = useBounceAnimation({
  bounceHeight: 20,
  duration: 600,
  autoStart: true
});

return (
  <Animated.View style={[{ transform: [{ translateY: bounceAnim }] }]}>
    <Content />
  </Animated.View>
);
```

### useSequentialAnimation

Plays multiple animations in sequence.

**Usage:**
```typescript
import { useSequentialAnimation } from './hooks/useAnimations';

const anim1 = useRef(new Animated.Value(0)).current;
const anim2 = useRef(new Animated.Value(0)).current;

const { start, stop } = useSequentialAnimation(
  [
    { animation: anim1, toValue: 1, duration: 300 },
    { animation: anim2, toValue: 1, duration: 300 },
  ],
  { autoStart: true }
);
```

### useInterpolatedValue

Creates an interpolated animation value.

**Usage:**
```typescript
import { useInterpolatedValue } from './hooks/useAnimations';

const animValue = useRef(new Animated.Value(0)).current;

const rotation = useInterpolatedValue(animValue, {
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg'],
});
```

### useSwipeAnimation

Creates animations for swipe gestures.

**Usage:**
```typescript
import { useSwipeAnimation } from './hooks/useAnimations';

const { swipeAnim, animateSwipe, reset, threshold } = useSwipeAnimation({
  minVelocity: 0.5,
  threshold: 50
});

const handleSwipe = (distance, velocity) => {
  animateSwipe(distance, velocity, () => {
    console.log('Swipe animation complete');
  });
};
```

## Best Practices

1. **Use Native Driver**: Always set `useNativeDriver: true` for performance
   - Supported transforms: scale, translateX, translateY, rotate
   - Not supported: width, height, background-color

2. **Stagger List Animations**: Use `index` and `delay` for visual rhythm
   ```typescript
   <AnimatedListItem index={i} delay={30}>
   ```

3. **Haptic Feedback**: Use appropriate strength levels
   - `light`: Quick interactions (50ms)
   - `medium`: Important actions (100ms)
   - `heavy`: Critical feedback (200ms)

4. **Cleanup**: Always clean up animations in useEffect return
   ```typescript
   useEffect(() => {
     return () => animation.stop();
   }, [animation]);
   ```

5. **Performance**:
   - Use `Animated` for complex animations
   - Use `LayoutAnimation` for layout changes
   - Limit concurrent animations on low-end devices

6. **Duration Guidelines**:
   - Press feedback: 100ms
   - Screen transitions: 300-400ms
   - List item stagger: 30-50ms between items
   - Modal animations: 300ms
   - Loading spinners: 1000-2000ms

## Animation Timing

- **Light gestures**: 50-100ms
- **Medium interactions**: 100-300ms
- **Complex transitions**: 300-500ms
- **Attention-grabbing**: 500-1000ms

## Testing

All components are tested with comprehensive unit tests:
- PressableFeedback: 24 tests
- AnimatedTransitions: 37 tests
- useAnimations hooks: 37 tests

Run tests with:
```bash
npm test -- delivery-app/src/components/__tests__/
npm test -- delivery-app/src/hooks/__tests__/
```

## Migration Guide

If migrating from Reanimated to Animated API:
1. Replace `useSharedValue()` with `useRef(new Animated.Value())`
2. Replace `withTiming()` with `Animated.timing()`
3. Replace `useAnimatedStyle()` with `Animated.View`
4. Update gesture handlers for press feedback

## Resources

- React Native Animated API: https://reactnative.dev/docs/animated
- Easing functions: https://reactnative.dev/docs/easing
- Performance best practices: https://reactnative.dev/docs/performance
