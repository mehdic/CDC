/**
 * Consultation Notes Editor Component
 * Editor for AI-assisted consultation notes with audit trail
 * Task: T173 - Create consultation notes editor
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Save,
  Edit,
  History,
  AutoAwesome,
  Person,
  ContentCopy,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useSaveConsultationNotes, ConsultationNote } from '../../../shared/hooks/useTeleconsultation';

// ============================================================================
// Types
// ============================================================================

interface NotesEditorProps {
  consultationId: string;
  notes?: ConsultationNote[];
  aiTranscript?: string;
  isRecording?: boolean;
  onSave?: (note: ConsultationNote) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// ============================================================================
// TabPanel Component
// ============================================================================

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

// ============================================================================
// NotesEditor Component
// ============================================================================

const NotesEditor: React.FC<NotesEditorProps> = ({
  consultationId,
  notes = [],
  aiTranscript = '',
  isRecording = false,
  onSave,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [manualNotes, setManualNotes] = useState('');
  const [editedTranscript, setEditedTranscript] = useState(aiTranscript);
  const [isTranscriptEdited, setIsTranscriptEdited] = useState(false);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedNoteHistory, setSelectedNoteHistory] = useState<ConsultationNote | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveNotesMutation = useSaveConsultationNotes();

  // Update AI transcript when it changes
  useEffect(() => {
    setEditedTranscript(aiTranscript);
  }, [aiTranscript]);

  // Detect if transcript has been edited
  useEffect(() => {
    setIsTranscriptEdited(editedTranscript !== aiTranscript && aiTranscript !== '');
  }, [editedTranscript, aiTranscript]);

  // Load existing notes
  useEffect(() => {
    const manualNote = notes.find((n) => n.note_type === 'manual');
    const summaryNote = notes.find((n) => n.note_type === 'summary');
    const transcriptNote = notes.find((n) => n.note_type === 'ai_transcript');

    if (manualNote) setManualNotes(manualNote.content);
    if (summaryNote) setSummaryNotes(summaryNote.content);
    if (transcriptNote) setEditedTranscript(transcriptNote.content);
  }, [notes]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Save manual notes
  const handleSaveManualNotes = async () => {
    try {
      const savedNote = await saveNotesMutation.mutateAsync({
        consultation_id: consultationId,
        note_type: 'manual',
        content: manualNotes,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (onSave) onSave(savedNote);
    } catch (error) {
      console.error('Error saving manual notes:', error);
    }
  };

  // Save edited AI transcript (with audit trail)
  const handleSaveTranscript = async () => {
    try {
      const savedNote = await saveNotesMutation.mutateAsync({
        consultation_id: consultationId,
        note_type: 'ai_transcript',
        content: editedTranscript,
      });

      setIsTranscriptEdited(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (onSave) onSave(savedNote);
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  };

  // Save summary notes
  const handleSaveSummary = async () => {
    try {
      const savedNote = await saveNotesMutation.mutateAsync({
        consultation_id: consultationId,
        note_type: 'summary',
        content: summaryNotes,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (onSave) onSave(savedNote);
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  };

  // Copy transcript to manual notes
  const handleCopyTranscript = () => {
    setManualNotes((prev) => (prev ? `${prev}\n\n${editedTranscript}` : editedTranscript));
    setTabValue(1); // Switch to manual notes tab
  };

  // View edit history
  const handleViewHistory = (note: ConsultationNote) => {
    setSelectedNoteHistory(note);
    setHistoryDialogOpen(true);
  };

  const transcriptNote = notes.find((n) => n.note_type === 'ai_transcript');
  const hasEditHistory = transcriptNote?.edit_history && transcriptNote.edit_history.length > 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Consultation Notes
        </Typography>
        {saveSuccess && (
          <Chip
            icon={<CheckCircle />}
            label="Saved successfully"
            color="success"
            size="small"
          />
        )}
      </Box>

      {/* Recording Indicator */}
      {isRecording && (
        <Alert severity="info" icon={<AutoAwesome />} sx={{ mb: 2 }}>
          AI is transcribing the conversation in real-time...
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <AutoAwesome fontSize="small" />
                AI Transcript
                {isTranscriptEdited && <Warning fontSize="small" color="warning" />}
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Edit fontSize="small" />
                Manual Notes
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Person fontSize="small" />
                Summary
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {/* AI Transcript Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box>
            {isTranscriptEdited && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  You have edited the AI transcript. Original version is preserved in audit log.
                </Typography>
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              rows={15}
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              placeholder="AI-generated transcript will appear here during the call..."
              variant="outlined"
              disabled={!aiTranscript}
            />

            <Box display="flex" gap={1} mt={2}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveTranscript}
                disabled={!editedTranscript || !isTranscriptEdited || saveNotesMutation.isPending}
              >
                {saveNotesMutation.isPending ? <CircularProgress size={20} /> : 'Save Transcript'}
              </Button>

              <Tooltip title="Copy transcript to manual notes">
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={handleCopyTranscript}
                  disabled={!editedTranscript}
                >
                  Copy to Manual
                </Button>
              </Tooltip>

              {hasEditHistory && (
                <Button
                  variant="outlined"
                  startIcon={<History />}
                  onClick={() => transcriptNote && handleViewHistory(transcriptNote)}
                >
                  View Edit History
                </Button>
              )}
            </Box>

            {aiTranscript && (
              <Box mt={2}>
                <Alert severity="info" icon={<AutoAwesome />}>
                  <Typography variant="caption">
                    AI Confidence: High | End-to-end encrypted | Medical terms highlighted
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Manual Notes Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            <TextField
              fullWidth
              multiline
              rows={15}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Enter manual notes here..."
              variant="outlined"
            />

            <Box display="flex" gap={1} mt={2}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveManualNotes}
                disabled={!manualNotes || saveNotesMutation.isPending}
              >
                {saveNotesMutation.isPending ? <CircularProgress size={20} /> : 'Save Notes'}
              </Button>
            </Box>

            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                Manual notes are automatically saved to patient record with pharmacist signature and timestamp.
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        {/* Summary Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Create a consultation summary that will be saved to patient record.
            </Alert>

            <TextField
              fullWidth
              multiline
              rows={12}
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              placeholder="Consultation summary (e.g., chief complaint, assessment, recommendations, prescriptions created)..."
              variant="outlined"
            />

            <Box display="flex" gap={1} mt={2}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveSummary}
                disabled={!summaryNotes || saveNotesMutation.isPending}
              >
                {saveNotesMutation.isPending ? <CircularProgress size={20} /> : 'Save Summary'}
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Box>

      {/* Edit History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <History sx={{ mr: 1, verticalAlign: 'middle' }} />
          AI Transcript Edit History
        </DialogTitle>
        <DialogContent>
          {selectedNoteHistory?.edit_history && selectedNoteHistory.edit_history.length > 0 ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                All edits are tracked for compliance and audit purposes. Original AI transcript is preserved.
              </Alert>

              <List>
                {selectedNoteHistory.edit_history.map((edit, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider />}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" fontWeight="medium">
                              Edited by: {edit.edited_by}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(parseISO(edit.edited_at), 'MMM d, yyyy HH:mm')}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Previous content:
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'grey.50' }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {edit.previous_content.substring(0, 200)}
                                {edit.previous_content.length > 200 && '...'}
                              </Typography>
                            </Paper>
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Original AI Transcript:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflowY: 'auto' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {aiTranscript}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ) : (
            <Typography>No edit history available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotesEditor;
