/**
 * Low Stock Alerts Component
 * Displays a banner when inventory items are running low
 * Clicking the banner filters the main list to show only low stock items
 */

import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle } from '@mui/material';

interface LowStockAlertsProps {
  onFilterClick: () => void;
}

interface LowStockItem {
  id: string;
  medication_name: string;
  quantity: number;
  reorder_threshold: number;
}

export function LowStockAlerts({ onFilterClick }: LowStockAlertsProps) {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      const response = await fetch('/api/inventory/low-stock');
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || lowStockItems.length === 0) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      data-testid="low-stock-alert"
      onClick={onFilterClick}
      sx={{
        cursor: 'pointer',
        mb: 2,
        '&:hover': {
          backgroundColor: 'warning.light',
        },
      }}
    >
      <AlertTitle>Low Stock Alert</AlertTitle>
      {lowStockItems.length} item{lowStockItems.length !== 1 ? 's are' : ' is'} running low on stock. Click to
      view.
      <div data-testid="low-stock-list" style={{ display: 'none' }}>
        {lowStockItems.map((item) => (
          <div key={item.id}>{item.medication_name}</div>
        ))}
      </div>
    </Alert>
  );
}
