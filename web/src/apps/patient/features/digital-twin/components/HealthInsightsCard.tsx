/**
 * Health Insights Card Component
 * Displays medication adherence, health risk level, and risk factors
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  WarningAmber as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { HealthInsights } from '../types/digitalTwin.types';

interface HealthInsightsCardProps {
  insights: HealthInsights;
}

export function HealthInsightsCard({ insights }: HealthInsightsCardProps): React.ReactElement {
  const {
    medication_adherence_score,
    health_risk_level,
    risk_factors,
    drug_interactions,
    missing_preventive_care,
  } = insights;

  const getRiskColor = (level: string): 'success' | 'warning' | 'error' => {
    if (level === 'low') return 'success';
    if (level === 'moderate') return 'warning';
    return 'error';
  };

  const getAdherenceColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Health Insights
        </Typography>

        {/* Medication Adherence */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Medication Adherence
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {medication_adherence_score}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={medication_adherence_score}
            color={getAdherenceColor(medication_adherence_score)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Health Risk Level */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Overall Health Risk
          </Typography>
          <Chip
            label={health_risk_level.toUpperCase()}
            color={getRiskColor(health_risk_level)}
            icon={
              health_risk_level === 'low' ? (
                <SuccessIcon />
              ) : health_risk_level === 'moderate' ? (
                <InfoIcon />
              ) : (
                <WarningIcon />
              )
            }
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        {/* Risk Factors */}
        {risk_factors.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Risk Factors
            </Typography>
            <Stack spacing={1}>
              {risk_factors.map((factor, index) => (
                <Alert key={index} severity="warning" sx={{ py: 0 }}>
                  {factor}
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        {/* Drug Interactions */}
        {drug_interactions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Drug Interactions
            </Typography>
            <Stack spacing={1}>
              {drug_interactions.map((interaction, index) => (
                <Alert
                  key={index}
                  severity={
                    interaction.severity === 'severe'
                      ? 'error'
                      : interaction.severity === 'moderate'
                      ? 'warning'
                      : 'info'
                  }
                  sx={{ py: 0 }}
                >
                  <Typography variant="caption" fontWeight="bold">
                    {interaction.medication1} + {interaction.medication2}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {interaction.description}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        {/* Missing Preventive Care */}
        {missing_preventive_care.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Recommended Preventive Care
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {missing_preventive_care.map((care, index) => (
                <Chip key={index} label={care} size="small" variant="outlined" />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
