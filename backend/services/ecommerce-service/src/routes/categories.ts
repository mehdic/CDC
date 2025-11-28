/**
 * Category Routes
 * T3-030: Product Catalog API Endpoints
 */

import { Router } from 'express';
import { getCategories, getCategoryById } from '../controllers/categoryController';

const router = Router();

// GET / - Get category tree
router.get('/', getCategories);

// GET /:id - Get category by ID
router.get('/:id', getCategoryById);

export default router;
