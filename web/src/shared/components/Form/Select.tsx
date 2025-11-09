import React from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  SelectProps as MuiSelectProps,
} from '@mui/material';

/**
 * Option for select component
 */
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

/**
 * Custom Select props
 */
export interface SelectProps extends Omit<MuiSelectProps, 'variant'> {
  name: string;
  label: string;
  options: SelectOption[];
  variant?: 'outlined' | 'filled' | 'standard';
  helperText?: string;
  error?: boolean;
  emptyLabel?: string;
}

/**
 * Select component
 * A wrapper around Material-UI Select with consistent styling
 */
export const Select: React.FC<SelectProps> = ({
  name,
  label,
  options,
  variant = 'outlined',
  helperText,
  error = false,
  fullWidth = true,
  margin = 'normal',
  emptyLabel = 'Sélectionner...',
  value,
  ...rest
}) => {
  const labelId = `${name}-label`;

  return (
    <FormControl
      fullWidth={fullWidth}
      margin={margin}
      variant={variant}
      error={error}
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      <MuiSelect
        labelId={labelId}
        id={name}
        name={name}
        label={label}
        value={value || ''}
        {...rest}
      >
        {emptyLabel && (
          <MenuItem value="">
            <em>{emptyLabel}</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default Select;
