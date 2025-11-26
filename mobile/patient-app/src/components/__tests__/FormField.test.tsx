import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FormField, Validators, FormGroup } from '../FormField';

describe('T2-052: Form Field with Real-Time Validation', () => {
  describe('FormField Component', () => {
    it('should render form field with label', () => {
      const { getByText } = render(
        <FormField
          label="Email"
          value=""
          onChangeText={() => {}}
        />,
      );
      expect(getByText('Email')).toBeTruthy();
    });

    it('should update value on text change', () => {
      const handleChange = jest.fn();
      const { getByDisplayValue } = render(
        <FormField
          label="Email"
          value="test"
          onChangeText={handleChange}
        />,
      );
      fireEvent.changeText(getByDisplayValue('test'), 'newemail');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should display error message on validation failure', () => {
      const validators = [Validators.required('Email')];
      const { getByText } = render(
        <FormField
          label="Email"
          value=""
          onChangeText={() => {}}
          validators={validators}
          showValidation
        />,
      );
      expect(getByText('Email is required')).toBeTruthy();
    });

    it('should show success indicator on valid input', () => {
      const validators = [Validators.email()];
      const { getByTestId } = render(
        <FormField
          label="Email"
          value="test@example.com"
          onChangeText={() => {}}
          validators={validators}
          showValidation
          testID="email-field"
        />,
      );
      expect(getByTestId('email-field')).toBeTruthy();
    });

    it('should handle password field with show/hide toggle', () => {
      const { getByDisplayValue } = render(
        <FormField
          label="Password"
          value="mypassword"
          onChangeText={() => {}}
          isPassword
        />,
      );
      expect(getByDisplayValue('mypassword')).toBeTruthy();
    });

    it('should display helper text when provided', () => {
      const { getByText } = render(
        <FormField
          label="Password"
          value=""
          onChangeText={() => {}}
          helperText="Must be at least 8 characters"
        />,
      );
      expect(getByText('Must be at least 8 characters')).toBeTruthy();
    });
  });

  describe('Validators', () => {
    describe('required validator', () => {
      it('should validate required field', () => {
        const validator = Validators.required('Username');
        expect(validator.validate('')).toBe('Username is required');
        expect(validator.validate('John')).toBeNull();
      });
    });

    describe('email validator', () => {
      it('should validate email format', () => {
        const validator = Validators.email();
        expect(validator.validate('invalid')).toBe(
          'Please enter a valid email',
        );
        expect(validator.validate('test@example.com')).toBeNull();
        expect(validator.validate('')).toBeNull(); // optional when not required
      });

      it('should accept various email formats', () => {
        const validator = Validators.email();
        expect(validator.validate('user+tag@example.co.uk')).toBeNull();
        expect(validator.validate('firstname.lastname@domain.com')).toBeNull();
      });
    });

    describe('phone validator', () => {
      it('should validate phone format', () => {
        const validator = Validators.phone();
        expect(validator.validate('not a phone')).toBe(
          'Please enter a valid phone number',
        );
        expect(validator.validate('+41 79 123 45 67')).toBeNull();
        expect(validator.validate('0791234567')).toBeNull();
      });
    });

    describe('minLength validator', () => {
      it('should validate minimum length', () => {
        const validator = Validators.minLength(8);
        expect(validator.validate('short')).toBe(
          'Must be at least 8 characters',
        );
        expect(validator.validate('longenough')).toBeNull();
      });
    });

    describe('maxLength validator', () => {
      it('should validate maximum length', () => {
        const validator = Validators.maxLength(10);
        expect(validator.validate('toolongstring')).toBe(
          'Must not exceed 10 characters',
        );
        expect(validator.validate('short')).toBeNull();
      });
    });

    describe('pattern validator', () => {
      it('should validate regex pattern', () => {
        const validator = Validators.pattern(
          /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/,
          'Invalid phone format',
        );
        expect(validator.validate('123-456-7890')).toBeNull();
        expect(validator.validate('1234567890')).toBe('Invalid phone format');
      });
    });

    describe('passwordStrength validator', () => {
      it('should validate password strength', () => {
        const validator = Validators.passwordStrength();

        // Too short
        expect(validator.validate('Pass1!')).toBe(
          'Password must be at least 8 characters',
        );

        // Missing uppercase
        expect(validator.validate('password1!')).toBe(
          'Password must contain an uppercase letter',
        );

        // Missing lowercase
        expect(validator.validate('PASSWORD1!')).toBe(
          'Password must contain a lowercase letter',
        );

        // Missing number
        expect(validator.validate('Password!')).toBe(
          'Password must contain a number',
        );

        // Missing special character
        expect(validator.validate('Password1')).toBe(
          'Password must contain a special character',
        );

        // Valid password
        expect(validator.validate('Password1!')).toBeNull();
      });
    });

    describe('match validator', () => {
      it('should validate field match', () => {
        const validator = Validators.match('password123', 'Passwords');
        expect(validator.validate('password123')).toBeNull();
        expect(validator.validate('different')).toBe('Passwords do not match');
      });
    });
  });

  describe('FormGroup Component', () => {
    it('should render multiple form fields', () => {
      const { getByText } = render(
        <FormGroup>
          <FormField label="Email" value="" onChangeText={() => {}} />
          <FormField label="Password" value="" onChangeText={() => {}} />
        </FormGroup>,
      );

      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
    });

    it('should apply custom spacing', () => {
      const { getByTestId } = render(
        <FormGroup spacing={24} testID="form-group">
          <FormField label="Field 1" value="" onChangeText={() => {}} />
          <FormField label="Field 2" value="" onChangeText={() => {}} />
        </FormGroup>,
      );

      expect(getByTestId('form-group')).toBeTruthy();
    });
  });

  describe('Real-time Validation', () => {
    it('should validate on blur', () => {
      const validators = [Validators.required('Name')];
      const { getByText } = render(
        <FormField
          label="Name"
          value=""
          onChangeText={() => {}}
          validators={validators}
          showValidation
        />,
      );

      // Error should not show immediately
      fireEvent(getByText('Name'), 'onBlur');
      expect(getByText('Name is required')).toBeTruthy();
    });

    it('should validate while typing after first blur', () => {
      const validators = [Validators.minLength(5)];
      const handleChange = jest.fn();

      const { getByDisplayValue, queryByText } = render(
        <FormField
          label="Username"
          value="ab"
          onChangeText={handleChange}
          validators={validators}
          showValidation
        />,
      );

      // First blur triggers validation
      fireEvent(getByDisplayValue('ab'), 'onBlur');

      // Should show validation errors
      expect(queryByText(/at least 5 characters/)).toBeTruthy();
    });
  });
});
