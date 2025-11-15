/**
 * Popular Medications Widget
 * Displays chart of most prescribed medications
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material';
import { MedicalServices as MedIcon } from '@mui/icons-material';
import { usePopularMedications } from '@shared/hooks/useDashboardAnalytics';

export const PopularMedicationsWidget: React.FC = () => {
  const { data: response, isLoading, error } = usePopularMedications();
  const medications = response?.data;

  if (isLoading) {
    return (
      <Card data-testid="popular-medications-chart">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="popular-medications-chart">
        <CardContent>
          <Alert severity="error">
            Erreur lors du chargement des médicaments populaires
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const maxCount = medications ? Math.max(...medications.map((m) => m.count), 1) : 1;

  return (
    <Card data-testid="popular-medications-chart">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MedIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">
            Médicaments Populaires
          </Typography>
        </Box>

        {!medications || medications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Aucune donnée disponible
          </Typography>
        ) : (
          <List>
            {medications.map((medication, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {medication.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {medication.count}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <LinearProgress
                      variant="determinate"
                      value={(medication.count / maxCount) * 100}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
