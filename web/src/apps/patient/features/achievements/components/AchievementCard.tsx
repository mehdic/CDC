/**
 * Achievement Card Component
 * Displays individual achievement with icon, name, progress, and tier
 * Task: T6-021
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { Achievement, PatientAchievement, AchievementTier } from '../types/achievement.types';

interface AchievementCardProps {
  achievement: Achievement;
  patientAchievement?: PatientAchievement;
  isLocked?: boolean;
  onClick?: () => void;
}

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platine',
};

const CATEGORY_LABELS: Record<string, string> = {
  adherence: 'Adhérence',
  health: 'Santé',
  engagement: 'Engagement',
  loyalty: 'Fidélité',
  social: 'Social',
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  patientAchievement,
  isLocked = false,
  onClick,
}) => {
  const isEarned = patientAchievement && !patientAchievement.isLocked;
  const progressPercent = patientAchievement
    ? (patientAchievement.progress / achievement.criteria.threshold) * 100
    : 0;

  return (
    <Tooltip
      title={isLocked ? 'Bloqué' : achievement.descriptionInFrench || achievement.description}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          opacity: isLocked ? 0.6 : 1,
          transition: 'all 0.3s ease',
          '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 3 } : {},
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: isEarned ? '#f5f5f5' : 'white',
          border: isEarned ? `2px solid ${TIER_COLORS[achievement.tier]}` : 'none',
        }}
      >
        <CardMedia
          component="div"
          sx={{
            height: 120,
            backgroundColor: isLocked ? '#e0e0e0' : TIER_COLORS[achievement.tier],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: isLocked ? 'grayscale(100%)' : 'none',
          }}
        >
          {achievement.iconUrl ? (
            <img
              src={achievement.iconUrl}
              alt={achievement.name}
              style={{
                width: 64,
                height: 64,
                opacity: isLocked ? 0.5 : 1,
              }}
            />
          ) : (
            <Typography variant="h4" sx={{ opacity: 0.5 }}>
              🏆
            </Typography>
          )}
        </CardMedia>

        <CardContent sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" component="h3">
              {achievement.name}
            </Typography>
            <Chip
              label={TIER_LABELS[achievement.tier]}
              size="small"
              sx={{
                backgroundColor: TIER_COLORS[achievement.tier],
                color: achievement.tier === 'bronze' || achievement.tier === 'gold'
                  ? '#000'
                  : '#fff',
                fontWeight: 'bold',
              }}
            />
          </Box>

          <Chip
            label={CATEGORY_LABELS[achievement.category] || achievement.category}
            size="small"
            variant="outlined"
            sx={{ mb: 2, fontSize: '0.75rem' }}
          />

          {patientAchievement && !isEarned && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 1,
                  alignItems: 'center',
                }}
              >
                <Typography variant="caption" color="textSecondary">
                  Progrès
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {Math.min(Math.round(progressPercent), 100)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(progressPercent, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: TIER_COLORS[achievement.tier],
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          )}

          {isEarned && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: TIER_COLORS[achievement.tier],
                mb: 1,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                ✓ Débloqué
              </Typography>
              {patientAchievement?.earnedAt && (
                <Typography variant="caption" color="textSecondary">
                  {new Date(patientAchievement.earnedAt).toLocaleDateString(
                    'fr-FR'
                  )}
                </Typography>
              )}
            </Box>
          )}

          {isLocked && (
            <Typography variant="caption" color="textSecondary">
              Bloqué
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <Typography variant="caption" color="textSecondary">
              {achievement.pointsAwarded}
            </Typography>
            <Typography variant="caption" sx={{ color: '#FFD700' }}>
              ★
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export default AchievementCard;
