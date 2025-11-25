/**
 * Login Screen Tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import LoginScreen from '../../src/screens/Auth/LoginScreen';
import authReducer from '../../src/store/authSlice';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Create mock store
const createMockStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
  });

describe('LoginScreen', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    expect(getByText('MetaPharm Delivery')).toBeTruthy();
    expect(getByText('Delivery Personnel Login')).toBeTruthy();
    expect(getByPlaceholderText('delivery@metapharm.ch')).toBeTruthy();
    expect(getByPlaceholderText('Enter password')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByTestId('hin-eid-button')).toBeTruthy();
  });

  it('should validate empty fields', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    const loginButton = getByTestId('login-button');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please enter email and password'
      );
    });
  });

  it('should update email input', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    const emailInput = getByTestId('email-input');
    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should update password input', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    const passwordInput = getByTestId('password-input');
    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('should show HIN e-ID alert on button press', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    const hinButton = getByTestId('hin-eid-button');
    fireEvent.press(hinButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'HIN e-ID Authentication',
        expect.any(String),
        expect.any(Array)
      );
    });
  });
});
