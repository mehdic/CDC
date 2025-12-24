/**
 * Rewards Section Component
 * Displays available rewards with redemption options
 * Task: T8-044 - Patient VIP Program Portal
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CardGiftcard as CardGiftcardIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { VIPReward, RewardStatus } from '../types/vip.types';

interface RewardsSectionProps {
  rewards: VIPReward[];
  loading?: boolean;
  error?: Error | null;
  redeeming?: boolean;
  redeemError?: Error | null;
  onRedeem?: (rewardId: string, orderId?: string) => Promise<void>;
}

const REWARD_STATUS_COLORS: Record<RewardStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [RewardStatus.AVAILABLE]: 'success',
  [RewardStatus.PENDING]: 'warning',
  [RewardStatus.REDEEMED]: 'default',
  [RewardStatus.EXPIRED]: 'error',
};

const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  [RewardStatus.AVAILABLE]: 'Disponible',
  [RewardStatus.PENDING]: 'En attente',
  [RewardStatus.REDEEMED]: 'Utilisé',
  [RewardStatus.EXPIRED]: 'Expiré',
};

export const RewardsSection: React.FC<RewardsSectionProps> = ({
  rewards,
  loading = false,
  error = null,
  redeeming = false,
  redeemError = null,
  onRedeem,
}) => {
  const [selectedReward, setSelectedReward] = useState<VIPReward | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRedeemClick = (reward: VIPReward) => {
    setSelectedReward(reward);
    setOrderId('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReward(null);
    setOrderId('');
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward || !onRedeem) return;

    try {
      setIsSubmitting(true);
      await onRedeem(selectedReward.id, orderId || undefined);
      handleCloseDialog();
    } catch (err) {
      // Error is handled by the parent component
      console.error('Redeem error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" icon={<InfoIcon />}>
        {error.message || 'Impossible de charger les récompenses'}
      </Alert>
    );
  }

  if (rewards.length === 0) {
    return (
      <Alert severity="info" icon={<InfoIcon />}>
        Aucune récompense disponible pour le moment. Continuez vos achats pour en gagner!
      </Alert>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {rewards.map((reward) => (
          <Grid item xs={12} sm={6} md={4} key={reward.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': reward.status === RewardStatus.AVAILABLE ? {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                } : {},
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CardGiftcardIcon
                    sx={{
                      mr: 1,
                      color: reward.status === RewardStatus.AVAILABLE ? '#FFD700' : '#999',
                    }}
                  />
                  <Chip
                    label={REWARD_STATUS_LABELS[reward.status]}
                    color={REWARD_STATUS_COLORS[reward.status]}
                    size="small"
                  />
                </Box>

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {reward.title}
                </Typography>

                <Typography variant="body2" color="textSecondary" paragraph>
                  {reward.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    Points requis
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                    {reward.pointsValue}
                  </Typography>
                </Box>

                {reward.bonusPoints && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Points bonus
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                      +{reward.bonusPoints}
                    </Typography>
                  </Box>
                )}

                <Typography variant="caption" color="textSecondary" display="block">
                  Expire le {new Date(reward.expiresAt).toLocaleDateString('fr-CH')}
                </Typography>
              </CardContent>

              <CardActions>
                {reward.status === RewardStatus.AVAILABLE && onRedeem && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => handleRedeemClick(reward)}
                    disabled={redeeming}
                    size="small"
                  >
                    Utiliser
                  </Button>
                )}
                {reward.status === RewardStatus.REDEEMED && (
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    startIcon={<CheckCircleIcon />}
                    size="small"
                  >
                    Utilisé
                  </Button>
                )}
                {reward.status === RewardStatus.PENDING && (
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    startIcon={<ScheduleIcon />}
                    size="small"
                  >
                    En attente
                  </Button>
                )}
                {reward.status === RewardStatus.EXPIRED && (
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    size="small"
                  >
                    Expiré
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Redeem Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Utiliser la récompense</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {redeemError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {redeemError.message || 'Erreur lors de la validation'}
            </Alert>
          )}

          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
            {selectedReward?.description}
          </Typography>

          <TextField
            fullWidth
            label="N° de commande (optionnel)"
            placeholder="Associer à une commande"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            disabled={isSubmitting}
            size="small"
            sx={{ mb: 2 }}
          />

          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary" display="block">
              Points requis: {selectedReward?.pointsValue}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Expire le {selectedReward && new Date(selectedReward.expiresAt).toLocaleDateString('fr-CH')}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirmRedeem}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RewardsSection;
