import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextField, Select, Checkbox, RadioGroup } from '../index';

describe('Form Components', () => {
  describe('TextField', () => {
    it('renders with label and name', () => {
      render(
        <TextField name="email" label="Email" value="" onChange={jest.fn()} />
      );
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('displays error state', () => {
      render(
        <TextField
          name="email"
          label="Email"
          error={true}
          helperText="Invalid email"
          value=""
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('handles value changes', () => {
      const handleChange = jest.fn();
      render(
        <TextField
          name="email"
          label="Email"
          value=""
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Email');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('displays helper text', () => {
      render(
        <TextField
          name="email"
          label="Email"
          helperText="Enter your email"
          value=""
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Enter your email')).toBeInTheDocument();
    });
  });

  describe('Select', () => {
    const options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3', disabled: true },
    ];

    it('renders with label and options', () => {
      render(
        <Select
          name="status"
          label="Status"
          options={options}
          value=""
          onChange={jest.fn()}
        />
      );
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('displays helper text', () => {
      render(
        <Select
          name="status"
          label="Status"
          options={options}
          helperText="Select a status"
          value=""
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Select a status')).toBeInTheDocument();
    });

    it('displays error state', () => {
      render(
        <Select
          name="status"
          label="Status"
          options={options}
          error={true}
          helperText="Status is required"
          value=""
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Status is required')).toBeInTheDocument();
    });
  });

  describe('Checkbox', () => {
    it('renders with label', () => {
      render(<Checkbox name="terms" label="Accept terms" />);
      expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    });

    it('handles checked state', () => {
      const handleChange = jest.fn();
      render(
        <Checkbox
          name="terms"
          label="Accept terms"
          checked={false}
          onChange={handleChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalled();
    });

    it('displays error state with helper text', () => {
      render(
        <Checkbox
          name="terms"
          label="Accept terms"
          error={true}
          helperText="You must accept terms"
        />
      );
      expect(screen.getByText('You must accept terms')).toBeInTheDocument();
    });
  });

  describe('RadioGroup', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3', disabled: true },
    ];

    it('renders with label and options', () => {
      render(
        <RadioGroup
          name="choice"
          label="Choose one"
          options={options}
          value=""
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Choose one')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    });

    it('handles value changes', () => {
      const handleChange = jest.fn();
      render(
        <RadioGroup
          name="choice"
          label="Choose one"
          options={options}
          value=""
          onChange={handleChange}
        />
      );

      const radio = screen.getByLabelText('Option 1');
      fireEvent.click(radio);
      expect(handleChange).toHaveBeenCalled();
    });

    it('displays error state with helper text', () => {
      render(
        <RadioGroup
          name="choice"
          label="Choose one"
          options={options}
          error={true}
          helperText="Please select an option"
          value=""
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    it('renders in row layout when row prop is true', () => {
      const { container } = render(
        <RadioGroup
          name="choice"
          label="Choose one"
          options={options}
          row={true}
          value=""
          onChange={jest.fn()}
        />
      );
      const radioGroup = container.querySelector('.MuiRadioGroup-row');
      expect(radioGroup).toBeInTheDocument();
    });
  });
});
