/**
 * AI Transcription Editor Component
 * Editable form for AI-transcribed prescription items with confidence indicators
 * Task: T118 - Implement AI transcription editor
 */

import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  TrendingDown as LowConfidenceIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { PrescriptionItem } from '../../../shared/hooks/usePrescriptions';

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
const createEmptyItem = (): PrescriptionItem => ({
  id: `temp-${Date.now()}`,
  medication_name: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantity: 0,
  confidence_score: undefined,
});

// ============================================================================
// Sub-Component: Prescription Item Editor
// ============================================================================

interface PrescriptionItemEditorProps {
  item: PrescriptionItem;
  index: number;
  onChange: (item: PrescriptionItem) => void;
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
          <TextField
            fullWidth
            label="Medication Name"
            value={item.medication_name}
            onChange={(e) => onChange({ ...item, medication_name: e.target.value })}
            required
            disabled={readonly}
            error={hasLowConfidence && !item.medication_name}
            helperText={
              hasLowConfidence && !item.medication_name
                ? 'Low confidence - verify name'
                : undefined
            }
          />
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
  const [localItems, setLocalItems] = useState<PrescriptionItem[]>(items);

  /**
   * Update item at index
   */
  const handleItemChange = (index: number, updatedItem: PrescriptionItem) => {
    const newItems = [...localItems];
    newItems[index] = updatedItem;
    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  /**
   * Remove item at index
   */
  const handleRemoveItem = (index: number) => {
    const newItems = localItems.filter((_, i) => i !== index);
    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  /**
   * Add new empty item
   */
  const handleAddItem = () => {
    const newItems = [...localItems, createEmptyItem()];
    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  const hasLowConfidence = aiConfidenceScore !== null && aiConfidenceScore !== undefined && aiConfidenceScore < 80;

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
          confidence are highlighted in yellow.
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
            No medications transcribed. Click &quot;Add Medication&quot; to enter prescription details
            manually.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default TranscriptionEditor;
