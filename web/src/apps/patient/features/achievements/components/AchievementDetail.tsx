/**
 * Achievement Detail Component
 * Displays full achievement details with requirements and rewards
 * Task: T6-021
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import { Achievement, PatientAchievement, AchievementTier } from '../types/achievement.types';

interface AchievementDetailProps {
  achievement?: Achievement;
  patientAchievement?: PatientAchievement;
  open: boolean;
  onClose: () => void;
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

const TIMEFRAME_LABELS: Record<string, string> = {
  day: 'par jour',
  week: 'par semaine',
  month: 'par mois',
  year: 'par an',
  all_time: 'total',
};

export const AchievementDetail: React.FC<AchievementDetailProps> = ({
  achievement,
  patientAchievement,
  open,
  onClose,
}) => {
  if (!achievement) return null;

  const isEarned = patientAchievement && !patientAchievement.isLocked;
  const progressPercent = patientAchievement
    ? (patientAchievement.progress / achievement.criteria.threshold) * 100
    : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {achievement.iconUrl && (
            <img
              src={achievement.iconUrl}
              alt={achievement.name}
              style={{ width: 48, height: 48 }}
            />
          )}
          <Box>
            <Typography variant="h6">{achievement.name}</Typography>
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
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Description */}
          <Card sx={{ mb: 3, backgroundColor: '#f9f9f9' }}>
            <CardContent>
              <Typography variant="body2">
                {achievement.descriptionInFrench || achievement.description}
              </Typography>
            </CardContent>
          </Card>

          {/* Status */}
          {isEarned ? (
            <Box
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: '#e8f5e9',
                borderRadius: 1,
                border: '1px solid #4caf50',
              }}
            >
              <Typography sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                ✓ Débloqué
              </Typography>
              {patientAchievement?.earnedAt && (
                <Typography variant="caption" color="textSecondary">
                  Le {new Date(patientAchievement.earnedAt).toLocaleDateString(
                    'fr-FR'
                  )}
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Progrès
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(progressPercent, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mb: 1,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: TIER_COLORS[achievement.tier],
                    borderRadius: 4,
                  },
                }}
              />
              <Typography variant="caption" color="textSecondary">
                {patientAchievement?.progress || 0} / {achievement.criteria.threshold}
                {achievement.criteria.timeframe
                  ? ` (${TIMEFRAME_LABELS[achievement.criteria.timeframe] || achievement.criteria.timeframe})`
                  : ''}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Requirements */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
              Exigences
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2">
                  <strong>Métrique:</strong> {achievement.criteria.metric}
                </Typography>
                <Typography variant="body2">
                  <strong>Seuil:</strong> {achievement.criteria.threshold}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {achievement.criteria.type}
                </Typography>
                {achievement.criteria.timeframe && (
                  <Typography variant="body2">
                    <strong>Période:</strong>{' '}
                    {TIMEFRAME_LABELS[achievement.criteria.timeframe]}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Rewards */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
              Récompenses
            </Typography>
            <Card variant="outlined" sx={{ backgroundColor: '#fffde7' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {achievement.pointsAwarded}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFD700' }}>
                    ★ Points
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AchievementDetail;
