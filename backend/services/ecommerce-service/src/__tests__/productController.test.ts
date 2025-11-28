/**
 * Product Controller Unit Tests
 * T3-030: Product Catalog API Endpoints
 */

import { Request, Response } from 'express';
import { listProducts, getProductById, searchProducts } from '../controllers/productController';
import { AppDataSource } from '../config/database';

// Mock TypeORM
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Product Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockRepository: any;

  beforeEach(() => {
    mockRequest = {
      query: {},
      params: {},
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listProducts', () => {
    it('should list products with default pagination', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 10.99 },
        { id: '2', name: 'Product 2', price: 15.99 },
      ];

      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([
        mockProducts,
        2,
      ]);

      mockRequest.query = {};

      await listProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          total_pages: 1,
        },
      });
    });

    it('should filter products by category', async () => {
      const mockProducts = [{ id: '1', name: 'Product 1', category_id: 'cat-1' }];

      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([
        mockProducts,
        1,
      ]);

      mockRequest.query = { category_id: 'cat-1' };

      await listProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRepository.createQueryBuilder().getManyAndCount.mockRejectedValue(
        new Error('Database error')
      );

      await listProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to retrieve products',
      });
    });
  });

  describe('getProductById', () => {
    it('should return product details when found', async () => {
      const mockProduct = {
        id: 'prod-123',
        name: 'Test Product',
        price: 19.99,
        is_active: true,
      };

      mockRepository.findOne.mockResolvedValue(mockProduct);

      mockRequest.params = { id: 'prod-123' };

      await getProductById(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'prod-123', is_active: true },
        relations: ['category'],
      });

      expect(mockResponse.json).toHaveBeenCalledWith({ data: mockProduct });
    });

    it('should return 404 when product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      mockRequest.params = { id: 'nonexistent' };

      await getProductById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Product not found',
      });
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      mockRequest.params = { id: 'prod-123' };

      await getProductById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to retrieve product',
      });
    });
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockProducts = [
        { id: '1', name: 'Aspirin', description: 'Pain relief' },
        { id: '2', name: 'Ibuprofen', description: 'Pain killer' },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockProducts);

      mockRequest.query = { q: 'pain' };

      await searchProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockProducts,
        query: 'pain',
        count: 2,
      });
    });

    it('should return 400 when query is missing', async () => {
      mockRequest.query = {};

      await searchProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Search query parameter "q" is required',
      });
    });

    it('should limit search results to 50 max', async () => {
      mockRepository.createQueryBuilder().getMany.mockResolvedValue([]);

      mockRequest.query = { q: 'test', limit: '100' };

      await searchProducts(mockRequest as Request, mockResponse as Response);

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.take).toHaveBeenCalledWith(50); // Max limit enforced
    });

    it('should handle search errors', async () => {
      mockRepository.createQueryBuilder().getMany.mockRejectedValue(
        new Error('Search error')
      );

      mockRequest.query = { q: 'test' };

      await searchProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to search products',
      });
    });
  });
});
