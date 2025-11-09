import React from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup as MuiRadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  RadioGroupProps as MuiRadioGroupProps,
} from '@mui/material';

/**
 * Radio option
 */
export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

/**
 * Custom RadioGroup props
 */
export interface RadioGroupProps extends Omit<MuiRadioGroupProps, 'name'> {
  name: string;
  label: string;
  options: RadioOption[];
  helperText?: string;
  error?: boolean;
  row?: boolean;
}

/**
 * RadioGroup component
 * A wrapper around Material-UI RadioGroup with consistent styling
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  helperText,
  error = false,
  row = false,
  ...rest
}) => {
  return (
    <FormControl component="fieldset" error={error} margin="normal">
      <FormLabel component="legend" id={`${name}-label`}>
        {label}
      </FormLabel>
      <MuiRadioGroup
        aria-labelledby={`${name}-label`}
        name={name}
        row={row}
        {...rest}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
            disabled={option.disabled}
          />
        ))}
      </MuiRadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default RadioGroup;
