/**
 * LocationsList Component
 *
 * Displays pharmacy locations under master account
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';

interface Location {
  id: string;
  name: string;
  address: string;
}

interface LocationsListProps {
  locations: Location[];
}

export const LocationsList: React.FC<LocationsListProps> = ({ locations }) => {
  return (
    <Box data-testid="locations-list">
      <Grid container spacing={2}>
        {locations.map((location) => (
          <Grid item xs={12} md={6} key={location.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{location.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {location.address}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {locations.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Aucun emplacement
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
