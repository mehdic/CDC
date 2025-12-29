/**
 * AI Transcription Editor Component
 * Editable form for AI-transcribed prescription items with confidence indicators
 * Task: T118 - Implement AI transcription editor
 * Task: Medication Autocomplete Feature
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  IconButton,
  Button,
  Stack,
  Chip,
  Tooltip,
  Alert,
  Divider,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  TrendingDown as LowConfidenceIcon,
  Image as ImageIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { PrescriptionItem } from '../../../shared/hooks/usePrescriptions';
import {
  searchProducts,
  ProductSearchResult,
  getStockStatusLabel,
  getStockStatusColor,
} from '../services/productService';

// ============================================================================
// Types
// ============================================================================

export interface TranscriptionEditorProps {
  items: PrescriptionItem[];
  imageUrl?: string | null;
  aiConfidenceScore?: number | null;
  onItemsChange: (items: PrescriptionItem[]) => void;
  readonly?: boolean;
}

interface ExtendedPrescriptionItem extends PrescriptionItem {
  selected_product?: ProductSearchResult | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get confidence color based on score
 */
const getConfidenceColor = (score?: number): 'error' | 'warning' | 'success' => {
  if (!score) return 'warning';
  if (score < 60) return 'error';
  if (score < 80) return 'warning';
  return 'success';
};

/**
 * Get confidence icon
 */
const getConfidenceIcon = (score?: number): React.ReactElement => {
  if (!score) return <WarningIcon />;
  if (score < 80) return <LowConfidenceIcon />;
  return <CheckIcon />;
};

/**
 * Create empty prescription item
 */
const createEmptyItem = (): ExtendedPrescriptionItem => ({
  id: `temp-${Date.now()}`,
  medication_name: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantity: 0,
  confidence_score: undefined,
  selected_product: null,
});

// ============================================================================
// Sub-Component: Medication Autocomplete
// ============================================================================

