/**
 * AuditLogTable Component
 *
 * Displays audit logs with filtering
 */

import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

interface AuditLogTableProps {
  logs: AuditLog[];
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  const [filterUser, setFilterUser] = useState('');

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(logs.map((log) => log.user)));

  // Filter logs
  const filteredLogs = filterUser
    ? logs.filter((log) => log.user === filterUser)
    : logs;

  return (
    <Box data-testid="audit-log-table">
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-user-label">Filtrer par utilisateur</InputLabel>
          <Select
            labelId="filter-user-label"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            label="Filtrer par utilisateur"
            data-testid="filter-by-user"
          >
            <MenuItem value="">Tous</MenuItem>
            {uniqueUsers.map((user) => (
              <MenuItem key={user} value={user}>
                {user}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Détails</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.user}</TableCell>
                <TableCell>
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </TableCell>
                <TableCell>{log.details}</TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Aucun journal d'audit
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
