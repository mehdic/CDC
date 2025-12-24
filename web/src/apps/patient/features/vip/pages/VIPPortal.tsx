/**
 * VIP Portal Page
 * Main page displaying VIP program benefits, tiers, and membership signup
 * Task: T8-044 - Patient VIP Program Portal
 */

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Loyalty as LoyaltyIcon } from '@mui/icons-material';
import { TierBenefitsCard } from '../components/TierBenefitsCard';
import { VIPTier, VIPMembership, VIPTierInfo } from '../types/vip.types';
import { signup as vipSignup } from '../services/vipService';

// Tier information data
const TIER_DATA: Record<VIPTier, VIPTierInfo> = {
  [VIPTier.BRONZE]: {
    tier: VIPTier.BRONZE,
    name: 'Bronze',
    description: 'Le niveau de départ pour tous les nouveaux membres',
    minPoints: 0,
    maxPoints: 499,
    benefits: [
      {
        id: 'b1',
        benefit: 'Accumulation de points',
        description: 'Gagnez 1 point pour chaque CHF dépensé',
      },
      {
        id: 'b2',
        benefit: 'Réduction spéciale',
        description: '5% de réduction sur tous les achats',
      },
      {
        id: 'b3',
        benefit: 'Accès au programme',
        description: 'Accès exclusif aux offres VIP',
      },
    ],
    discountPercentage: 5,
    pointsMultiplier: 1,
    color: '#CD7F32',
  },
  [VIPTier.SILVER]: {
    tier: VIPTier.SILVER,
    name: 'Silver',
    description: 'Accédez à des avantages améliorés',
    minPoints: 500,
    maxPoints: 1499,
    benefits: [
      {
        id: 's1',
        benefit: 'Accumulation de points multipliée',
        description: 'Gagnez 1.25x plus de points',
      },
      {
        id: 's2',
        benefit: 'Réduction accrue',
        description: '10% de réduction sur tous les achats',
      },
      {
        id: 's3',
        benefit: 'Livraison gratuite',
        description: 'Livraison gratuite sur les commandes > 50 CHF',
      },
      {
        id: 's4',
        benefit: 'Support prioritaire',
        description: 'Accès au support client prioritaire',
      },
    ],
    discountPercentage: 10,
    pointsMultiplier: 1.25,
    color: '#C0C0C0',
  },
  [VIPTier.GOLD]: {
    tier: VIPTier.GOLD,
    name: 'Gold',
    description: 'Profitez des avantages premium',
    minPoints: 1500,
    maxPoints: 2999,
    benefits: [
      {
        id: 'g1',
        benefit: 'Accumulation de points premium',
        description: 'Gagnez 1.5x plus de points',
      },
      {
        id: 'g2',
        benefit: 'Réduction premium',
        description: '15% de réduction sur tous les achats',
      },
      {
        id: 'g3',
        benefit: 'Livraison gratuite',
        description: 'Livraison gratuite sur tous les achats',
      },
      {
        id: 'g4',
        benefit: 'Accès VIP',
        description: 'Accès aux ventes privées et événements exclusifs',
      },
      {
        id: 'g5',
        benefit: 'Bonus d\'anniversaire',
        description: '100 points bonus pour votre anniversaire',
      },
    ],
    discountPercentage: 15,
    pointsMultiplier: 1.5,
    color: '#FFD700',
  },
  [VIPTier.PLATINUM]: {
    tier: VIPTier.PLATINUM,
    name: 'Platinum',
    description: 'Le niveau ultime de privilèges',
    minPoints: 3000,
    benefits: [
      {
        id: 'p1',
        benefit: 'Accumulation de points maximale',
        description: 'Gagnez 2x plus de points',
      },
      {
        id: 'p2',
        benefit: 'Réduction maximale',
        description: '20% de réduction sur tous les achats',
      },
      {
        id: 'p3',
        benefit: 'Livraison gratuite',
        description: 'Livraison gratuite avec priorité mondiale',
      },
      {
        id: 'p4',
        benefit: 'Concierge personnel',
        description: 'Accès à un concierge personnel',
      },
      {
        id: 'p5',
        benefit: 'Bonus d\'anniversaire amélioré',
        description: '200 points bonus pour votre anniversaire',
      },
      {
        id: 'p6',
        benefit: 'Consultation gratuite',
        description: 'Consultations gratuites avec nos pharmaciens',
      },
    ],
    discountPercentage: 20,
    pointsMultiplier: 2,
    color: '#E5E4E2',
  },
};

