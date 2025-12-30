/**
 * Inventory Management Page (Web)
 * Comprehensive inventory dashboard for pharmacists
 *
 * Features:
 * - DataGrid with sortable columns, filtering, pagination
 * - Search by medication name, GTIN, batch number
 * - Filters: low stock, expiring soon, expired, controlled substances
 * - QR Code scanning for quick item addition
 * - Manual item entry via dialog
 * - Low stock and expiration alerts
 * - AI-powered reorder suggestions
 * - Reports generation (stock, expiry, sales)
 * - Item update functionality
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
  IconButton,
  Menu,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useInventoryData } from '../../../shared/hooks/useInventory';
import { AddItemDialog } from '../components/inventory/AddItemDialog';
import { QRScannerDialog } from '../components/inventory/QRScannerDialog';
import { LowStockAlerts } from '../components/inventory/LowStockAlerts';
import { ExpirationAlerts } from '../components/inventory/ExpirationAlerts';
import { ReorderSuggestions } from '../components/inventory/ReorderSuggestions';
import { getUserData } from '../../../shared/services/authService';

export const InventoryManagement: React.FC = () => {
  // Get pharmacy_id from user data for API calls
  const userData = getUserData();
  const pharmacyId = userData?.pharmacyId;
  const { items, loading, fetchItems } = useInventoryData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'expiring' | 'controlled'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [qrScannerOpen, setQRScannerOpen] = useState(false);
  const [reportsMenuAnchor, setReportsMenuAnchor] = useState<null | HTMLElement>(null);
  const [reportViewerOpen, setReportViewerOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [successToastOpen, setSuccessToastOpen] = useState(false);

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
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key={`edit-${params.row.id}`}
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditItem(params.row)}
          showInMenu={false}
          data-testid={`update-stock-btn-${params.row.id}`}
          className="update-stock-btn"
        />,
        <GridActionsCellItem
          key={`delete-${params.row.id}`}
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteItem(params.row.id)}
          showInMenu={false}
          data-testid={`delete-item-btn-${params.row.id}`}
        />,
      ],
    },
  ];

  const isExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 60 && diffDays > 0;
  };

  const handleAddItemClick = () => {
    setAddDialogOpen(true);
  };

  const handleQRScanClick = () => {
    setQRScannerOpen(true);
  };

  const handleItemSaved = () => {
    fetchItems({ filter });
    setSuccessToastOpen(true);
  };

  const handleQRScanned = (data: any) => {
    console.log('QR scanned data:', data);
    fetchItems({ filter });
    setSuccessToastOpen(true);
  };

  const handleFilterChange = (newFilter: 'all' | 'low_stock' | 'expiring' | 'controlled') => {
    setFilter(newFilter);
  };

  const handleLowStockAlertClick = () => {
    setFilter('low_stock');
  };

  const handleExpiryAlertClick = () => {
    setFilter('expiring');
  };

  const handleEditItem = (item: any) => {
    // Ensure quantity is a valid number when opening dialog
    setEditingItem({
      ...item,
      quantity: typeof item.quantity === 'number' ? item.quantity : 0,
    });
  };

  const handleUpdateItem = async (updatedData: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${
          import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000'
        }/api/inventory/items/${editingItem.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ ...updatedData, pharmacy_id: pharmacyId }),
        }
      );

      if (response.ok) {
        setEditingItem(null);
        fetchItems({ filter });
        setSuccessToastOpen(true);
      } else {
        const errorData = await response.json();
        console.error('Error updating item:', errorData);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${
          import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000'
        }/api/inventory/items/${itemId}?pharmacy_id=${pharmacyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        }
      );

      if (response.ok) {
        fetchItems({ filter });
        setSuccessToastOpen(true);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleReportsClick = (event: React.MouseEvent<HTMLElement>) => {
    setReportsMenuAnchor(event.currentTarget);
  };

  const handleReportsMenuClose = () => {
    setReportsMenuAnchor(null);
  };

  const handleGenerateReport = async (reportType: 'stock' | 'expiry' | 'sales') => {
    handleReportsMenuClose();

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${
          import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000'
        }/api/inventory/items/reports/${reportType}?pharmacy_id=${pharmacyId}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentReport({ type: reportType, data: data.report });
        setReportViewerOpen(true);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const filteredItems = items.filter((item: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.medication_name.toLowerCase().includes(search) ||
      item.medication_gtin.toLowerCase().includes(search)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
            onClick={handleReportsClick}
          >
            Reports
          </Button>
          <Button variant="outlined" onClick={handleQRScanClick} startIcon={<QrCodeScannerIcon />}>
            Scan QR
          </Button>
          <Button variant="contained" color="primary" onClick={handleAddItemClick}>
            Add Item
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      <LowStockAlerts onFilterClick={handleLowStockAlertClick} />
      <ExpirationAlerts onFilterClick={handleExpiryAlertClick} />

      {/* Reorder Suggestions */}
      <ReorderSuggestions />

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search medications"
            placeholder="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value as any)}
              label="Filter"
              data-testid="category-filter"
            >
              <MenuItem value="all">All Items</MenuItem>
              <MenuItem value="low_stock">Low Stock</MenuItem>
              <MenuItem value="expiring">Expiring Soon</MenuItem>
              <MenuItem value="controlled">Controlled Substances</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* DataGrid */}
      <Paper sx={{ height: 600 }} data-testid="inventory-list">
        <DataGrid
          rows={filteredItems}
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
          data-testid="inventory-list"
          getRowId={(row) => row.id}
          slotProps={{
            row: {
              'data-testid': (params: any) => `item-${params.id}`,
            } as any,
          }}
          sx={{
            '& .MuiDataGrid-root': {
              '[data-testid="inventory-list"]': {},
            },
          }}
        />
      </Paper>

      {/* Dialogs */}
      <AddItemDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onSave={handleItemSaved} />
      <QRScannerDialog open={qrScannerOpen} onClose={() => setQRScannerOpen(false)} onScan={handleQRScanned} />

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog
          open={true}
          onClose={() => setEditingItem(null)}
          maxWidth="sm"
          fullWidth
          data-testid="stock-update-form"
        >
          <DialogTitle>Update Stock Level</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={editingItem.quantity ?? 0}
                inputProps={{
                  'aria-label': 'quantity',
                  min: 0,
                  'data-testid': 'quantity-input'
                }}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                  setEditingItem({ ...editingItem, quantity: isNaN(val) ? 0 : val });
                }}
                data-testid="quantity-field"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingItem(null)} data-testid="cancel-update-btn">Cancel</Button>
            <Button
              onClick={() => handleUpdateItem({ quantity: editingItem.quantity })}
              variant="contained"
              disabled={editingItem.quantity === undefined || isNaN(editingItem.quantity)}
              data-testid="submit-update-btn"
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Reports Menu */}
      <Menu anchorEl={reportsMenuAnchor} open={Boolean(reportsMenuAnchor)} onClose={handleReportsMenuClose}>
        <MenuItem onClick={() => handleGenerateReport('stock')}>Stock Report</MenuItem>
        <MenuItem onClick={() => handleGenerateReport('expiry')}>Expiry Report</MenuItem>
        <MenuItem onClick={() => handleGenerateReport('sales')}>Sales Report</MenuItem>
      </Menu>

      {/* Report Viewer Dialog */}
      <Dialog open={reportViewerOpen} onClose={() => setReportViewerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentReport?.type === 'stock' && 'Stock Report'}
          {currentReport?.type === 'expiry' && 'Expiry Report'}
          {currentReport?.type === 'sales' && 'Sales Report'}
        </DialogTitle>
        <DialogContent data-testid="report-viewer">
          {currentReport && (
            <Box sx={{ pt: 2 }}>
              <pre>{JSON.stringify(currentReport.data, null, 2)}</pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportViewerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success Toast */}
      <Snackbar
        open={successToastOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessToastOpen(false)}
        message="Operation completed successfully"
      />
      <div data-testid="success-toast" style={{ display: successToastOpen ? 'block' : 'none' }}>
        Success
      </div>
    </Box>
  );
};

export default InventoryManagement;
