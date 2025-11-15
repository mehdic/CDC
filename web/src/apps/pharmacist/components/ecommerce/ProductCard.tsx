/**
 * Product Card Component
 * Displays individual product with stock info and actions
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { Product } from '../../../../shared/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onManageInventory?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onManageInventory,
}) => {
  const isOutOfStock = product.stock === 0;

  return (
    <Card
      data-testid={`product-${product.id}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: isOutOfStock ? 0.6 : 1,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={1}>
          {/* Product Name */}
          <Typography variant="h6" component="h3" gutterBottom>
            {product.name}
          </Typography>

          {/* Category */}
          <Chip
            label={product.category}
            size="small"
            color="primary"
            variant="outlined"
          />

          {/* Price */}
          <Typography variant="h5" color="primary" fontWeight="bold">
            {product.price.toFixed(2)} CHF
          </Typography>

          {/* Stock Level */}
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              data-testid="stock-level"
            >
              Stock: {product.stock} unités
            </Typography>
          </Box>

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <Chip
              label="Rupture de stock"
              color="error"
              size="small"
              data-testid="out-of-stock-badge"
            />
          )}

          {/* Prescription Required */}
          {product.requiresPrescription && (
            <Chip
              label="Ordonnance requise"
              color="warning"
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Stack direction="row" spacing={1} width="100%">
          {onAddToCart && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CartIcon />}
              onClick={() => onAddToCart(product.id)}
              disabled={isOutOfStock}
              fullWidth
            >
              Ajouter au panier
            </Button>
          )}
          {onManageInventory && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<InventoryIcon />}
              onClick={() => onManageInventory(product.id)}
            >
              Gérer stock
            </Button>
          )}
        </Stack>
      </CardActions>
    </Card>
  );
};
