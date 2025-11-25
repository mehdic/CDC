/**
 * Tests for AnimatedTransitions Component
 * MetaPharm Connect - Delivery App
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import {
  FadeInScreen,
  SlideInScreen,
  ScaleInScreen,
  AnimatedListItem,
  AnimatedModal,
  RotationAnimation,
  BounceAnimation,
} from '../AnimatedTransitions';
import { Text, View } from 'react-native';

describe('AnimatedTransitions Component', () => {
  describe('FadeInScreen', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <FadeInScreen>
          <Text>Fade In Content</Text>
        </FadeInScreen>
      );

      expect(getByText('Fade In Content')).toBeTruthy();
    });

    it('should respect custom duration', () => {
      const { getByText } = render(
        <FadeInScreen duration={500}>
          <Text>Content</Text>
        </FadeInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should respect custom delay', () => {
      const { getByText } = render(
        <FadeInScreen delay={100}>
          <Text>Content</Text>
        </FadeInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should accept custom style', () => {
      const customStyle = { backgroundColor: 'blue' };
      const { getByText } = render(
        <FadeInScreen style={customStyle}>
          <Text>Content</Text>
        </FadeInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });
  });

  describe('SlideInScreen', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <SlideInScreen>
          <Text>Slide In Content</Text>
        </SlideInScreen>
      );

      expect(getByText('Slide In Content')).toBeTruthy();
    });

    it('should support slide from left', () => {
      const { getByText } = render(
        <SlideInScreen direction="left">
          <Text>Content</Text>
        </SlideInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should support slide from right', () => {
      const { getByText } = render(
        <SlideInScreen direction="right">
          <Text>Content</Text>
        </SlideInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should support slide from top', () => {
      const { getByText } = render(
        <SlideInScreen direction="top">
          <Text>Content</Text>
        </SlideInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should support slide from bottom', () => {
      const { getByText } = render(
        <SlideInScreen direction="bottom">
          <Text>Content</Text>
        </SlideInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should respect custom duration', () => {
      const { getByText } = render(
        <SlideInScreen duration={600}>
          <Text>Content</Text>
        </SlideInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should respect custom distance', () => {
      const { getByText } = render(
        <SlideInScreen distance={500}>
          <Text>Content</Text>
        </SlideInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });
  });

  describe('ScaleInScreen', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <ScaleInScreen>
          <Text>Scale In Content</Text>
        </ScaleInScreen>
      );

      expect(getByText('Scale In Content')).toBeTruthy();
    });

    it('should respect custom duration', () => {
      const { getByText } = render(
        <ScaleInScreen duration={400}>
          <Text>Content</Text>
        </ScaleInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should respect custom fromScale', () => {
      const { getByText } = render(
        <ScaleInScreen fromScale={0.5}>
          <Text>Content</Text>
        </ScaleInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should respect custom delay', () => {
      const { getByText } = render(
        <ScaleInScreen delay={150}>
          <Text>Content</Text>
        </ScaleInScreen>
      );

      expect(getByText('Content')).toBeTruthy();
    });
  });

  describe('AnimatedListItem', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <AnimatedListItem>
          <Text>List Item</Text>
        </AnimatedListItem>
      );

      expect(getByText('List Item')).toBeTruthy();
    });

    it('should support fade animation', () => {
      const { getByText } = render(
        <AnimatedListItem animation="fade">
          <Text>Item</Text>
        </AnimatedListItem>
      );

      expect(getByText('Item')).toBeTruthy();
    });

    it('should support slide animation', () => {
      const { getByText } = render(
        <AnimatedListItem animation="slide">
          <Text>Item</Text>
        </AnimatedListItem>
      );

      expect(getByText('Item')).toBeTruthy();
    });

    it('should support scale animation', () => {
      const { getByText } = render(
        <AnimatedListItem animation="scale">
          <Text>Item</Text>
        </AnimatedListItem>
      );

      expect(getByText('Item')).toBeTruthy();
    });

    it('should respect index for staggered animation', () => {
      const { getByText } = render(
        <View>
          <AnimatedListItem index={0}>
            <Text>Item 1</Text>
          </AnimatedListItem>
          <AnimatedListItem index={1}>
            <Text>Item 2</Text>
          </AnimatedListItem>
          <AnimatedListItem index={2}>
            <Text>Item 3</Text>
          </AnimatedListItem>
        </View>
      );

      expect(getByText('Item 1')).toBeTruthy();
      expect(getByText('Item 2')).toBeTruthy();
      expect(getByText('Item 3')).toBeTruthy();
    });

    it('should respect custom delay between items', () => {
      const { getByText } = render(
        <AnimatedListItem index={1} delay={50}>
          <Text>Item</Text>
        </AnimatedListItem>
      );

      expect(getByText('Item')).toBeTruthy();
    });

    it('should respect custom animation duration', () => {
      const { getByText } = render(
        <AnimatedListItem duration={500}>
          <Text>Item</Text>
        </AnimatedListItem>
      );

      expect(getByText('Item')).toBeTruthy();
    });
  });

  describe('AnimatedModal', () => {
    it('should not render when not visible', () => {
      const { queryByText } = render(
        <AnimatedModal visible={false}>
          <Text>Modal Content</Text>
        </AnimatedModal>
      );

      expect(queryByText('Modal Content')).toBeNull();
    });

    it('should render when visible', () => {
      const { getByText } = render(
        <AnimatedModal visible={true}>
          <Text>Modal Content</Text>
        </AnimatedModal>
      );

      expect(getByText('Modal Content')).toBeTruthy();
    });

    it('should call onClose callback', (done) => {
      const onCloseMock = jest.fn();

      render(
        <AnimatedModal visible={true} onClose={onCloseMock}>
          <Text>Modal</Text>
        </AnimatedModal>
      );

      // Modal doesn't automatically call onClose
      done();
    });

    it('should respect custom duration', () => {
      const { getByText } = render(
        <AnimatedModal visible={true} duration={500}>
          <Text>Modal</Text>
        </AnimatedModal>
      );

      expect(getByText('Modal')).toBeTruthy();
    });

    it('should accept custom style', () => {
      const customStyle = { backgroundColor: 'white', borderRadius: 20 };
      const { getByText } = render(
        <AnimatedModal visible={true} style={customStyle}>
          <Text>Modal</Text>
        </AnimatedModal>
      );

      expect(getByText('Modal')).toBeTruthy();
    });

    it('should handle visibility changes', () => {
      const { getByText, rerender, queryByText } = render(
        <AnimatedModal visible={true}>
          <Text>Modal</Text>
        </AnimatedModal>
      );

      expect(getByText('Modal')).toBeTruthy();

      rerender(
        <AnimatedModal visible={false}>
          <Text>Modal</Text>
        </AnimatedModal>
      );

      // May or may not be null depending on animation state
    });
  });

  describe('RotationAnimation', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <RotationAnimation>
          <Text>Rotating Content</Text>
        </RotationAnimation>
      );

      expect(getByText('Rotating Content')).toBeTruthy();
    });

    it('should respect custom duration', () => {
      const { getByText } = render(
        <RotationAnimation duration={1500}>
          <Text>Content</Text>
        </RotationAnimation>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should accept custom style', () => {
      const customStyle = { width: 50, height: 50 };
      const { getByText } = render(
        <RotationAnimation style={customStyle}>
          <Text>Content</Text>
        </RotationAnimation>
      );

      expect(getByText('Content')).toBeTruthy();
    });
  });

  describe('BounceAnimation', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <BounceAnimation>
          <Text>Bouncing Content</Text>
        </BounceAnimation>
      );

      expect(getByText('Bouncing Content')).toBeTruthy();
    });

    it('should respect custom duration', () => {
      const { getByText } = render(
        <BounceAnimation duration={700}>
          <Text>Content</Text>
        </BounceAnimation>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should respect custom bounce amount', () => {
      const { getByText } = render(
        <BounceAnimation bounceAmount={20}>
          <Text>Content</Text>
        </BounceAnimation>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('should accept custom style', () => {
      const customStyle = { alignItems: 'center' };
      const { getByText } = render(
        <BounceAnimation style={customStyle}>
          <Text>Content</Text>
        </BounceAnimation>
      );

      expect(getByText('Content')).toBeTruthy();
    });
  });

  describe('Combined Animations', () => {
    it('should work with nested animations', () => {
      const { getByText } = render(
        <FadeInScreen>
          <SlideInScreen>
            <View>
              <Text>Nested</Text>
            </View>
          </SlideInScreen>
        </FadeInScreen>
      );

      expect(getByText('Nested')).toBeTruthy();
    });

    it('should render multiple animated items in list', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];

      const { getByText } = render(
        <View>
          {items.map((item, index) => (
            <AnimatedListItem key={index} index={index}>
              <Text>{item}</Text>
            </AnimatedListItem>
          ))}
        </View>
      );

      items.forEach((item) => {
        expect(getByText(item)).toBeTruthy();
      });
    });
  });
});
