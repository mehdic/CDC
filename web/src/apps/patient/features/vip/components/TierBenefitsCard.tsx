/**
 * Tier Benefits Card Component
 * Displays VIP tier benefits with visual indicators
 * Task: T8-044 - Patient VIP Program Portal
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  LocalOffer as LocalOfferIcon,
  Stars as StarsIcon,
  Loyalty as LoyaltyIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import { VIPMembership, VIPTierInfo } from '../types/vip.types';

interface TierBenefitsCardProps {
  membership: VIPMembership;
  tierInfo: VIPTierInfo;
  nextTierInfo?: VIPTierInfo;
  onUpgradeClick?: () => void;
}

const TIER_COLORS: Record<string, string> = {
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  silver: <LocalOfferIcon sx={{ fontSize: 24 }} />,
  gold: <StarsIcon sx={{ fontSize: 24 }} />,
  platinum: <EmojiEventsIcon sx={{ fontSize: 24 }} />,
};

export const TierBenefitsCard: React.FC<TierBenefitsCardProps> = ({
  membership,
  tierInfo,
  nextTierInfo,
  onUpgradeClick,
}) => {
  const tierColor = TIER_COLORS[membership.currentTier] || '#999';
  const progressPercent = nextTierInfo
    ? Math.min(100, ((membership.totalPoints - tierInfo.minPoints) / (nextTierInfo.minPoints - tierInfo.minPoints)) * 100)
    : 100;

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${tierColor}33 0%, ${tierColor}11 100%)`,
        border: `2px solid ${tierColor}`,
        mb: 3,
      }}
    >
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: tierColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {TIER_ICONS[membership.currentTier]}
          </Box>
        }
        title={
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {tierInfo.name}
          </Typography>
        }
        subheader={
          <Chip
            label={membership.membershipStatus === 'active' ? 'Actif' : 'Inactif'}
            color={membership.membershipStatus === 'active' ? 'success' : 'error'}
            size="small"
            sx={{ mt: 1 }}
          />
        }
      />

      <CardContent>
        {/* Description */}
        <Typography variant="body2" color="textSecondary" paragraph>
          {tierInfo.description}
        </Typography>

        {/* Points Progress */}
        {nextTierInfo && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Progression vers {nextTierInfo.name}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {membership.pointsToNextTier} points restants
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: tierColor,
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        )}

        {/* Current Points */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
            Points actuels
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: tierColor }}>
            {membership.totalPoints}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Multiplicateur: {tierInfo.pointsMultiplier}x
          </Typography>
        </Box>

        {/* Benefits */}
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
          Avantages du niveau
        </Typography>
        <List sx={{ mb: 2 }}>
          {tierInfo.benefits.map((benefit) => (
            <ListItem key={benefit.id} disableGutters sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckCircleIcon
                  sx={{
                    color: tierColor,
                    fontSize: 20,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={benefit.benefit}
                secondary={benefit.description}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>

        {/* Discount Info */}
        <Box sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, mb: 2 }}>
          <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
            Réduction applicable
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: tierColor }}>
            {tierInfo.discountPercentage}%
          </Typography>
        </Box>

        {/* Upgrade Button */}
        {nextTierInfo && onUpgradeClick && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<LoyaltyIcon />}
            onClick={onUpgradeClick}
            sx={{
              backgroundColor: tierColor,
              '&:hover': {
                backgroundColor: tierColor,
                opacity: 0.9,
              },
            }}
          >
            Viser le niveau {nextTierInfo.name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TierBenefitsCard;
