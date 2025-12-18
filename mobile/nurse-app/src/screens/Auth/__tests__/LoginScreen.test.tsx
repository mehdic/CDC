/**
 * LoginScreen Tests
 * Unit tests for healthcare credential authentication
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import LoginScreen from '../LoginScreen';
import authReducer from '../../../store/authSlice';

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      patient: (state = {}) => state,
      medication: (state = {}) => state,
    },
  });
};

describe('LoginScreen', () => {
  it('renders login form correctly', () => {
    const store = createMockStore();
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('displays title and subtitle', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    expect(getByText('MetaPharm Nurse')).toBeTruthy();
    expect(getByText('Healthcare Credential Login')).toBeTruthy();
  });

  it('shows HIN e-ID placeholder note', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    expect(getByText('HIN e-ID integration ready (placeholder)')).toBeTruthy();
  });

  it('updates email input when text is entered', () => {
    const store = createMockStore();
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'nurse@example.com');

    expect(emailInput.props.value).toBe('nurse@example.com');
  });

  it('updates password input when text is entered', () => {
    const store = createMockStore();
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('password input is secure text entry', () => {
    const store = createMockStore();
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <LoginScreen />
      </Provider>
    );

    const passwordInput = getByPlaceholderText('Password');
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });
});
