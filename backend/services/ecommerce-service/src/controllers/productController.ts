/**
 * Product Controller
 * Handles product catalog operations
 * T3-030: Product Catalog API Endpoints
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Product } from '../../../../shared/models/Product';
import { Like, FindOptionsWhere } from 'typeorm';

/**
 * GET /api/products
 * List products with pagination and filters
 */
export async function listProducts(req: Request, res: Response) {
  try {
    const {
      page = '1',
      limit = '20',
      category_id,
      search,
      requires_prescription,
      min_price,
      max_price,
      in_stock_only = 'false',
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const productRepository = AppDataSource.getRepository(Product);

    // Build where clause
    const where: FindOptionsWhere<Product> = {
      is_active: true,
    };

    if (category_id) {
      where.category_id = category_id as string;
    }

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (requires_prescription !== undefined) {
      where.requires_prescription = requires_prescription === 'true';
    }

    // Get products
    const queryBuilder = productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where(where);

    // Price filters
    if (min_price) {
      queryBuilder.andWhere('product.price >= :min_price', {
        min_price: parseFloat(min_price as string),
      });
    }

    if (max_price) {
      queryBuilder.andWhere('product.price <= :max_price', {
        max_price: parseFloat(max_price as string),
      });
    }

    // Stock filter
    if (in_stock_only === 'true') {
      queryBuilder.andWhere('product.stock > 0');
    }

    // Sorting
    const validSortFields = ['created_at', 'name', 'price', 'rating'];
    const sortField = validSortFields.includes(sort_by as string)
      ? (sort_by as string)
      : 'created_at';
    const sortDirection =
      (sort_order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`product.${sortField}`, sortDirection);

    // Pagination
    queryBuilder.skip(skip).take(limitNum);

    const [products, total] = await queryBuilder.getManyAndCount();

    res.json({
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error listing products:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve products',
    });
  }
}

/**
 * GET /api/products/:id
 * Get product details by ID
 */
export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository.findOne({
      where: { id, is_active: true },
      relations: ['category'],
    });

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found',
      });
    }

    res.json({ data: product });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve product',
    });
  }
}

/**
 * GET /api/products/search
 * Full-text search for products
 */
export async function searchProducts(req: Request, res: Response) {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query parameter "q" is required',
      });
    }

    const limitNum = Math.min(parseInt(limit as string, 10), 50);

    const productRepository = AppDataSource.getRepository(Product);

    const products = await productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.is_active = :is_active', { is_active: true })
      .andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
        { search: `%${q}%` }
      )
      .orderBy('product.rating', 'DESC')
      .addOrderBy('product.review_count', 'DESC')
      .take(limitNum)
      .getMany();

    res.json({
      data: products,
      query: q,
      count: products.length,
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search products',
    });
  }
}
