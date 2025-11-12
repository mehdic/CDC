/**
 * Reorder Suggestions Component
 * Displays AI-powered reorder suggestions based on sales trends and stock levels
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';

interface ReorderSuggestion {
  itemId: string;
  name: string;
  suggestedQuantity: number;
  unit: string;
  reason: string;
}

export function ReorderSuggestions() {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReorderSuggestions();
  }, []);

  const fetchReorderSuggestions = async () => {
    try {
      const response = await fetch('/api/inventory/reorder-suggestions');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching reorder suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = (itemId: string) => {
    console.log('Order now for item:', itemId);
    // In a real implementation, this would navigate to the ordering page
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }} data-testid="reorder-suggestions">
        <CardHeader title="AI Reorder Suggestions" />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }} data-testid="reorder-suggestions">
      <CardHeader title="AI Reorder Suggestions" />
      <CardContent>
        <List data-testid="reorder-list">
          {suggestions.map((suggestion) => (
            <ListItem
              key={suggestion.itemId}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    {suggestion.name}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Suggested quantity: {suggestion.suggestedQuantity} {suggestion.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {suggestion.reason}
                    </Typography>
                  </>
                }
              />
              <Button size="small" variant="outlined" onClick={() => handleOrderNow(suggestion.itemId)}>
                Order Now
              </Button>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
