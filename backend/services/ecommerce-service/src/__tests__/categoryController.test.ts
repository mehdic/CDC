/**
 * Category Controller Unit Tests
 * T3-030: Product Catalog API Endpoints
 */

import { Request, Response } from 'express';
import { getCategories, getCategoryById } from '../controllers/categoryController';
import { AppDataSource } from '../config/database';
import { Category } from '../../../../shared/models/Category';

// Mock TypeORM
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Category Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockRepository: any;

  beforeEach(() => {
    mockRequest = {
      query: {},
      params: {},
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should return empty tree when no categories exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      await getCategories(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return flat tree structure with single root category', async () => {
      const mockCategories: Partial<Category>[] = [
        {
          id: '1',
          name: 'Medications',
          slug: 'medications',
          description: 'All medications',
          icon_url: 'icon.jpg',
          display_order: 1,
          parent_id: null,
        },
      ];

      mockRepository.find.mockResolvedValue(mockCategories);

      await getCategories(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [
          {
            id: '1',
            name: 'Medications',
            slug: 'medications',
            description: 'All medications',
            icon_url: 'icon.jpg',
            display_order: 1,
            children: [],
          },
        ],
      });
    });

    it('should build nested tree with multiple levels', async () => {
      const mockCategories: Partial<Category>[] = [
        {
          id: '1',
          name: 'Medications',
          slug: 'medications',
          description: 'All medications',
          icon_url: 'icon.jpg',
          display_order: 1,
          parent_id: null,
        },
        {
          id: '2',
          name: 'Antibiotics',
          slug: 'antibiotics',
          description: 'Antibiotic medications',
          icon_url: 'icon2.jpg',
          display_order: 1,
          parent_id: '1',
        },
        {
          id: '3',
          name: 'Penicillin',
          slug: 'penicillin',
          description: 'Penicillin type',
          icon_url: 'icon3.jpg',
          display_order: 1,
          parent_id: '2',
        },
      ];

      mockRepository.find.mockResolvedValue(mockCategories);

      await getCategories(
        mockRequest as Request,
        mockResponse as Response
      );

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.data).toHaveLength(1);
      expect(response.data[0].id).toBe('1');
      expect(response.data[0].children).toHaveLength(1);
      expect(response.data[0].children[0].id).toBe('2');
      expect(response.data[0].children[0].children).toHaveLength(1);
      expect(response.data[0].children[0].children[0].id).toBe('3');
    });

    it('should limit recursion depth to prevent DoS attacks', async () => {
      // Create a deep category hierarchy (15 levels)
      const deepCategories: Partial<Category>[] = [];
      for (let i = 1; i <= 15; i++) {
        deepCategories.push({
          id: `${i}`,
          name: `Category ${i}`,
          slug: `category-${i}`,
          description: `Category level ${i}`,
          icon_url: 'icon.jpg',
          display_order: 1,
          parent_id: i === 1 ? null : `${i - 1}`,
        });
      }

      mockRepository.find.mockResolvedValue(deepCategories);

      await getCategories(
        mockRequest as Request,
        mockResponse as Response
      );

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      let currentNode = response.data[0];
      let depth = 0;

      // Traverse the tree to count actual depth
      while (currentNode.children && currentNode.children.length > 0) {
        currentNode = currentNode.children[0];
        depth++;
      }

      // Depth should be capped at 10 (max depth - 1 for the root)
      expect(depth).toBeLessThanOrEqual(10);
      // The 10th level should have the warning
      expect(currentNode.warning).toBe('Max depth reached');
    });

    it('should handle multiple root categories', async () => {
      const mockCategories: Partial<Category>[] = [
        {
          id: '1',
          name: 'Medications',
          slug: 'medications',
          description: 'All medications',
          icon_url: 'icon.jpg',
          display_order: 1,
          parent_id: null,
        },
        {
          id: '2',
          name: 'Parapharmacy',
          slug: 'parapharmacy',
          description: 'Parapharmacy products',
          icon_url: 'icon.jpg',
          display_order: 2,
          parent_id: null,
        },
      ];

      mockRepository.find.mockResolvedValue(mockCategories);

      await getCategories(
        mockRequest as Request,
        mockResponse as Response
      );

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.data).toHaveLength(2);
      expect(response.data[0].id).toBe('1');
      expect(response.data[1].id).toBe('2');
    });

    it('should handle database errors gracefully', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await getCategories(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to retrieve categories',
      });
    });
  });

  describe('getCategoryById', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });

    it('should return category by id', async () => {
      const mockCategory: Partial<Category> = {
        id: '1',
        name: 'Medications',
        slug: 'medications',
        description: 'All medications',
        icon_url: 'icon.jpg',
        display_order: 1,
        parent_id: null,
      };

      mockRepository.findOne.mockResolvedValue(mockCategory);

      await getCategoryById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', is_active: true },
        relations: ['products', 'children', 'parent'],
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ data: mockCategory });
    });

    it('should return 404 when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await getCategoryById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Category not found',
      });
    });

    it('should handle database errors gracefully', async () => {
      mockRepository.findOne.mockRejectedValue(
        new Error('Database error')
      );

      await getCategoryById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to retrieve category',
      });
    });
  });
});
