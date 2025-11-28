/**
 * Product Routes
 * T3-030: Product Catalog API Endpoints
 */

import { Router } from 'express';
import {
  listProducts,
  getProductById,
  searchProducts,
} from '../controllers/productController';

const router = Router();

// GET /search - Must be before /:id to avoid route collision
router.get('/search', searchProducts);

// GET / - List products with pagination/filters
router.get('/', listProducts);

// GET /:id - Get product by ID
router.get('/:id', getProductById);

export default router;
