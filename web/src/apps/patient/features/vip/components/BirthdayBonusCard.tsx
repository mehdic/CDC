/**
 * Birthday Bonus Card Component
 * Displays birthday bonus with countdown, status, and redeem button
 * Task: T6-023
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Cake as CakeIcon,
  LocalOffer as LocalOfferIcon,
  CardGiftcard as CardGiftcardIcon,
  LocalShipping as LocalShippingIcon,
  Stars as StarsIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  BirthdayBonusDto,
  BonusType,
  BonusStatus,
} from '../types/birthday.types';

interface BirthdayBonusCardProps {
  bonus: BirthdayBonusDto | null;
  onRedeem?: (bonusCode: string, orderId?: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const BONUS_TYPE_COLORS: Record<BonusType, string> = {
  [BonusType.DISCOUNT]: '#FF6B6B',
  [BonusType.POINTS]: '#4ECDC4',
  [BonusType.GIFT]: '#FFD93D',
  [BonusType.FREE_DELIVERY]: '#6BCB77',
};

const BONUS_TYPE_ICONS: Record<BonusType, JSX.Element> = {
  [BonusType.DISCOUNT]: <LocalOfferIcon />,
  [BonusType.POINTS]: <StarsIcon />,
  [BonusType.GIFT]: <CardGiftcardIcon />,
  [BonusType.FREE_DELIVERY]: <LocalShippingIcon />,
};

const BONUS_TYPE_LABELS: Record<BonusType, string> = {
  [BonusType.DISCOUNT]: 'Réduction',
  [BonusType.POINTS]: 'Points VIP',
  [BonusType.GIFT]: 'Bon Cadeau',
  [BonusType.FREE_DELIVERY]: 'Livraison Gratuite',
};

const STATUS_COLORS: Record<BonusStatus, 'default' | 'error' | 'warning' | 'success' | 'info'> = {
  [BonusStatus.UPCOMING]: 'info',
  [BonusStatus.ACTIVE]: 'success',
  [BonusStatus.EXPIRING_SOON]: 'warning',
  [BonusStatus.EXPIRED]: 'error',
  [BonusStatus.REDEEMED]: 'default',
};

const STATUS_LABELS: Record<BonusStatus, string> = {
  [BonusStatus.UPCOMING]: 'À venir',
  [BonusStatus.ACTIVE]: 'Actif',
  [BonusStatus.EXPIRING_SOON]: 'Expire bientôt',
  [BonusStatus.EXPIRED]: 'Expiré',
  [BonusStatus.REDEEMED]: 'Utilisé',
};

export const BirthdayBonusCard: React.FC<BirthdayBonusCardProps> = ({
  bonus,
  onRedeem,
  isLoading = false,
  error = null,
  onRefresh,
}) => {
  const [openRedeemDialog, setOpenRedeemDialog] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  if (!bonus) {
    return (
      <Card
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: 280,
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            py: 6,
          }}
        >
          <CakeIcon sx={{ fontSize: 60, mb: 2, opacity: 0.8 }} />
          <Typography variant="h6" gutterBottom>
            Pas de bonus d'anniversaire
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Votre bonus d'anniversaire n'a pas encore été généré. Revenez plus tard!
          </Typography>
          {onRefresh && (
            <Button
              variant="contained"
              color="inherit"
              onClick={onRefresh}
              sx={{ mt: 2 }}
              disabled={isLoading}
            >
              Actualiser
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const handleRedeemClick = () => {
    setOpenRedeemDialog(true);
    setRedeemError(null);
    setRedeemSuccess(false);
  };

  const handleCloseRedeemDialog = () => {
    setOpenRedeemDialog(false);
    setOrderId('');
    setRedeemError(null);
  };

  const handleConfirmRedeem = async () => {
    if (!onRedeem) {
      return;
    }

    try {
      setIsRedeeming(true);
      setRedeemError(null);

      await onRedeem(bonus.bonusCode, orderId || undefined);
      setRedeemSuccess(true);

      setTimeout(() => {
        handleCloseRedeemDialog();
        setRedeemSuccess(false);
        if (onRefresh) {
          onRefresh();
        }
      }, 2000);
    } catch (err: any) {
      setRedeemError(err.message || 'Erreur lors de la validation du bonus');
    } finally {
      setIsRedeeming(false);
    }
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, ((30 - bonus.daysRemaining) / 30) * 100)
  );

  const isExpiringSoon = bonus.status === BonusStatus.EXPIRING_SOON;
  const canRedeem =
    bonus.status === BonusStatus.ACTIVE || bonus.status === BonusStatus.EXPIRING_SOON;

  return (
    <>
      <Card
        sx={{
          position: 'relative',
          overflow: 'visible',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
        }}
      >
        {/* Header with gradient background */}
        <CardMedia
          sx={{
            height: 140,
            background: `linear-gradient(135deg, ${BONUS_TYPE_COLORS[bonus.bonusType]}99 0%, ${
              BONUS_TYPE_COLORS[bonus.bonusType]
            } 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                fontSize: 48,
                opacity: 0.9,
              }}
            >
              {BONUS_TYPE_ICONS[bonus.bonusType]}
            </Box>
            <Box sx={{ color: 'white' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                {BONUS_TYPE_LABELS[bonus.bonusType]}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {bonus.bonusType === BonusType.DISCOUNT && `${bonus.bonusValue}%`}
                {bonus.bonusType === BonusType.POINTS && `${Math.round(bonus.bonusValue)}`}
                {bonus.bonusType === BonusType.GIFT && `CHF ${bonus.bonusValue}`}
              </Typography>
            </Box>
          </Box>

          {/* Status chip */}
          <Chip
            label={STATUS_LABELS[bonus.status]}
            color={STATUS_COLORS[bonus.status]}
            icon={
              bonus.status === BonusStatus.REDEEMED ? (
                <CheckCircleIcon />
              ) : bonus.status === BonusStatus.EXPIRING_SOON ? (
                <WarningIcon />
              ) : (
                <ScheduleIcon />
              )
            }
            sx={{
              fontWeight: 'bold',
              color: 'white',
            }}
          />
        </CardMedia>

        {/* Content */}
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Description */}
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
            {bonus.description}
          </Typography>

          {/* Bonus Code */}
          <Box
            sx={{
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              mb: 2,
              textAlign: 'center',
              border: '1px dashed #ccc',
            }}
          >
            <Typography variant="caption" color="textSecondary">
              Code d'activation
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: BONUS_TYPE_COLORS[bonus.bonusType],
                wordBreak: 'break-all',
              }}
            >
              {bonus.bonusCode}
            </Typography>
          </Box>

          {/* Validity Period */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
              Validité
            </Typography>
            <Typography variant="body2">
              Jusqu'au {new Date(bonus.validUntil).toLocaleDateString('fr-CH')}
            </Typography>
          </Box>

          {/* Countdown / Days Remaining */}
          {bonus.status !== BonusStatus.REDEEMED &&
            bonus.status !== BonusStatus.EXPIRED &&
            bonus.status !== BonusStatus.UPCOMING && (
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="caption" color="textSecondary">
                    Temps restant
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 'bold',
                      color: isExpiringSoon ? '#FF6B6B' : '#4ECDC4',
                    }}
                  >
                    {bonus.daysRemaining} jour{bonus.daysRemaining !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: isExpiringSoon ? '#FF6B6B' : '#4ECDC4',
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            )}

          {/* Status Messages */}
          {bonus.status === BonusStatus.UPCOMING && (
            <Alert severity="info" icon={<ScheduleIcon />} sx={{ mb: 2 }}>
              Votre bonus d'anniversaire sera actif à partir du{' '}
              {new Date(bonus.validFrom).toLocaleDateString('fr-CH')}
            </Alert>
          )}

          {bonus.status === BonusStatus.EXPIRING_SOON && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
              Votre bonus expire dans {bonus.daysRemaining} jour
              {bonus.daysRemaining !== 1 ? 's' : ''}. Dépêchez-vous de l'utiliser!
            </Alert>
          )}

          {bonus.status === BonusStatus.EXPIRED && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Votre bonus a expiré le{' '}
              {new Date(bonus.validUntil).toLocaleDateString('fr-CH')}
            </Alert>
          )}

          {bonus.status === BonusStatus.REDEEMED && (
            <Alert
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{ mb: 2 }}
            >
              Bonus utilisé le {new Date(bonus.redeemedAt!).toLocaleDateString('fr-CH')}
            </Alert>
          )}

          {/* Action Buttons */}
          {canRedeem && (
            <Button
              variant="contained"
              fullWidth
              onClick={handleRedeemClick}
              disabled={isLoading || isRedeeming}
              sx={{
                backgroundColor: BONUS_TYPE_COLORS[bonus.bonusType],
                '&:hover': {
                  backgroundColor: BONUS_TYPE_COLORS[bonus.bonusType],
                  opacity: 0.9,
                },
              }}
            >
              {isRedeeming ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Validation...
                </>
              ) : (
                'Utiliser le bonus'
              )}
            </Button>
          )}

          {bonus.status === BonusStatus.UPCOMING && (
            <Button variant="outlined" fullWidth disabled>
              Disponible bientôt
            </Button>
          )}

          {(bonus.status === BonusStatus.EXPIRED ||
            bonus.status === BonusStatus.REDEEMED) && (
            <Button variant="outlined" fullWidth disabled>
              {bonus.status === BonusStatus.EXPIRED ? 'Bonus expiré' : 'Bonus utilisé'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Redeem Dialog */}
      <Dialog
        open={openRedeemDialog}
        onClose={handleCloseRedeemDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Valider le bonus</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {redeemSuccess ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              Bonus validé avec succès! Vous pouvez à présent finaliser votre achat.
            </Alert>
          ) : (
            <>
              {redeemError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {redeemError}
                </Alert>
              )}

              <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
                Voulez-vous utiliser ce bonus maintenant?
              </Typography>

              <TextField
                fullWidth
                label="N° de commande (optionnel)"
                placeholder="Associer ce bonus à une commande"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={isRedeeming}
                size="small"
                sx={{ mb: 2 }}
              />

              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                <Typography variant="caption" color="textSecondary" display="block">
                  Code: {bonus.bonusCode}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Expire le {new Date(bonus.validUntil).toLocaleDateString('fr-CH')}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseRedeemDialog}
            disabled={isRedeeming}
          >
            {redeemSuccess ? 'Fermer' : 'Annuler'}
          </Button>
          {!redeemSuccess && (
            <Button
              onClick={handleConfirmRedeem}
              variant="contained"
              disabled={isRedeeming}
              sx={{
                backgroundColor: BONUS_TYPE_COLORS[bonus.bonusType],
              }}
            >
              {isRedeeming ? <CircularProgress size={20} color="inherit" /> : 'Valider'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BirthdayBonusCard;
