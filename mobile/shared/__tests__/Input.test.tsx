/**
 * Input Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../components/Input';

describe('Input Component', () => {
  it('should render with label', () => {
    const { getByText } = render(
      <Input label="Email" value="" onChangeText={() => {}} />
    );

    expect(getByText('Email')).toBeTruthy();
  });

  it('should call onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <Input
        testID="email-input"
        value=""
        onChangeText={onChangeText}
      />
    );

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');

    expect(onChangeText).toHaveBeenCalledWith('test@example.com');
  });

  it('should show error message when touched and error exists', () => {
    const { getByText } = render(
      <Input
        testID="input"
        value=""
        onChangeText={() => {}}
        error="This field is required"
        touched={true}
      />
    );

    expect(getByText('This field is required')).toBeTruthy();
  });

  it('should not show error message when not touched', () => {
    const { queryByText } = render(
      <Input
        testID="input"
        value=""
        onChangeText={() => {}}
        error="This field is required"
        touched={false}
      />
    );

    expect(queryByText('This field is required')).toBeNull();
  });

  it('should toggle password visibility', () => {
    const { getByTestId, getByText } = render(
      <Input
        testID="password-input"
        type="password"
        value="secret"
        onChangeText={() => {}}
      />
    );

    const passwordToggle = getByTestId('password-input-password-toggle');

    // Initially should be hidden (show eye icon)
    expect(getByText('👁️')).toBeTruthy();

    // Toggle to show password
    fireEvent.press(passwordToggle);
    expect(getByText('🙈')).toBeTruthy();

    // Toggle back to hide
    fireEvent.press(passwordToggle);
    expect(getByText('👁️')).toBeTruthy();
  });

  it('should use correct keyboard type for email', () => {
    const { getByTestId } = render(
      <Input
        testID="email-input"
        type="email"
        value=""
        onChangeText={() => {}}
      />
    );

    const input = getByTestId('email-input');
    expect(input.props.keyboardType).toBe('email-address');
  });

  it('should use correct keyboard type for phone', () => {
    const { getByTestId } = render(
      <Input
        testID="phone-input"
        type="phone"
        value=""
        onChangeText={() => {}}
      />
    );

    const input = getByTestId('phone-input');
    expect(input.props.keyboardType).toBe('phone-pad');
  });
});
