/**
 * Health Score Card Component
 * Displays overall health score with visual indicators
 */

import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';

interface HealthScoreCardProps {
  score: number;
  riskLevel: string;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score, riskLevel }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Health Score
        </Typography>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress variant="determinate" value={score} size={100} />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h4">{Math.round(score)}</Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Risk Level: {riskLevel.toUpperCase()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default HealthScoreCard;
