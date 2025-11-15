/**
 * Product Catalog Page
 * E-commerce product browsing, search, and cart management
 * Task Group D - E-commerce & Order Management
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import { useProducts, useAddToCart, useUpdateProductInventory } from '../../../shared/hooks/useProducts';
import { ProductCard } from '../components/ecommerce/ProductCard';
import { useSnackbar } from 'notistack';

// ============================================================================
// Component
// ============================================================================

export const ProductCatalog: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [inventoryDialog, setInventoryDialog] = useState<{
    open: boolean;
    productId: string | null;
    quantity: number;
  }>({
    open: false,
    productId: null,
    quantity: 0,
  });
  const [cartDialog, setCartDialog] = useState<{
    open: boolean;
    productId: string | null;
    patientId: string;
    quantity: number;
  }>({
    open: false,
    productId: null,
    patientId: '',
    quantity: 1,
  });

  // Build filters
  const filters = useMemo(() => {
    const f: { category?: string; search?: string } = {};
    if (selectedCategory) f.category = selectedCategory;
    if (searchQuery) f.search = searchQuery;
    return f;
  }, [selectedCategory, searchQuery]);

  // Fetch products
  const { data, isLoading, error, refetch } = useProducts(filters);

  // Mutations
  const addToCartMutation = useAddToCart();
  const updateInventoryMutation = useUpdateProductInventory();

  // Categories
  const categories = ['OTC', 'Parapharmacie', 'Compléments'];

  // Handlers
  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleAddToCart = (productId: string) => {
    setCartDialog({
      open: true,
      productId,
      patientId: '',
      quantity: 1,
    });
  };

  const handleManageInventory = (productId: string) => {
    const product = data?.products.find((p) => p.id === productId);
    setInventoryDialog({
      open: true,
      productId,
      quantity: product?.stock || 0,
    });
  };

  const handleAddToCartSubmit = async () => {
    if (!cartDialog.productId || !cartDialog.patientId) {
      enqueueSnackbar('Veuillez sélectionner un patient', { variant: 'warning' });
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        productId: cartDialog.productId,
        patientId: cartDialog.patientId,
        quantity: cartDialog.quantity,
      });

      enqueueSnackbar('Produit ajouté au panier', {
        variant: 'success',
        'data-testid': 'added-to-cart-toast',
      } as object);

      setCartDialog({ open: false, productId: null, patientId: '', quantity: 1 });
    } catch (err) {
      enqueueSnackbar('Erreur lors de l\'ajout au panier', { variant: 'error' });
    }
  };

  const handleInventoryUpdate = async () => {
    if (!inventoryDialog.productId) return;

    try {
      await updateInventoryMutation.mutateAsync({
        productId: inventoryDialog.productId,
        quantity: inventoryDialog.quantity,
      });

      enqueueSnackbar('Stock mis à jour', {
        variant: 'success',
        'data-testid': 'success-toast',
      } as object);

      setInventoryDialog({ open: false, productId: null, quantity: 0 });
      refetch();
    } catch (err) {
      enqueueSnackbar('Erreur lors de la mise à jour du stock', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Boutique E-commerce
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez votre catalogue de produits et commandes
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher produits..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="category-filter-label">Catégorie</InputLabel>
              <Select
                labelId="category-filter-label"
                id="category-filter"
                value={selectedCategory}
                label="Catégorie"
                onChange={handleCategoryChange}
                data-testid="category-filter"
              >
                <MenuItem value="">Toutes les catégories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur lors du chargement des produits: {error.message}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Product List */}
      {!isLoading && data && (
        <Box data-testid="product-list">
          <Typography variant="h6" sx={{ mb: 2 }}>
            {data.total} produit(s) trouvé(s)
          </Typography>
          <Grid container spacing={3}>
            {data.products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  onManageInventory={handleManageInventory}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && data && data.products.length === 0 && (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun produit trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Essayez de modifier vos filtres de recherche
          </Typography>
        </Paper>
      )}

      {/* Add to Cart Dialog */}
      <Dialog
        open={cartDialog.open}
        onClose={() => setCartDialog({ ...cartDialog, open: false })}
      >
        <DialogTitle>Ajouter au panier patient</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2, minWidth: 400 }}>
            <TextField
              fullWidth
              label="ID Patient"
              value={cartDialog.patientId}
              onChange={(e) =>
                setCartDialog({ ...cartDialog, patientId: e.target.value })
              }
            />
            <TextField
              fullWidth
              type="number"
              label="Quantité"
              value={cartDialog.quantity}
              onChange={(e) =>
                setCartDialog({ ...cartDialog, quantity: parseInt(e.target.value) || 1 })
              }
              inputProps={{ min: 1 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCartDialog({ ...cartDialog, open: false })}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleAddToCartSubmit}
            disabled={addToCartMutation.isPending}
          >
            Ajouter au panier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Management Dialog */}
      <Dialog
        open={inventoryDialog.open}
        onClose={() => setInventoryDialog({ ...inventoryDialog, open: false })}
      >
        <DialogTitle>Gérer stock</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2, minWidth: 400 }}>
            <TextField
              fullWidth
              type="number"
              label="Quantité"
              value={inventoryDialog.quantity}
              onChange={(e) =>
                setInventoryDialog({
                  ...inventoryDialog,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              inputProps={{ min: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInventoryDialog({ ...inventoryDialog, open: false })}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleInventoryUpdate}
            disabled={updateInventoryMutation.isPending}
          >
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductCatalog;
