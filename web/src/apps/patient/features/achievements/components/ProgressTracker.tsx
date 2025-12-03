/**
 * Progress Tracker Component
 * Displays visual progress for in-progress achievements
 * Task: T6-021
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  LinearProgress,
  Chip,
  Grid,
} from '@mui/material';
import { Achievement, PatientAchievement } from '../types/achievement.types';

interface ProgressTrackerProps {
  achievements: Achievement[];
  patientAchievements: PatientAchievement[];
  loading?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  achievements,
  patientAchievements,
  loading = false,
}) => {
  // Filter for in-progress achievements
  const inProgressAchievements = patientAchievements
    .filter((pa) => !pa.isLocked && pa.progress < 100)
    .map((pa) => ({
      ...pa,
      achievement: achievements.find((a) => a.achievementId === pa.achievementId),
    }))
    .filter((item) => item.achievement)
    .sort((a, b) => b.progress - a.progress);

  const getNextMilestone = (
    current: number,
    threshold: number
  ): number => {
    if (current === 0) return Math.ceil(threshold * 0.25);
    if (current <= threshold * 0.25) return Math.ceil(threshold * 0.5);
    if (current <= threshold * 0.5) return Math.ceil(threshold * 0.75);
    return threshold;
  };

  return (
    <Card>
      <CardHeader
        title="Suivi de la progression"
        subheader="Vos succès en cours de déverrouillage"
      />
      <CardContent>
        {loading ? (
          <Typography color="textSecondary">Chargement...</Typography>
        ) : inProgressAchievements.length === 0 ? (
          <Typography color="textSecondary">
            Aucun succès en cours. Continuez vos efforts!
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {inProgressAchievements.map(({ achievement, progress }) => {
              if (!achievement) return null;

              const progressPercent = (progress / achievement.criteria.threshold) * 100;
              const nextMilestone = getNextMilestone(
                progress,
                achievement.criteria.threshold
              );
              const progressToNextMilestone = nextMilestone - progress;
              const totalToNextMilestone =
                nextMilestone - (progress - progressToNextMilestone + progress);

              return (
                <Grid item xs={12} key={achievement.achievementId}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      backgroundColor: '#fafafa',
                    }}
                  >
                    {/* Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        mb: 1.5,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {achievement.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {achievement.descriptionInFrench || achievement.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${Math.min(Math.round(progressPercent), 100)}%`}
                        size="small"
                        sx={{
                          backgroundColor: '#e3f2fd',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>

                    {/* Progress Bar */}
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(progressPercent, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        mb: 1.5,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background:
                            'linear-gradient(90deg, #4CAF50 0%, #81C784 100%)',
                        },
                      }}
                    />

                    {/* Stats */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Progrès actuel
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {progress} / {achievement.criteria.threshold}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Prochain objectif
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {nextMilestone}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Points à gagner
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: '#FFD700' }}
                        >
                          +{achievement.pointsAwarded}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Milestone Progress */}
                    {progressToNextMilestone > 0 && (
                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #e0e0e0' }}>
                        <Typography variant="caption" color="textSecondary">
                          Vers l'étape suivante: {progressToNextMilestone} restant
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={
                            ((nextMilestone - progress) /
                              (nextMilestone - Math.max(0, progress - progressToNextMilestone))) *
                            100
                          }
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            mt: 0.5,
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#FF9800',
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
