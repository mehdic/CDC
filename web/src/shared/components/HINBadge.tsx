/**
 * HIN Verification Badge Component
 *
 * Displays a verification badge for users authenticated with HIN e-ID
 * Task: T5-003 (HIN Login UI)
 */

import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export interface HINBadgeProps {
  /**
   * Whether to show the badge
   */
  verified: boolean;

  /**
   * GLN (Global Location Number) - Swiss healthcare professional ID
   */
  gln?: string;

  /**
   * HIN ID
   */
  hinId?: string;

  /**
   * Variant (size and style)
   */
  variant?: 'small' | 'medium' | 'large';

  /**
   * Display mode
   */
  mode?: 'badge' | 'chip';
}

/**
 * HIN Verification Badge
 *
 * Displays a verification badge for HIN-authenticated users
 * Shows GLN if available
 */
export const HINBadge: React.FC<HINBadgeProps> = ({
  verified,
  gln,
  hinId,
  variant = 'medium',
  mode = 'badge',
}) => {
  if (!verified) {
    return null;
  }

  const sizes = {
    small: { icon: 16, fontSize: '0.75rem' },
    medium: { icon: 20, fontSize: '0.875rem' },
    large: { icon: 24, fontSize: '1rem' },
  };

  const size = sizes[variant];

  const tooltipContent = (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Authentifié via HIN e-ID
      </Typography>
      <Typography variant="caption">
        Health Info Net - Identité numérique suisse pour professionnels de santé
      </Typography>
      {gln && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          GLN: {gln}
        </Typography>
      )}
      {hinId && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          HIN ID: {hinId}
        </Typography>
      )}
    </Box>
  );

  if (mode === 'chip') {
    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <Chip
          icon={<VerifiedUserIcon sx={{ fontSize: size.icon }} />}
          label="HIN e-ID"
          size={variant === 'small' ? 'small' : 'medium'}
          color="primary"
          sx={{
            fontWeight: 500,
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          color: 'primary.main',
          cursor: 'help',
        }}
      >
        <VerifiedUserIcon sx={{ fontSize: size.icon }} />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            fontSize: size.fontSize,
            color: 'primary.main',
          }}
        >
          HIN
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default HINBadge;
