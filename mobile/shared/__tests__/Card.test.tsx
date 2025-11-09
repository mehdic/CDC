/**
 * Card Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../components/Card';

describe('Card Component', () => {
  it('should render children', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );

    expect(getByText('Card Content')).toBeTruthy();
  });

  it('should render header with title', () => {
    const { getByText } = render(
      <Card headerTitle="Card Title">
        <Text>Content</Text>
      </Card>
    );

    expect(getByText('Card Title')).toBeTruthy();
  });

  it('should render footer', () => {
    const { getByText } = render(
      <Card footer={<Text>Footer Content</Text>}>
        <Text>Content</Text>
      </Card>
    );

    expect(getByText('Footer Content')).toBeTruthy();
  });

  it('should call onPress when card is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Card testID="pressable-card" onPress={onPress}>
        <Text>Pressable Content</Text>
      </Card>
    );

    fireEvent.press(getByTestId('pressable-card'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Card testID="disabled-card" onPress={onPress} disabled>
        <Text>Disabled Content</Text>
      </Card>
    );

    fireEvent.press(getByTestId('disabled-card'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render custom header', () => {
    const customHeader = <Text>Custom Header</Text>;

    const { getByText } = render(
      <Card header={customHeader}>
        <Text>Content</Text>
      </Card>
    );

    expect(getByText('Custom Header')).toBeTruthy();
  });

  it('should render header right content', () => {
    const headerRight = <Text>Right Content</Text>;

    const { getByText } = render(
      <Card headerTitle="Title" headerRight={headerRight}>
        <Text>Content</Text>
      </Card>
    );

    expect(getByText('Right Content')).toBeTruthy();
  });
});
