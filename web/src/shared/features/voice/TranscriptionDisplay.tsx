/**
 * Transcription Display Component
 * Displays and manages transcription results
 * Shows confidence scores, detected medical terms, and language detection
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Edit,
  Copy,
  Download,
  Check,
  Close,
  Info,
  LocalPharmacy,
  MedicalInformation,
} from '@mui/icons-material';

interface TranscriptionResult {
  id: string;
  recordingId: string;
  text: string;
  confidence: number;
  language: 'fr-CH' | 'de-CH' | 'it-CH' | 'rm-CH';
  detectedLanguage: 'fr-CH' | 'de-CH' | 'it-CH' | 'rm-CH';
  hasDoctor: boolean;
  hasPharmaTerms: boolean;
  keywords: string[];
  status: 'completed' | 'failed';
  processingTime?: number;
  createdAt: string;
}

interface TranscriptionDisplayProps {
  transcription: TranscriptionResult | null;
  isLoading?: boolean;
  onSave?: (text: string, notes: string) => void;
  onError?: (error: Error) => void;
  readOnly?: boolean;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  transcription,
  isLoading = false,
  onSave,
  onError,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [notes, setNotes] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleStartEdit = useCallback(() => {
    if (transcription) {
      setEditedText(transcription.text);
      setEditDialogOpen(true);
    }
  }, [transcription]);

  const handleSaveEdit = useCallback(() => {
    if (onSave && editedText) {
      onSave(editedText, notes);
      setEditDialogOpen(false);
      setIsEditing(false);
    }
  }, [editedText, notes, onSave]);

  const handleCopyText = useCallback(() => {
    if (transcription) {
      navigator.clipboard.writeText(transcription.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [transcription]);

  const handleDownload = useCallback(() => {
    if (transcription) {
      const element = document.createElement('a');
      const file = new Blob([transcription.text], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `transcription-${transcription.id}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  }, [transcription]);

  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Transcribing audio...</Typography>
      </Paper>
    );
  }

  if (!transcription) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography color="textSecondary">No transcription available</Typography>
      </Paper>
    );
  }

  const confidenceColor = transcription.confidence >= 0.9 ? 'success' :
                         transcription.confidence >= 0.7 ? 'warning' : 'error';

  const getLanguageLabel = (lang: string): string => {
    const labels: Record<string, string> = {
      'fr-CH': '🇫🇷 French (Swiss)',
      'de-CH': '🇩🇪 German (Swiss)',
      'it-CH': '🇮🇹 Italian (Swiss)',
      'rm-CH': '🇨🇭 Romansh (Swiss)',
    };
    return labels[lang] || lang;
  };

  return (
    <>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Transcription Result</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!readOnly && (
              <Tooltip title="Edit transcription">
                <IconButton size="small" onClick={handleStartEdit}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={isCopied ? 'Copied!' : 'Copy text'}>
              <IconButton size="small" onClick={handleCopyText}>
                <Copy fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as text file">
              <IconButton size="small" onClick={handleDownload}>
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {transcription.status === 'failed' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Transcription failed. Please try again.
          </Alert>
        )}

        {/* Language and Confidence Info */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent sx={{ pb: 1 }}>
                <Typography color="textSecondary" gutterBottom>
                  Detected Language
                </Typography>
                <Typography variant="h6">
                  {getLanguageLabel(transcription.detectedLanguage)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent sx={{ pb: 1 }}>
                <Typography color="textSecondary" gutterBottom>
                  Confidence Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" color={confidenceColor}>
                    {(transcription.confidence * 100).toFixed(1)}%
                  </Typography>
                  <Tooltip title="Confidence that the transcription is accurate">
                    <Info fontSize="small" color={confidenceColor} />
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Transcribed Text */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Transcribed Text
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: '#f5f5f5',
              minHeight: '100px',
              maxHeight: '300px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.95rem',
              lineHeight: 1.6,
            }}
          >
            <Typography variant="body2">{transcription.text}</Typography>
          </Paper>
        </Box>

        {/* Medical Content Detection */}
        {(transcription.hasDoctor || transcription.hasPharmaTerms) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Medical Content Detected
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {transcription.hasDoctor && (
                <Chip
                  icon={<MedicalInformation />}
                  label="Doctor Terms"
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {transcription.hasPharmaTerms && (
                <Chip
                  icon={<LocalPharmacy />}
                  label="Pharmacy Terms"
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}

        {/* Keywords */}
        {transcription.keywords && transcription.keywords.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Detected Keywords
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {transcription.keywords.map((keyword) => (
                <Chip
                  key={keyword}
                  label={keyword}
                  variant="outlined"
                  size="small"
                  color="default"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Metadata */}
        <Box sx={{ backgroundColor: '#f9f9f9', p: 2, borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            <strong>Transcription ID:</strong> {transcription.id}
            <br />
            <strong>Recording ID:</strong> {transcription.recordingId}
            <br />
            <strong>Processing Time:</strong>{' '}
            {transcription.processingTime ? `${(transcription.processingTime / 1000).toFixed(2)}s` : 'N/A'}
            <br />
            <strong>Created:</strong> {new Date(transcription.createdAt).toLocaleString()}
          </Typography>
        </Box>

        {/* Action Buttons */}
        {!readOnly && onSave && (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="outlined">Cancel</Button>
            <Button variant="contained" color="primary">
              Use This Transcription
            </Button>
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Transcription</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            label="Transcribed Text"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            label="Notes (optional)"
            variant="outlined"
            placeholder="Add any additional notes or corrections..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TranscriptionDisplay;
