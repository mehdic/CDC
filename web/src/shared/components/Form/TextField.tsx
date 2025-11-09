import React from 'react';
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
} from '@mui/material';

/**
 * Custom TextField props extending Material-UI TextField
 */
export interface TextFieldProps extends Omit<MuiTextFieldProps, 'variant'> {
  name: string;
  label: string;
  variant?: 'outlined' | 'filled' | 'standard';
  helperText?: string;
  error?: boolean;
}

/**
 * TextField component
 * A wrapper around Material-UI TextField with consistent styling
 */
export const TextField: React.FC<TextFieldProps> = ({
  name,
  label,
  variant = 'outlined',
  helperText,
  error = false,
  fullWidth = true,
  margin = 'normal',
  ...rest
}) => {
  return (
    <MuiTextField
      id={name}
      name={name}
      label={label}
      variant={variant}
      helperText={helperText}
      error={error}
      fullWidth={fullWidth}
      margin={margin}
      {...rest}
    />
  );
};

export default TextField;
