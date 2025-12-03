/**
 * Leaderboard Widget Component
 * Displays top patients and current user's rank
 * Task: T6-021
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Avatar,
} from '@mui/material';
import { LeaderboardEntry } from '../types/achievement.types';

interface LeaderboardWidgetProps {
  leaderboard: LeaderboardEntry[];
  currentUserRank?: number;
  loading?: boolean;
}

type LeaderboardType = 'week' | 'month' | 'all_time';

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  leaderboard,
  currentUserRank,
  loading = false,
}) => {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>(
    'all_time'
  );

  const handleLeaderboardChange = (
    _: React.MouseEvent<HTMLElement>,
    newType: LeaderboardType | null
  ) => {
    if (newType) {
      setLeaderboardType(newType);
    }
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader
        title="Classement"
        subheader="Classement des meilleurs patients"
      />
      <CardContent>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <ToggleButtonGroup
            value={leaderboardType}
            exclusive
            onChange={handleLeaderboardChange}
            size="small"
          >
            <ToggleButton value="week">Cette semaine</ToggleButton>
            <ToggleButton value="month">Ce mois</ToggleButton>
            <ToggleButton value="all_time">Tous les temps</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {currentUserRank && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: '#e3f2fd',
              borderRadius: 1,
              border: '1px solid #90caf9',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Votre rang: #{currentUserRank}
            </Typography>
          </Box>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Rang
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Points
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Succès
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Série
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="textSecondary">Chargement...</Typography>
                  </TableCell>
                </TableRow>
              ) : leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="textSecondary">
                      Aucun classement disponible
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((entry) => (
                  <TableRow
                    key={entry.patientId}
                    sx={{
                      backgroundColor:
                        entry.rank <= 3 ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  >
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {getMedalEmoji(entry.rank) || `#${entry.rank}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {entry.avatarUrl && (
                          <Avatar
                            src={entry.avatarUrl}
                            sx={{ width: 32, height: 32 }}
                          />
                        )}
                        <Typography variant="body2">
                          {entry.patientName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={entry.totalPoints}
                        size="small"
                        sx={{
                          backgroundColor: '#FFD700',
                          color: '#000',
                          fontWeight: 'bold',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {entry.achievement_count}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {entry.current_streak && entry.current_streak > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {entry.current_streak}
                          </Typography>
                          <Typography sx={{ color: '#FF6B6B', fontSize: '1rem' }}>
                            🔥
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default LeaderboardWidget;
