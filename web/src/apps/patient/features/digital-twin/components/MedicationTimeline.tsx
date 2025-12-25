/**
 * Medication Timeline Component
 * Displays current and past medications with adherence scores
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Medication as MedicationIcon,
  CheckCircle as ActiveIcon,
  Block as InactiveIcon,
} from '@mui/icons-material';
import type { CurrentMedication, PastMedication } from '../types/digitalTwin.types';

interface MedicationTimelineProps {
  currentMedications: CurrentMedication[];
  pastMedications: PastMedication[];
}

export function MedicationTimeline({
  currentMedications,
  pastMedications,
}: MedicationTimelineProps): React.ReactElement {
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MedicationIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Medication Timeline</Typography>
        </Box>

        {/* Current Medications */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Current Medications ({currentMedications.length})
        </Typography>
        {currentMedications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            No current medications
          </Typography>
        ) : (
          <List>
            {currentMedications.map((med, index) => (
              <React.Fragment key={med.rxnorm_code}>
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                    <ActiveIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                    <ListItemText
                      primary={med.medication_name}
                      secondary={`${med.dosage} • ${med.frequency}`}
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                    <Chip
                      label={`${med.adherence_score}% adherence`}
                      color={med.adherence_score >= 80 ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={med.adherence_score}
                      color={med.adherence_score >= 80 ? 'success' : 'warning'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="caption" color="text.secondary">
                      Started: {formatDate(med.start_date)}
                    </Typography>
                    {med.next_refill_due && (
                      <Typography variant="caption" color="text.secondary">
                        Next refill: {formatDate(med.next_refill_due)}
                      </Typography>
                    )}
                  </Box>
                </ListItem>
                {index < currentMedications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Past Medications */}
        {pastMedications.length > 0 && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>
              Past Medications ({pastMedications.length})
            </Typography>
            <List>
              {pastMedications.map((med, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ py: 1 }}>
                    <InactiveIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <ListItemText
                      primary={med.medication_name}
                      secondary={`Discontinued ${formatDate(med.discontinued_date)} • ${med.reason}`}
                      primaryTypographyProps={{ color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  {index < pastMedications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </CardContent>
    </Card>
  );
}
