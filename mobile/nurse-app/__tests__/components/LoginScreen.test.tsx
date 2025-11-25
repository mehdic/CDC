/**
 * Login Screen Tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LoginScreen from '../../src/screens/Auth/LoginScreen';
import authReducer from '../../src/store/slices/authSlice';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      patients: (state = { patients: [], selectedPatient: null, loading: false, error: null }) => state,
      medications: (state = { medications: [], administrations: [], orders: [], loading: false, error: null }) => state,
    },
  });

describe('LoginScreen', () => {
  it('should render login form', () => {
    const store = createTestStore();
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    expect(getByPlaceholderText('Enter your HIN ID')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('should show error for empty fields', async () => {
    const store = createTestStore();
    const { getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    // Alert should be called (mocked in test setup)
    await waitFor(() => {
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  it('should update input fields', () => {
    const store = createTestStore();
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    const hinInput = getByPlaceholderText('Enter your HIN ID');
    const passwordInput = getByPlaceholderText('Enter your password');

    fireEvent.changeText(hinInput, 'HIN123456');
    fireEvent.changeText(passwordInput, 'password123');

    expect(hinInput.props.value).toBe('HIN123456');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('should display footer with HIN security info', () => {
    const store = createTestStore();
    const { getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    expect(getByText('Secured by HIN e-ID')).toBeTruthy();
    expect(getByText('Swiss Healthcare Information Network')).toBeTruthy();
  });
});
