/**
 * Audit Log Viewer Component
 * Enhanced audit log viewer with filtering and export
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  TablePagination,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  History as HistoryIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useAuditLogs, useExportAuditLogs } from '../hooks/useAdmin';
import type { AuditAction, AuditLogFilters } from '../types/admin.types';

/**
 * Action labels for display
 */
const ACTION_LABELS: Record<AuditAction, string> = {
  user_created: 'Utilisateur cree',
  user_updated: 'Utilisateur modifie',
  user_deleted: 'Utilisateur supprime',
  user_login: 'Connexion',
  user_logout: 'Deconnexion',
  permission_changed: 'Permissions modifiees',
  config_changed: 'Configuration modifiee',
  prescription_processed: 'Ordonnance traitee',
  order_created: 'Commande creee',
  order_updated: 'Commande modifiee',
  system_event: 'Evenement systeme',
};

/**
 * Get color for action type
 */
const getActionColor = (
  action: AuditAction
): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  switch (action) {
    case 'user_created':
    case 'order_created':
      return 'success';
    case 'user_deleted':
      return 'error';
    case 'user_updated':
    case 'order_updated':
    case 'permission_changed':
    case 'config_changed':
      return 'warning';
    case 'user_login':
    case 'user_logout':
      return 'info';
    case 'prescription_processed':
      return 'primary';
    case 'system_event':
    default:
      return 'secondary';
  }
};

export const AuditLogViewer: React.FC = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 10,
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: auditData, isLoading, error, refetch } = useAuditLogs(filters);
  const exportMutation = useExportAuditLogs();

  const handlePageChange = (_: unknown, newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  const handleToggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: filters.limit });
  };

  return (
    <Card data-testid="audit-log-viewer">
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Journal d'Audit
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              Filtres
            </Button>
            <Tooltip title="Actualiser">
              <IconButton onClick={() => refetch()} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? 'Export...' : 'Exporter'}
            </Button>
          </Stack>
        </Box>

        {/* Filters */}
        <Collapse in={filtersExpanded}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action || ''}
                  label="Action"
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  data-testid="filter-action"
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Acteur"
                placeholder="Email ou nom"
                value={filters.actor || ''}
                onChange={(e) => handleFilterChange('actor', e.target.value)}
                sx={{ minWidth: 200 }}
                data-testid="filter-actor"
              />
              <TextField
                size="small"
                label="Date debut"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                data-testid="filter-start-date"
              />
              <TextField
                size="small"
                label="Date fin"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                data-testid="filter-end-date"
              />
              <Button variant="text" onClick={clearFilters}>
                Effacer
              </Button>
            </Stack>
          </Paper>
        </Collapse>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erreur lors du chargement du journal d'audit
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Audit Log Table */}
        {!isLoading && auditData && (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={40} />
                    <TableCell>Date/Heure</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Acteur</TableCell>
                    <TableCell>Cible</TableCell>
                    <TableCell>IP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditData.data.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleToggleRow(log.id)}
                        data-testid={`audit-row-${log.id}`}
                      >
                        <TableCell>
                          <IconButton size="small">
                            {expandedRow === log.id ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ACTION_LABELS[log.action] || log.action}
                            color={getActionColor(log.action)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.actor}</Typography>
                        </TableCell>
                        <TableCell>
                          {log.target && (
                            <Typography variant="body2" color="text.secondary">
                              {log.target}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {log.ipAddress || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {/* Expanded Details Row */}
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                          <Collapse in={expandedRow === log.id} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 4, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Details
                              </Typography>
                              <Box
                                component="pre"
                                sx={{
                                  bgcolor: 'grey.100',
                                  p: 2,
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  fontSize: '0.75rem',
                                  maxHeight: 200,
                                }}
                              >
                                {JSON.stringify(log.details, null, 2)}
                              </Box>
                              {log.userAgent && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', mt: 1 }}
                                >
                                  User Agent: {log.userAgent}
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                  {auditData.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          Aucun enregistrement trouve
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={auditData.total}
              page={(filters.page || 1) - 1}
              onPageChange={handlePageChange}
              rowsPerPage={filters.limit || 10}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Lignes par page"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;
