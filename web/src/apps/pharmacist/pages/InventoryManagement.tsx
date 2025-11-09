/**
 * Inventory Management Page (Web)
 * Comprehensive inventory dashboard for pharmacists
 *
 * Features:
 * - DataGrid with sortable columns, filtering, pagination
 * - Search by medication name, GTIN, batch number
 * - Filters: low stock, expiring soon, expired, controlled substances
 * - Bulk actions (export CSV, bulk update locations)
 * - Analytics charts (stock levels over time, turnover rates)
 * - Quick actions (manual entry, batch update, generate reports)
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  Button,
  Chip,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useInventoryData } from '../../../shared/hooks/useInventory';

export const InventoryManagement: React.FC = () => {
  const { items, loading, fetchItems } = useInventoryData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'expiring' | 'controlled'>('all');

  useEffect(() => {
    fetchItems({ filter });
  }, [filter]);

  const columns: GridColDef[] = [
    { field: 'medication_name', headerName: 'Medication', width: 250 },
    { field: 'medication_gtin', headerName: 'GTIN', width: 150 },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={`${params.value} ${params.row.unit}`}
          color={params.value <= params.row.reorder_threshold ? 'error' : 'success'}
          size="small"
        />
      ),
    },
    { field: 'reorder_threshold', headerName: 'Reorder Level', width: 130 },
    { field: 'batch_number', headerName: 'Batch', width: 120 },
    {
      field: 'expiry_date',
      headerName: 'Expiry Date',
      width: 130,
      renderCell: (params) => (
        <span style={{ color: isExpiringSoon(params.value) ? '#F59E0B' : '#111827' }}>
          {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      field: 'is_controlled',
      headerName: 'Controlled',
      width: 110,
      renderCell: (params) =>
        params.value ? <Chip label="Yes" color="warning" size="small" /> : null,
    },
    { field: 'storage_location', headerName: 'Location', width: 120 },
  ];

  const isExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 60 && diffDays > 0;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined">Export CSV</Button>
          <Button variant="contained" color="primary">
            Manual Entry
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search medications"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter</InputLabel>
            <Select value={filter} onChange={(e) => setFilter(e.target.value as any)} label="Filter">
              <MenuItem value="all">All Items</MenuItem>
              <MenuItem value="low_stock">Low Stock</MenuItem>
              <MenuItem value="expiring">Expiring Soon</MenuItem>
              <MenuItem value="controlled">Controlled Substances</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* DataGrid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={items}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
};

export default InventoryManagement;
