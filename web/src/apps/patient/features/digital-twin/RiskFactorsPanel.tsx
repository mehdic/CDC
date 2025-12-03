/**
 * Risk Factors Panel Component
 * Displays identified risk factors with recommendations
 */

import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Typography,
  Alert,
} from '@mui/material';
import { Warning, CheckCircle, Error, Info } from '@mui/icons-material';

interface RiskFactor {
  category: string;
  factor: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  recommendations: string[];
}

interface RiskFactorsPanelProps {
  riskFactors: RiskFactor[];
}

const getRiskIcon = (level: string) => {
  switch (level) {
    case 'critical':
      return <Error color="error" />;
    case 'high':
      return <Warning color="warning" />;
    case 'moderate':
      return <Info color="info" />;
    default:
      return <CheckCircle color="success" />;
  }
};

const getRiskColor = (level: string): 'error' | 'warning' | 'info' | 'success' => {
  switch (level) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'moderate':
      return 'info';
    default:
      return 'success';
  }
};

export const RiskFactorsPanel: React.FC<RiskFactorsPanelProps> = ({ riskFactors }) => {
  if (riskFactors.length === 0) {
    return (
      <Alert severity="success">
        Great news! No significant risk factors identified. Keep up the good work!
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Identified Risk Factors
      </Typography>
      <List>
        {riskFactors.map((factor, index) => (
          <ListItem
            key={index}
            sx={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 2,
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>{getRiskIcon(factor.riskLevel)}</ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {factor.factor}
                    </Typography>
                    <Chip
                      label={factor.riskLevel.toUpperCase()}
                      size="small"
                      color={getRiskColor(factor.riskLevel)}
                    />
                  </Box>
                }
                secondary={factor.description}
              />
            </Box>

            {factor.recommendations.length > 0 && (
              <Box sx={{ ml: 5, mt: 1, width: '100%' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Recommended Actions:
                </Typography>
                <List dense>
                  {factor.recommendations.map((rec, idx) => (
                    <ListItem key={idx} sx={{ pl: 2 }}>
                      <Typography variant="body2">• {rec}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default RiskFactorsPanel;
