/**
 * What-If Scenarios Component
 * Interactive health scenario modeling
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  List,
  ListItem,
  Typography,
  Alert,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, TrendingUp, TrendingDown } from '@mui/icons-material';
import { digitalTwinService } from '../../../../shared/services/digitalTwinService';

interface WhatIfScenario {
  id: string;
  scenario: string;
  description: string;
  predictedOutcome: string;
  riskChange: number;
  healthScoreChange: number;
  generatedAt: string;
}

interface WhatIfScenariosProps {
  patientId: string;
  scenarios: WhatIfScenario[];
  onRefresh: () => void;
}

export const WhatIfScenarios: React.FC<WhatIfScenariosProps> = ({
  patientId,
  scenarios,
  onRefresh,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scenario, setScenario] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setScenario('');
    setDescription('');
    setError(null);
  };

  const handleCreateScenario = async () => {
    if (!scenario.trim() || !description.trim()) {
      setError('Please fill in both fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await digitalTwinService.createWhatIfScenario(patientId, {
        scenario: scenario.trim(),
        description: description.trim(),
      });
      handleCloseDialog();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">What-If Health Scenarios</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog}>
          Create Scenario
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Explore how different lifestyle changes or interventions could impact your health. Our AI
        will predict outcomes based on your unique health profile.
      </Alert>

      {scenarios.length === 0 ? (
        <Alert severity="info">
          No scenarios created yet. Click "Create Scenario" to explore potential health outcomes.
        </Alert>
      ) : (
        <List>
          {scenarios.map((scenario) => (
            <ListItem key={scenario.id} sx={{ p: 0, mb: 2 }}>
              <Card sx={{ width: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">{scenario.scenario}</Typography>
                    <Box>
                      {scenario.riskChange < 0 && (
                        <Chip
                          icon={<TrendingDown />}
                          label={`${Math.abs(scenario.riskChange)}% Risk ↓`}
                          color="success"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      )}
                      {scenario.riskChange > 0 && (
                        <Chip
                          icon={<TrendingUp />}
                          label={`${scenario.riskChange}% Risk ↑`}
                          color="error"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      )}
                      {scenario.healthScoreChange > 0 && (
                        <Chip
                          icon={<TrendingUp />}
                          label={`+${scenario.healthScoreChange} Health Score`}
                          color="success"
                          size="small"
                        />
                      )}
                      {scenario.healthScoreChange < 0 && (
                        <Chip
                          icon={<TrendingDown />}
                          label={`${scenario.healthScoreChange} Health Score`}
                          color="error"
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {scenario.description}
                  </Typography>

                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: 'primary.light',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Predicted Outcome:
                    </Typography>
                    <Typography variant="body2">{scenario.predictedOutcome}</Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Generated: {new Date(scenario.generatedAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      )}

      {/* Create Scenario Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create What-If Scenario</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Scenario Title"
              placeholder="e.g., Improve medication adherence to 95%"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              placeholder="Describe the change you want to explore..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateScenario} variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Scenario'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatIfScenarios;
