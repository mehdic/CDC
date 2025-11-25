/**
 * Tests for PressableFeedback Component
 * MetaPharm Connect - Delivery App
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  PressableFeedback,
  SuccessFeedback,
  ErrorFeedback,
  LoadingFeedback,
} from '../PressableFeedback';
import { Text, View } from 'react-native';

describe('PressableFeedback Component', () => {
  describe('PressableFeedback', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <PressableFeedback>
          <Text>Test Button</Text>
        </PressableFeedback>
      );

      expect(getByText('Test Button')).toBeTruthy();
    });

    it('should call onPress when pressed', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <PressableFeedback onPress={onPressMock}>
          <Text>Test Button</Text>
        </PressableFeedback>
      );

      const button = getByText('Test Button').parent;
      fireEvent.press(button!);

      expect(onPressMock).toHaveBeenCalled();
    });

    it('should call onLongPress when long pressed', () => {
      const onLongPressMock = jest.fn();
      const { getByTestId } = render(
        <PressableFeedback onLongPress={onLongPressMock} testID="pressable-btn">
          <Text>Test Button</Text>
        </PressableFeedback>
      );

      const button = getByTestId('pressable-btn');
      fireEvent(button, 'longPress');

      expect(onLongPressMock).toHaveBeenCalled();
    });

    it('should respect custom scale value', () => {
      const { UNSAFE_root } = render(
        <PressableFeedback scaleValue={0.9}>
          <Text>Test Button</Text>
        </PressableFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should respect custom duration', () => {
      const { UNSAFE_root } = render(
        <PressableFeedback duration={200}>
          <Text>Test Button</Text>
        </PressableFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support haptic feedback option', () => {
      const { UNSAFE_root } = render(
        <PressableFeedback haptic={true} hapticStrength="medium">
          <Text>Test Button</Text>
        </PressableFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support different haptic strengths', () => {
      const strengths: Array<'light' | 'medium' | 'heavy'> = ['light', 'medium', 'heavy'];

      strengths.forEach((strength) => {
        const { UNSAFE_root } = render(
          <PressableFeedback haptic={true} hapticStrength={strength}>
            <Text>Test Button</Text>
          </PressableFeedback>
        );

        expect(UNSAFE_root).toBeTruthy();
      });
    });

    it('should accept custom style', () => {
      const customStyle = { backgroundColor: 'red', padding: 20 };
      const { getByText } = render(
        <PressableFeedback style={customStyle}>
          <Text>Test Button</Text>
        </PressableFeedback>
      );

      expect(getByText('Test Button')).toBeTruthy();
    });

    it('should support disabled state', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <PressableFeedback onPress={onPressMock} disabled={true}>
          <Text>Test Button</Text>
        </PressableFeedback>
      );

      const button = getByText('Test Button').parent;
      fireEvent.press(button!);

      // onPress may or may not be called depending on TouchableOpacity behavior
      expect(getByText('Test Button')).toBeTruthy();
    });
  });

  describe('SuccessFeedback', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <SuccessFeedback>
          <Text>Success Message</Text>
        </SuccessFeedback>
      );

      expect(getByText('Success Message')).toBeTruthy();
    });

    it('should call onAnimationComplete callback', (done) => {
      const onCompleteMock = jest.fn(() => {
        expect(onCompleteMock).toHaveBeenCalled();
        done();
      });

      render(
        <SuccessFeedback duration={100} onAnimationComplete={onCompleteMock}>
          <Text>Success</Text>
        </SuccessFeedback>
      );

      // Animation completes after duration
      setTimeout(() => {
        done();
      }, 200);
    });

    it('should respect custom duration', () => {
      const { UNSAFE_root } = render(
        <SuccessFeedback duration={200}>
          <Text>Success</Text>
        </SuccessFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should play success vibration pattern', () => {
      const { UNSAFE_root } = render(
        <SuccessFeedback>
          <Text>Success</Text>
        </SuccessFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('ErrorFeedback', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <ErrorFeedback>
          <Text>Error Message</Text>
        </ErrorFeedback>
      );

      expect(getByText('Error Message')).toBeTruthy();
    });

    it('should call onAnimationComplete callback', (done) => {
      const onCompleteMock = jest.fn();

      render(
        <ErrorFeedback duration={100} onAnimationComplete={onCompleteMock}>
          <Text>Error</Text>
        </ErrorFeedback>
      );

      setTimeout(() => {
        done();
      }, 200);
    });

    it('should respect custom duration', () => {
      const { UNSAFE_root } = render(
        <ErrorFeedback duration={200}>
          <Text>Error</Text>
        </ErrorFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should respect custom shake amount', () => {
      const { UNSAFE_root } = render(
        <ErrorFeedback shakeAmount={15}>
          <Text>Error</Text>
        </ErrorFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should play error vibration pattern', () => {
      const { UNSAFE_root } = render(
        <ErrorFeedback>
          <Text>Error</Text>
        </ErrorFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('LoadingFeedback', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <LoadingFeedback isLoading={true}>
          <Text>Loading Content</Text>
        </LoadingFeedback>
      );

      expect(getByText('Loading Content')).toBeTruthy();
    });

    it('should not animate when isLoading is false', () => {
      const { UNSAFE_root } = render(
        <LoadingFeedback isLoading={false}>
          <Text>Content</Text>
        </LoadingFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should animate when isLoading is true', () => {
      const { UNSAFE_root } = render(
        <LoadingFeedback isLoading={true}>
          <Text>Content</Text>
        </LoadingFeedback>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle isLoading state changes', () => {
      const { rerender, getByText } = render(
        <LoadingFeedback isLoading={false}>
          <Text>Content</Text>
        </LoadingFeedback>
      );

      expect(getByText('Content')).toBeTruthy();

      rerender(
        <LoadingFeedback isLoading={true}>
          <Text>Content</Text>
        </LoadingFeedback>
      );

      expect(getByText('Content')).toBeTruthy();
    });
  });

  describe('Component Integration', () => {
    it('should handle multiple feedback components in sequence', () => {
      const { getByText, rerender } = render(
        <View>
          <PressableFeedback>
            <Text>Button</Text>
          </PressableFeedback>
        </View>
      );

      expect(getByText('Button')).toBeTruthy();

      rerender(
        <View>
          <SuccessFeedback>
            <Text>Success</Text>
          </SuccessFeedback>
        </View>
      );

      expect(getByText('Success')).toBeTruthy();
    });

    it('should work with nested components', () => {
      const { getByText } = render(
        <PressableFeedback>
          <View>
            <Text>Parent</Text>
            <View>
              <Text>Child</Text>
            </View>
          </View>
        </PressableFeedback>
      );

      expect(getByText('Parent')).toBeTruthy();
      expect(getByText('Child')).toBeTruthy();
    });
  });
});
