/**
 * Button Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/Button';

describe('Button Component', () => {
  it('should render with title', () => {
    const { getByText } = render(<Button title="Test Button" onPress={() => {}} />);

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Press Me" onPress={onPress} />);

    fireEvent.press(getByText('Press Me'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Disabled Button" onPress={onPress} disabled />
    );

    fireEvent.press(getByText('Disabled Button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('should show loading indicator when loading', () => {
    const { getByText, UNSAFE_getByType } = render(
      <Button title="Loading" onPress={() => {}} loading />
    );

    const ActivityIndicator = require('react-native').ActivityIndicator;
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(getByText('Loading')).toBeTruthy();
  });

  it('should render different variants correctly', () => {
    const { rerender, getByText } = render(
      <Button title="Primary" onPress={() => {}} variant="primary" />
    );
    expect(getByText('Primary')).toBeTruthy();

    rerender(<Button title="Secondary" onPress={() => {}} variant="secondary" />);
    expect(getByText('Secondary')).toBeTruthy();

    rerender(<Button title="Danger" onPress={() => {}} variant="danger" />);
    expect(getByText('Danger')).toBeTruthy();
  });

  it('should render with icon on left', () => {
    const Icon = () => <></>;
    const { getByText } = render(
      <Button
        title="With Icon"
        onPress={() => {}}
        icon={<Icon />}
        iconPosition="left"
      />
    );

    expect(getByText('With Icon')).toBeTruthy();
  });

  it('should render with icon on right', () => {
    const Icon = () => <></>;
    const { getByText } = render(
      <Button
        title="With Icon"
        onPress={() => {}}
        icon={<Icon />}
        iconPosition="right"
      />
    );

    expect(getByText('With Icon')).toBeTruthy();
  });
});