interface MedicationAutocompleteProps {
  value: string;
  selectedProduct: ProductSearchResult | null;
  onChange: (name: string, product: ProductSearchResult | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const MedicationAutocomplete: React.FC<MedicationAutocompleteProps> = ({
  value,
  selectedProduct,
  onChange,
  disabled = false,
  error = false,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search effect
  useEffect(() => {
    let active = true;

    if (inputValue.length < 2) {
      setOptions([]);
      return undefined;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const results = await searchProducts(inputValue, 15);
        if (active) {
          setOptions(results);
        }
      } catch (err) {
        console.error('Failed to search products:', err);
        if (active) {
          setOptions([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchProducts, 300);

    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [inputValue]);

  return (
    <Box>
      <Autocomplete<ProductSearchResult, false, boolean, true>
        freeSolo
        value={selectedProduct}
        inputValue={inputValue}
        onInputChange={(_event, newInputValue) => {
          setInputValue(newInputValue);
          // If user is typing (not selecting), update medication name
          if (!selectedProduct || newInputValue !== selectedProduct.name) {
            onChange(newInputValue, null);
          }
        }}
        onChange={(_event, newValue) => {
          if (typeof newValue === 'string') {
            // User typed a custom value
            onChange(newValue, null);
          } else if (newValue) {
            // User selected a product
            onChange(newValue.name, newValue);
            setInputValue(newValue.name);
          } else {
            // Cleared
            onChange('', null);
          }
        }}
        options={options}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.name;
        }}
        isOptionEqualToValue={(option, val) => option.id === val?.id}
        loading={loading}
        disabled={disabled}
        filterOptions={(x) => x} // Disable built-in filtering since we're doing server-side search
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" fontWeight="medium">
                  {option.name}
                </Typography>
                <Chip
                  size="small"
                  label={getStockStatusLabel(option.stock_status)}
                  color={getStockStatusColor(option.stock_status)}
                  sx={{ ml: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {option.manufacturer}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  SKU: {option.sku}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stock: {option.stock}
                </Typography>
                {option.requires_prescription && (
                  <Typography variant="caption" color="warning.main">
                    Ordonnance requise
                  </Typography>
                )}
              </Box>
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Medication Name"
            required
            error={error}
            helperText={helperText}
            placeholder="Start typing to search medications..."
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText={
          inputValue.length < 2
            ? 'Type at least 2 characters to search'
            : 'No medications found'
        }
      />

      {/* Stock availability display when product is selected */}
      {selectedProduct && (
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 1,
            bgcolor: selectedProduct.stock_status === 'out_of_stock' ? 'error.lighter' : 'grey.50',
            border: '1px solid',
            borderColor: selectedProduct.stock_status === 'out_of_stock' ? 'error.main' : 'grey.300',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <InventoryIcon
              color={selectedProduct.stock_status === 'out_of_stock' ? 'error' : 'action'}
              fontSize="small"
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                Stock Information
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Available: <strong>{selectedProduct.stock}</strong> units
                </Typography>
                <Chip
                  size="small"
                  label={getStockStatusLabel(selectedProduct.stock_status)}
                  color={getStockStatusColor(selectedProduct.stock_status)}
                />
                <Typography variant="caption" color="text.secondary">
                  Price: CHF {selectedProduct.price.toFixed(2)}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          {selectedProduct.stock_status === 'out_of_stock' && (
            <Alert severity="error" sx={{ mt: 1 }} icon={<WarningIcon fontSize="small" />}>
              <Typography variant="caption">
                This medication is out of stock. Consider an alternative or contact supplier.
              </Typography>
            </Alert>
          )}
          {selectedProduct.stock_status === 'low_stock' && (
            <Alert severity="warning" sx={{ mt: 1 }} icon={<WarningIcon fontSize="small" />}>
              <Typography variant="caption">
                Low stock warning. Only {selectedProduct.stock} units remaining.
              </Typography>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
// Sub-Component: Prescription Item Editor
// ============================================================================

interface PrescriptionItemEditorProps {
  item: ExtendedPrescriptionItem;
  index: number;
  onChange: (item: ExtendedPrescriptionItem) => void;
  onRemove: () => void;
  readonly?: boolean;
}

const PrescriptionItemEditor: React.FC<PrescriptionItemEditorProps> = ({
  item,
  index,
  onChange,
  onRemove,
  readonly = false,
}) => {
  const hasLowConfidence = item.confidence_score !== undefined && item.confidence_score < 80;

  const handleMedicationChange = useCallback(
    (name: string, product: ProductSearchResult | null) => {
      onChange({
        ...item,
        medication_name: name,
        selected_product: product,
      });
    },
    [item, onChange]
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        border: hasLowConfidence ? '2px solid' : '1px solid',
        borderColor: hasLowConfidence ? 'warning.main' : 'divider',
        backgroundColor: hasLowConfidence ? 'warning.lighter' : 'background.paper',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle1" fontWeight="bold">
            Medication #{index + 1}
          </Typography>
          {item.confidence_score !== undefined && (
            <Tooltip title={`AI Confidence: ${item.confidence_score}%`}>
              <Chip
                icon={getConfidenceIcon(item.confidence_score)}
                label={`${item.confidence_score}%`}
                size="small"
                color={getConfidenceColor(item.confidence_score)}
              />
            </Tooltip>
          )}
        </Stack>
        {!readonly && (
          <IconButton size="small" color="error" onClick={onRemove}>
            <DeleteIcon />
          </IconButton>
        )}
      </Stack>

      {hasLowConfidence && (
        <Alert severity="warning" icon={<LowConfidenceIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2">
            Low AI confidence detected. Please verify this medication information carefully.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          {readonly ? (
            <TextField
              fullWidth
              label="Medication Name"
              value={item.medication_name}
              required
              disabled
              error={hasLowConfidence && !item.medication_name}
              helperText={
                hasLowConfidence && !item.medication_name
                  ? 'Low confidence - verify name'
                  : undefined
              }
            />
          ) : (
            <MedicationAutocomplete
              value={item.medication_name}
              selectedProduct={item.selected_product || null}
              onChange={handleMedicationChange}
              disabled={readonly}
              error={hasLowConfidence && !item.medication_name}
              helperText={
                hasLowConfidence && !item.medication_name
                  ? 'Low confidence - verify name'
                  : undefined
              }
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Dosage"
            value={item.dosage}
            onChange={(e) => onChange({ ...item, dosage: e.target.value })}
            required
            disabled={readonly}
            placeholder="e.g., 500mg, 10ml"
            error={hasLowConfidence && !item.dosage}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Frequency"
            value={item.frequency}
            onChange={(e) => onChange({ ...item, frequency: e.target.value })}
            required
            disabled={readonly}
            placeholder="e.g., Twice daily, Every 8 hours"
            error={hasLowConfidence && !item.frequency}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Duration"
            value={item.duration}
            onChange={(e) => onChange({ ...item, duration: e.target.value })}
            required
            disabled={readonly}
            placeholder="e.g., 7 days, 2 weeks"
            error={hasLowConfidence && !item.duration}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={item.quantity || ''}
            onChange={(e) => onChange({ ...item, quantity: parseInt(e.target.value) || 0 })}
            required
            disabled={readonly}
            error={hasLowConfidence && !item.quantity}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TranscriptionEditor: React.FC<TranscriptionEditorProps> = ({
  items,
  imageUrl,
  aiConfidenceScore,
  onItemsChange,
  readonly = false,
}) => {
  const [localItems, setLocalItems] = useState<ExtendedPrescriptionItem[]>(
    items.map((item) => ({ ...item, selected_product: null }))
  );

  /**
   * Update item at index
   */
  const handleItemChange = useCallback(
    (index: number, updatedItem: ExtendedPrescriptionItem) => {
      const newItems = [...localItems];
      newItems[index] = updatedItem;
      setLocalItems(newItems);
      // Strip extended properties before passing to parent
      const cleanItems: PrescriptionItem[] = newItems.map(
        ({ selected_product: _selected_product, ...rest }) => rest
      );
      onItemsChange(cleanItems);
    },
    [localItems, onItemsChange]
  );

  /**
   * Remove item at index
   */
  const handleRemoveItem = useCallback(
    (index: number) => {
      const newItems = localItems.filter((_, i) => i !== index);
      setLocalItems(newItems);
      const cleanItems: PrescriptionItem[] = newItems.map(
        ({ selected_product: _selected_product, ...rest }) => rest
      );
      onItemsChange(cleanItems);
    },
    [localItems, onItemsChange]
  );

  /**
   * Add new empty item
   */
  const handleAddItem = useCallback(() => {
    const newItems = [...localItems, createEmptyItem()];
    setLocalItems(newItems);
    const cleanItems: PrescriptionItem[] = newItems.map(
      ({ selected_product: _selected_product, ...rest }) => rest
    );
    onItemsChange(cleanItems);
  }, [localItems, onItemsChange]);

  const hasLowConfidence =
    aiConfidenceScore !== null && aiConfidenceScore !== undefined && aiConfidenceScore < 80;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            AI Transcription
          </Typography>
          {aiConfidenceScore !== null && aiConfidenceScore !== undefined && (
            <Tooltip title="Overall AI Confidence Score">
              <Chip
                icon={getConfidenceIcon(aiConfidenceScore)}
                label={`Overall: ${aiConfidenceScore}%`}
                size="medium"
                color={getConfidenceColor(aiConfidenceScore)}
              />
            </Tooltip>
          )}
        </Stack>

        {hasLowConfidence && (
          <Alert severity="warning" icon={<LowConfidenceIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Low AI Confidence Detected
            </Typography>
            <Typography variant="body2">
              The AI transcription has low confidence. Please carefully review and verify all
              medication details before approval.
            </Typography>
          </Alert>
        )}

        {imageUrl && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              href={imageUrl}
              target="_blank"
              size="small"
            >
              View Original Prescription Image
            </Button>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary">
          Review and edit the AI-transcribed medication information below. Fields with low
          confidence are highlighted in yellow. Start typing medication names to search inventory.
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Prescription Items */}
      {localItems.map((item, index) => (
        <PrescriptionItemEditor
          key={item.id}
          item={item}
          index={index}
          onChange={(updatedItem) => handleItemChange(index, updatedItem)}
          onRemove={() => handleRemoveItem(index)}
          readonly={readonly}
        />
      ))}

      {/* Add Item Button */}
      {!readonly && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddItem}
          fullWidth
          sx={{ mt: 2 }}
        >
          Add Medication
        </Button>
      )}

      {localItems.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            No medications transcribed. Click "Add Medication" to enter prescription details
            manually.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default TranscriptionEditor;
