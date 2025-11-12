/**
 * Add Inventory Item Dialog
 * Modal dialog for adding new inventory items with full form validation
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  name: string;
  sku: string;
  gtin: string;
  quantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: Date | null;
  supplier: string;
  location: string;
  reorderThreshold: number;
  notes: string;
  price: number;
  category: string;
}

export function AddItemDialog({ open, onClose, onSave }: AddItemDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    sku: '',
    gtin: '',
    quantity: 0,
    unit: 'tablets',
    batchNumber: '',
    expiryDate: null,
    supplier: '',
    location: '',
    reorderThreshold: 10,
    notes: '',
    price: 0,
    category: '',
  });

  const handleChange = (field: keyof FormData) => (event: any) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      expiryDate: date,
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.sku || formData.quantity <= 0) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medication_name: formData.name,
          medication_gtin: formData.gtin || formData.sku,
          quantity: formData.quantity,
          unit: formData.unit,
          batch_number: formData.batchNumber,
          expiry_date: formData.expiryDate?.toISOString(),
          supplier: formData.supplier,
          storage_location: formData.location,
          reorder_threshold: formData.reorderThreshold,
          notes: formData.notes,
          price: formData.price,
          category: formData.category,
        }),
      });

      if (response.ok) {
        enqueueSnackbar('Item added successfully', { variant: 'success' });
        onSave();
        handleClose();
      } else {
        enqueueSnackbar('Failed to add item', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error adding item:', error);
      enqueueSnackbar('Error adding item', { variant: 'error' });
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: '',
      sku: '',
      gtin: '',
      quantity: 0,
      unit: 'tablets',
      batchNumber: '',
      expiryDate: null,
      supplier: '',
      location: '',
      reorderThreshold: 10,
      notes: '',
      price: 0,
      category: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Inventory Item</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                  inputProps={{ 'aria-label': 'name' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={handleChange('sku')}
                  required
                  inputProps={{ 'aria-label': 'sku' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GTIN / Barcode"
                  value={formData.gtin}
                  onChange={handleChange('gtin')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange('quantity')}
                  required
                  inputProps={{ 'aria-label': 'quantity', min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select value={formData.unit} onChange={handleChange('unit')} label="Unit">
                    <MenuItem value="tablets">Tablets</MenuItem>
                    <MenuItem value="boxes">Boxes</MenuItem>
                    <MenuItem value="bottles">Bottles</MenuItem>
                    <MenuItem value="units">Units</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Batch Number"
                  value={formData.batchNumber}
                  onChange={handleChange('batchNumber')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Expiry Date"
                  value={formData.expiryDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      inputProps: { 'aria-label': 'expiry date' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier"
                  value={formData.supplier}
                  onChange={handleChange('supplier')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Storage Location"
                  value={formData.location}
                  onChange={handleChange('location')}
                  placeholder="e.g., Shelf A3"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reorder Threshold"
                  type="number"
                  value={formData.reorderThreshold}
                  onChange={handleChange('reorderThreshold')}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange('price')}
                  inputProps={{ 'aria-label': 'price', min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={handleChange('category')}
                  inputProps={{ 'aria-label': 'category' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={handleChange('notes')}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
