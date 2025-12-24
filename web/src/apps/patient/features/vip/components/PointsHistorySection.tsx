/**
 * Points History Section Component
 * Displays points history with pagination
 * Task: T8-044 - Patient VIP Program Portal
 */

import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Pagination,
  Chip,
  Container,
} from '@mui/material';
import {
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { PointsHistory } from '../types/vip.types';

interface PointsHistorySectionProps {
  history: PointsHistory[];
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

type PointsType = 'earned' | 'redeemed' | 'adjusted' | 'expired' | 'bonus';

const POINTS_TYPE_LABELS: Record<PointsType, string> = {
  earned: 'Gagné',
  redeemed: 'Utilisé',
  adjusted: 'Ajusté',
  expired: 'Expiré',
  bonus: 'Bonus',
};

const POINTS_TYPE_COLORS: Record<PointsType, 'success' | 'error' | 'warning' | 'default' | 'info'> = {
  earned: 'success',
  redeemed: 'error',
  adjusted: 'warning',
  expired: 'default',
  bonus: 'success',
};

const POINTS_TYPE_ICONS: Record<PointsType, React.ReactNode> = {
  earned: <TrendingUpIcon fontSize="small" />,
  redeemed: <TrendingDownIcon fontSize="small" />,
  adjusted: null,
  expired: null,
  bonus: <TrendingUpIcon fontSize="small" />,
};

export const PointsHistorySection: React.FC<PointsHistorySectionProps> = ({
  history,
  loading = false,
  error = null,
  pagination = null,
  onPageChange,
}) => {
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
        {error.message || 'Impossible de charger l\'historique des points'}
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <Alert severity="info" icon={<InfoIcon />}>
        Aucune activité pour le moment. Commencez à gagner des points en faisant vos achats!
      </Alert>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Points</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              {history.some(h => h.expiresAt) && (
                <TableCell sx={{ fontWeight: 'bold' }}>Expire</TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {history.map((item) => {
              const isPositive = item.type === 'earned' || item.type === 'bonus' || item.type === 'adjusted';
              const pointsColor = isPositive ? '#4ECDC4' : '#FF6B6B';

              return (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f9f9f9',
                    },
                  }}
                >
                  <TableCell>
                    {POINTS_TYPE_ICONS[item.type as PointsType] ? (
                      <Chip
                        label={POINTS_TYPE_LABELS[item.type as PointsType]}
                        color={POINTS_TYPE_COLORS[item.type as PointsType]}
                        size="small"
                        icon={POINTS_TYPE_ICONS[item.type as PointsType] as any}
                      />
                    ) : (
                      <Chip
                        label={POINTS_TYPE_LABELS[item.type as PointsType]}
                        color={POINTS_TYPE_COLORS[item.type as PointsType]}
                        size="small"
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{item.description}</Typography>
                    {item.transactionId && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        ID: {item.transactionId}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: pointsColor,
                      }}
                    >
                      {isPositive ? '+' : '-'}{Math.abs(item.points)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {new Date(item.createdAt).toLocaleDateString('fr-CH')}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {new Date(item.createdAt).toLocaleTimeString('fr-CH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </TableCell>

                  {history.some(h => h.expiresAt) && (
                    <TableCell>
                      {item.expiresAt ? (
                        <Typography variant="body2">
                          {new Date(item.expiresAt).toLocaleDateString('fr-CH')}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, value) => onPageChange?.(value)}
            color="primary"
          />
        </Box>
      )}
    </>
  );
};

export default PointsHistorySection;
