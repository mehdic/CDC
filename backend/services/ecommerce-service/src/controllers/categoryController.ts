/**
 * Category Controller
 * Handles category operations
 * T3-030: Product Catalog API Endpoints
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Category } from '../../../../shared/models/Category';

/**
 * GET /api/categories
 * Get category tree (hierarchical structure)
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categoryRepository = AppDataSource.getRepository(Category);

    // Get all active categories with their relationships
    const categories = await categoryRepository.find({
      where: { is_active: true },
      relations: ['children', 'parent'],
      order: { display_order: 'ASC', name: 'ASC' },
    });

    // Build tree structure (only root categories with nested children)
    const rootCategories = categories.filter((cat) => cat.parent_id === null);

    const buildTree = (category: Category, depth: number = 0, maxDepth: number = 10): any => {
      // Prevent DoS attacks by limiting recursion depth
      if (depth >= maxDepth) {
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon_url: category.icon_url,
          display_order: category.display_order,
          children: [],
          warning: 'Max depth reached',
        };
      }

      const children = categories.filter(
        (cat) => cat.parent_id === category.id
      );

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon_url: category.icon_url,
        display_order: category.display_order,
        children: children.map((child) => buildTree(child, depth + 1, maxDepth)),
      };
    };

    const tree = rootCategories.map((cat) => buildTree(cat, 0, 10));

    res.json({ data: tree });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve categories',
    });
  }
}

/**
 * GET /api/categories/:id
 * Get category by ID with its products
 */
export async function getCategoryById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const categoryRepository = AppDataSource.getRepository(Category);

    const category = await categoryRepository.findOne({
      where: { id, is_active: true },
      relations: ['products', 'children', 'parent'],
    });

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found',
      });
    }

    res.json({ data: category });
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve category',
    });
  }
}
