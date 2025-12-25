/**
 * Configuration Management Component
 * Interface for managing system configuration
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
  Switch,
  Select,
  MenuItem,
  FormControl,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Snackbar,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSystemConfig, useUpdateConfig } from '../hooks/useAdmin';
import type { ConfigItem, ConfigCategory } from '../types/admin.types';

interface TabPanelProps {
  children?: React.ReactNode;
  value: ConfigCategory;
  currentValue: ConfigCategory;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, currentValue }) => (
  <div hidden={value !== currentValue}>{value === currentValue && <Box sx={{ pt: 2 }}>{children}</Box>}</div>
);

/**
 * Category labels
 */
const CATEGORY_LABELS: Record<ConfigCategory, string> = {
  general: 'General',
  security: 'Securite',
  notifications: 'Notifications',
  integrations: 'Integrations',
  features: 'Fonctionnalites',
};

export const ConfigManagement: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ConfigCategory>('general');
  const [editedValues, setEditedValues] = useState<Record<string, ConfigItem['value']>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { data: config, isLoading, error, refetch } = useSystemConfig();
  const updateConfigMutation = useUpdateConfig();

  const handleValueChange = (key: string, value: ConfigItem['value']) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    const value = editedValues[key];
    if (value !== undefined) {
      try {
        await updateConfigMutation.mutateAsync({ key, value });
        setEditedValues((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setSnackbarMessage('Configuration mise a jour avec succes');
        setSnackbarOpen(true);
      } catch (err) {
        setSnackbarMessage('Erreur lors de la mise a jour');
        setSnackbarOpen(true);
      }
    }
  };

  const getItemValue = (item: ConfigItem): ConfigItem['value'] => {
    return editedValues[item.key] !== undefined ? editedValues[item.key] : item.value;
  };

  const hasUnsavedChanges = (key: string): boolean => {
    return editedValues[key] !== undefined;
  };

  const renderValueEditor = (item: ConfigItem) => {
    const currentValue = getItemValue(item);

    switch (item.type) {
      case 'boolean':
        return (
          <Switch
            checked={currentValue as boolean}
            onChange={(e) => handleValueChange(item.key, e.target.checked)}
            disabled={!item.editable}
            data-testid={`config-${item.key}`}
          />
        );
      case 'number':
        return (
          <TextField
            type="number"
            size="small"
            value={currentValue}
            onChange={(e) => handleValueChange(item.key, parseInt(e.target.value, 10))}
            disabled={!item.editable}
            sx={{ width: 120 }}
            data-testid={`config-${item.key}`}
          />
        );
      case 'select':
        return (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={currentValue}
              onChange={(e) => handleValueChange(item.key, e.target.value)}
              disabled={!item.editable}
              data-testid={`config-${item.key}`}
            >
              {item.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      default:
        return (
          <TextField
            size="small"
            value={currentValue}
            onChange={(e) => handleValueChange(item.key, e.target.value)}
            disabled={!item.editable}
            sx={{ width: 250 }}
            data-testid={`config-${item.key}`}
          />
        );
    }
  };

  const categoryItems = config?.items.filter((item) => item.category === selectedCategory) || [];

  return (
    <Card data-testid="config-management">
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Configuration Systeme
            </Typography>
          </Box>
          <Tooltip title="Actualiser">
            <IconButton onClick={() => refetch()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erreur lors du chargement de la configuration
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Configuration Content */}
        {!isLoading && config && (
          <>
            {/* Category Tabs */}
            <Tabs
              value={selectedCategory}
              onChange={(_, newValue) => setSelectedCategory(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <Tab
                  key={key}
                  label={label}
                  value={key}
                  data-testid={`tab-${key}`}
                />
              ))}
            </Tabs>

            {/* Tab Panels */}
            {Object.keys(CATEGORY_LABELS).map((category) => (
              <TabPanel
                key={category}
                value={category as ConfigCategory}
                currentValue={selectedCategory}
              >
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Parametre</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Valeur</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoryItems.map((item) => (
                        <TableRow key={item.key} data-testid={`config-row-${item.key}`}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.key}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          </TableCell>
                          <TableCell>{renderValueEditor(item)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {hasUnsavedChanges(item.key) && (
                                <Chip
                                  label="Non sauvegarde"
                                  color="warning"
                                  size="small"
                                />
                              )}
                              {item.editable && hasUnsavedChanges(item.key) && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<SaveIcon />}
                                  onClick={() => handleSave(item.key)}
                                  disabled={updateConfigMutation.isPending}
                                >
                                  Sauvegarder
                                </Button>
                              )}
                              {!item.editable && (
                                <Chip label="Lecture seule" size="small" variant="outlined" />
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {categoryItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                              Aucun parametre dans cette categorie
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            ))}

            {/* Last Modified Info */}
            {config.lastModified && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="caption" color="text.secondary">
                  Derniere modification: {new Date(config.lastModified).toLocaleString('fr-FR')} par{' '}
                  {config.modifiedBy}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Snackbar for feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </CardContent>
    </Card>
  );
};

export default ConfigManagement;
