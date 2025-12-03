/**
 * Health Trajectory Chart Component
 * Visualizes health score over time
 */

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface HealthTrajectoryPoint {
  timestamp: string;
  overallHealthScore: number;
  adherenceLevel: string;
  activeMedicationsCount: number;
  activeConditionsCount: number;
}

interface HealthTrajectoryChartProps {
  trajectory: HealthTrajectoryPoint[];
}

export const HealthTrajectoryChart: React.FC<HealthTrajectoryChartProps> = ({ trajectory }) => {
  if (trajectory.length === 0) {
    return (
      <Alert severity="info">
        Your health trajectory will appear here as we collect more data over time. Check back soon!
      </Alert>
    );
  }

  const chartData = trajectory.map((point) => ({
    date: new Date(point.timestamp).toLocaleDateString(),
    score: Math.round(point.overallHealthScore),
    medications: point.activeMedicationsCount,
    conditions: point.activeConditionsCount,
  }));

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Health Score Trajectory
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Track how your overall health score changes over time
      </Typography>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#8884d8"
            strokeWidth={3}
            name="Health Score"
            dot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Data Points: {trajectory.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Latest Score: {Math.round(trajectory[trajectory.length - 1].overallHealthScore)}
        </Typography>
      </Box>
    </Box>
  );
};

export default HealthTrajectoryChart;
