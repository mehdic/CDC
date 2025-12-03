/**
 * Recommendations Panel Component
 * Displays AI-generated personalized health recommendations
 */

import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import { CheckCircle, LocalHospital, FitnessCenter, Medication, Event } from '@mui/icons-material';

interface Recommendation {
  id: string;
  type: 'medication' | 'lifestyle' | 'screening' | 'follow_up' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  suggestedAction?: string;
  acknowledged: boolean;
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  onRefresh: () => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'medication':
      return <Medication />;
    case 'lifestyle':
      return <FitnessCenter />;
    case 'screening':
      return <LocalHospital />;
    case 'follow_up':
      return <Event />;
    default:
      return <CheckCircle />;
  }
};

const getPriorityColor = (
  priority: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    default:
      return 'success';
  }
};

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  onRefresh,
}) => {
  if (recommendations.length === 0) {
    return (
      <Alert severity="info">
        No recommendations available yet. Click "Generate New Recommendations" to get personalized
        insights based on your health data.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personalized Health Recommendations
      </Typography>
      <List>
        {recommendations.map((rec) => (
          <ListItem
            key={rec.id}
            sx={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 2,
              p: 2,
              backgroundColor: rec.priority === 'urgent' ? 'error.light' : 'background.paper',
              opacity: rec.acknowledged ? 0.7 : 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1, gap: 1 }}>
              {getTypeIcon(rec.type)}
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                {rec.title}
              </Typography>
              <Chip label={rec.priority.toUpperCase()} size="small" color={getPriorityColor(rec.priority)} />
              <Chip label={rec.type.toUpperCase()} size="small" variant="outlined" />
            </Box>

            <Typography variant="body2" sx={{ mb: 1 }}>
              {rec.description}
            </Typography>

            <Box sx={{ backgroundColor: 'grey.100', p: 1, borderRadius: 1, width: '100%', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Why:</strong> {rec.rationale}
              </Typography>
            </Box>

            {rec.suggestedAction && (
              <Box sx={{ backgroundColor: 'primary.light', p: 1, borderRadius: 1, width: '100%' }}>
                <Typography variant="caption">
                  <strong>Suggested Action:</strong> {rec.suggestedAction}
                </Typography>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default RecommendationsPanel;
