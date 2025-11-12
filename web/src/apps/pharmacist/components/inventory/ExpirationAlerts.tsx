/**
 * Expiration Alerts Component
 * Displays a banner when inventory items are expiring within 60 days
 * Clicking the banner filters the main list to show only expiring items
 */

import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle } from '@mui/material';

interface ExpirationAlertsProps {
  onFilterClick: () => void;
}

interface ExpiringItem {
  id: string;
  medication_name: string;
  expiry_date: string;
  quantity: number;
}

export function ExpirationAlerts({ onFilterClick }: ExpirationAlertsProps) {
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringItems();
  }, []);

  const fetchExpiringItems = async () => {
    try {
      const response = await fetch('/api/inventory/expiring');
      if (response.ok) {
        const data = await response.json();
        setExpiringItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching expiring items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || expiringItems.length === 0) {
    return null;
  }

  return (
    <Alert
      severity="error"
      data-testid="expiry-alert"
      onClick={onFilterClick}
      sx={{
        cursor: 'pointer',
        mb: 2,
        '&:hover': {
          backgroundColor: 'error.light',
        },
      }}
    >
      <AlertTitle>Expiration Alert</AlertTitle>
      {expiringItems.length} item{expiringItems.length !== 1 ? 's are' : ' is'} expiring within 60 days. Click to
      view.
      <div data-testid="expiring-items-list" style={{ display: 'none' }}>
        {expiringItems.map((item) => (
          <div key={item.id}>{item.medication_name}</div>
        ))}
      </div>
    </Alert>
  );
}
