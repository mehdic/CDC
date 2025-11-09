import React from 'react';
import {
  FormControlLabel,
  Checkbox as MuiCheckbox,
  CheckboxProps as MuiCheckboxProps,
  FormHelperText,
  FormControl,
} from '@mui/material';

/**
 * Custom Checkbox props
 */
export interface CheckboxProps extends Omit<MuiCheckboxProps, 'name'> {
  name: string;
  label: string;
  helperText?: string;
  error?: boolean;
}

/**
 * Checkbox component
 * A wrapper around Material-UI Checkbox with consistent styling
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  name,
  label,
  helperText,
  error = false,
  ...rest
}) => {
  return (
    <FormControl error={error} component="fieldset">
      <FormControlLabel
        control={
          <MuiCheckbox
            id={name}
            name={name}
            color="primary"
            {...rest}
          />
        }
        label={label}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default Checkbox;