interface VIPPortalProps {
  currentMembership?: VIPMembership;
  onSignup?: () => Promise<void>;
}

export const VIPPortal: React.FC<VIPPortalProps> = ({
  currentMembership,
  onSignup,
}) => {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState<Error | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const handleSignup = async () => {
    try {
      setIsSigningUp(true);
      setSignupError(null);

      // Use provided onSignup prop if available (for testing), otherwise use vipSignup service
      if (onSignup) {
        await onSignup();
      } else {
        await vipSignup();
      }

      setSignupSuccess(true);
      setShowSuccessAlert(true);
    } catch (error) {
      setSignupError(error instanceof Error ? error : new Error('Signup failed'));
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: '#1a237e',
            mb: 1,
          }}
          data-testid="page-title"
        >
          Programme VIP Golden MetaPharm
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
          Rejoignez notre programme de fidélité et profitez d'avantages exclusifs
        </Typography>
      </Box>

      {/* VIP Benefits Overview */}
      <Box sx={{ mb: 4 }} data-testid="vip-benefits">
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          Avantages du programme
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #FFD70033 0%, #FFD70011 100%)' }}>
              <CardContent>
                <LoyaltyIcon sx={{ fontSize: 32, color: '#FFD700', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Points bonus
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Gagnez des points à chaque achat
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4CAF5033 0%, #4CAF5011 100%)' }}>
              <CardContent>
                <LoyaltyIcon sx={{ fontSize: 32, color: '#4CAF50', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Réductions exclusives
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Jusqu'à 20% de réduction
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #2196F333 0%, #2196F311 100%)' }}>
              <CardContent>
                <LoyaltyIcon sx={{ fontSize: 32, color: '#2196F3', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Livraison gratuite
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  À partir du niveau Silver
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #FF980033 0%, #FF980011 100%)' }}>
              <CardContent>
                <LoyaltyIcon sx={{ fontSize: 32, color: '#FF9800', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Événements exclusifs
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Accès aux offres spéciales
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Signup Section or Current Membership */}
      {!currentMembership ? (
        <Box sx={{ mb: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Rejoignez le programme VIP dès aujourd'hui
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Inscrivez-vous maintenant pour commencer à accumuler des points et profiter d'avantages exclusifs.
            Commencez au niveau Bronze avec 5% de réduction immédiate.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoyaltyIcon />}
            onClick={handleSignup}
            disabled={isSigningUp}
            sx={{
              backgroundColor: '#1a237e',
              '&:hover': {
                backgroundColor: '#0d1957',
              },
            }}
          >
            {isSigningUp ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Inscription en cours...
              </>
            ) : (
              "S'inscrire au programme VIP"
            )}
          </Button>
        </Box>
      ) : null}

      {/* Error Alert */}
      {signupError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {signupError.message}
        </Alert>
      )}

      {/* Success Alert */}
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={6000}
        onClose={() => setShowSuccessAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          role="alert"
          data-testid="vip-signup-success"
          onClose={() => setShowSuccessAlert(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Bienvenue au programme VIP Golden MetaPharm! Vous avez reçu 100 points de bonus.
        </Alert>
      </Snackbar>

      {/* Tier Comparison */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          Comparaison des niveaux VIP
        </Typography>
        <Grid container spacing={3}>
          {Object.values(TIER_DATA).map((tierInfo) => (
            <Grid item xs={12} md={6} key={tierInfo.tier}>
              <TierBenefitsCard
                membership={{
                  id: 'demo',
                  userId: 'demo',
                  currentTier: tierInfo.tier,
                  totalPoints: tierInfo.minPoints,
                  pointsToNextTier: 0,
                  currentTierPoints: 0,
                  joinedAt: new Date(),
                  lastActivityAt: new Date(),
                  isActive: false,
                  membershipStatus: 'inactive',
                }}
                tierInfo={tierInfo}
                testIdTier={`tier-card-${tierInfo.tier.toLowerCase()}`}
                testIdGeneric="tier-card"
                nextTierInfo={
                  tierInfo.tier !== VIPTier.PLATINUM
                    ? Object.values(TIER_DATA).find(
                        (t) =>
                          t.minPoints > tierInfo.minPoints &&
                          (!tierInfo.maxPoints || t.minPoints <= tierInfo.maxPoints)
                      )
                    : undefined
                }
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default VIPPortal;
