/**
 * Offers Section Component
 * Displays exclusive VIP offers with pagination
 * Task: T8-044 - Patient VIP Program Portal
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
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
  Pagination,
} from '@mui/material';
import {
  LocalOffer as LocalOfferIcon,
  CardGiftcard as CardGiftcardIcon,
  LocalShipping as LocalShippingIcon,
  Stars as StarsIcon,
  VolumeOff as VolumeOffIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { VIPOffer, OfferType } from '../types/vip.types';

interface OffersSectionProps {
  offers: VIPOffer[];
  loading?: boolean;
  error?: Error | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  onPageChange?: (page: number) => void;
}

const OFFER_TYPE_ICONS: Record<OfferType, React.ReactNode> = {
  [OfferType.DISCOUNT]: <LocalOfferIcon />,
  [OfferType.FREEBIE]: <CardGiftcardIcon />,
  [OfferType.BONUS_POINTS]: <StarsIcon />,
  [OfferType.FREE_DELIVERY]: <LocalShippingIcon />,
  [OfferType.EXCLUSIVE_ACCESS]: <VolumeOffIcon />,
};

const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  [OfferType.DISCOUNT]: 'Réduction',
  [OfferType.FREEBIE]: 'Cadeau',
  [OfferType.BONUS_POINTS]: 'Points Bonus',
  [OfferType.FREE_DELIVERY]: 'Livraison Gratuite',
  [OfferType.EXCLUSIVE_ACCESS]: 'Accès Exclusif',
};

export const OffersSection: React.FC<OffersSectionProps> = ({
  offers,
  loading = false,
  error = null,
  pagination = null,
  onPageChange,
}) => {
  const [selectedOffer, setSelectedOffer] = useState<VIPOffer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleOfferClick = (offer: VIPOffer) => {
    setSelectedOffer(offer);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOffer(null);
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
        {error.message || 'Impossible de charger les offres'}
      </Alert>
    );
  }

  if (offers.length === 0) {
    return (
      <Alert severity="info" icon={<InfoIcon />}>
        Aucune offre disponible pour votre niveau de membership.
      </Alert>
    );
  }

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {offers.map((offer) => (
          <Grid item xs={12} sm={6} md={4} key={offer.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'visible',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              {/* Featured Badge */}
              {offer.featured && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: '#FF6B6B',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    zIndex: 1,
                  }}
                >
                  VEDETTE
                </Box>
              )}

              {/* Image */}
              {offer.imageUrl && (
                <CardMedia
                  component="img"
                  height="160"
                  image={offer.imageUrl}
                  alt={offer.title}
                  sx={{
                    objectFit: 'cover',
                  }}
                />
              )}

              <CardContent sx={{ flex: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ mr: 1, color: '#FFD700' }}>
                    {OFFER_TYPE_ICONS[offer.type]}
                  </Box>
                  <Chip
                    label={OFFER_TYPE_LABELS[offer.type]}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {offer.title}
                </Typography>

                <Typography variant="body2" color="textSecondary" paragraph>
                  {offer.description}
                </Typography>

                {/* Offer Details */}
                {offer.discountPercentage && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Réduction
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FF6B6B', fontWeight: 'bold' }}>
                      {offer.discountPercentage}%
                    </Typography>
                  </Box>
                )}

                {offer.pointsBonus && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Points bonus
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                      +{offer.pointsBonus}
                    </Typography>
                  </Box>
                )}

                {/* Usage Info */}
                {offer.usageLimit && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Utilisations restantes: {offer.usageLimit - offer.usageCount}
                    </Typography>
                  </Box>
                )}

                {/* Validity */}
                <Typography variant="caption" color="textSecondary" display="block">
                  Valable jusqu'au {new Date(offer.validUntil).toLocaleDateString('fr-CH')}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleOfferClick(offer)}
                  size="small"
                >
                  Voir les détails
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, value) => onPageChange?.(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Offer Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedOffer?.title}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOffer?.imageUrl && (
            <Box
              component="img"
              src={selectedOffer.imageUrl}
              sx={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                borderRadius: 1,
                mb: 2,
              }}
              alt={selectedOffer.title}
            />
          )}

          <Typography variant="body2" paragraph>
            {selectedOffer?.description}
          </Typography>

          {/* Offer Details */}
          <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Détails de l'offre
            </Typography>

            {selectedOffer?.discountPercentage && (
              <Typography variant="body2" gutterBottom>
                Réduction: <strong>{selectedOffer.discountPercentage}%</strong>
              </Typography>
            )}

            {selectedOffer?.pointsBonus && (
              <Typography variant="body2" gutterBottom>
                Points bonus: <strong>+{selectedOffer.pointsBonus}</strong>
              </Typography>
            )}

            <Typography variant="body2" gutterBottom>
              Valide du {new Date(selectedOffer?.validFrom || '').toLocaleDateString('fr-CH')} au{' '}
              {new Date(selectedOffer?.validUntil || '').toLocaleDateString('fr-CH')}
            </Typography>

            {selectedOffer?.usageLimit && (
              <Typography variant="body2">
                Utilisations restantes: {selectedOffer.usageLimit - selectedOffer.usageCount}
              </Typography>
            )}
          </Box>

          {/* Conditions */}
          {selectedOffer?.termsAndConditions && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Conditions
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {selectedOffer.termsAndConditions}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Fermer</Button>
          <Button variant="contained" color="primary">
            Utiliser l'offre
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OffersSection;
