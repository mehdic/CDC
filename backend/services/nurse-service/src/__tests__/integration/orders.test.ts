/**
 * Integration Tests for Order Routes
 */

import request from 'supertest';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';
import orderRouter from '../../routes/orders';
import { NurseOrder, OrderStatus } from '../../models/NurseOrder';

describe('Order Routes Integration Tests', () => {
  let app: Express;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Mock DataSource
    mockDataSource = {
      isInitialized: true,
      getRepository: jest.fn(),
    } as any;

    // Inject mock DataSource
    app.use((req, res, next) => {
      req.app.locals.dataSource = mockDataSource;
      req.app.locals.io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
      next();
    });

    // Mount routes
    app.use('/api/nurse/orders', orderRouter);
  });

  describe('POST /api/nurse/orders', () => {
    it('should create new order with valid data', async () => {
      const mockOrderRepo = {
        create: jest.fn().mockReturnValue({
          id: 'order-1',
          nurseId: 'nurse-user-id',
          patientId: 'patient-1',
          medication: 'Aspirin',
          dosage: '100mg',
          quantity: 30,
          status: OrderStatus.PENDING,
        }),
        save: jest.fn().mockResolvedValue({
          id: 'order-1',
          nurseId: 'nurse-user-id',
          patientId: 'patient-1',
          medication: 'Aspirin',
          dosage: '100mg',
          quantity: 30,
          status: OrderStatus.PENDING,
        }),
      };

      mockDataSource.getRepository.mockReturnValue(mockOrderRepo as any);

      const response = await request(app)
        .post('/api/nurse/orders')
        .set('Authorization', 'Bearer mock-token')
        .send({
          patientId: 'patient-1',
          medication: 'Aspirin',
          dosage: '100mg',
          quantity: 30,
        });

      expect(response.status).toBe(201);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.medication).toBe('Aspirin');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/nurse/orders')
        .set('Authorization', 'Bearer mock-token')
        .send({
          patientId: 'patient-1',
          // Missing medication, dosage, quantity
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 401 when authorization is missing', async () => {
      const response = await request(app)
        .post('/api/nurse/orders')
        .send({
          patientId: 'patient-1',
          medication: 'Aspirin',
          dosage: '100mg',
          quantity: 30,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/nurse/orders', () => {
    it('should list orders with pagination', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'order-1', medication: 'Aspirin' },
          { id: 'order-2', medication: 'Ibuprofen' },
        ]),
      };

      const mockOrderRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      mockDataSource.getRepository.mockReturnValue(mockOrderRepo as any);

      const response = await request(app)
        .get('/api/nurse/orders')
        .set('Authorization', 'Bearer mock-token')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/nurse/orders/:id', () => {
    it('should return order when found', async () => {
      const mockOrder = {
        id: 'order-1',
        medication: 'Aspirin',
        status: OrderStatus.PENDING,
      };

      const mockOrderRepo = {
        findOne: jest.fn().mockResolvedValue(mockOrder),
      };

      mockDataSource.getRepository.mockReturnValue(mockOrderRepo as any);

      const response = await request(app)
        .get('/api/nurse/orders/order-1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('order-1');
    });

    it('should return 404 when order not found', async () => {
      const mockOrderRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      mockDataSource.getRepository.mockReturnValue(mockOrderRepo as any);

      const response = await request(app)
        .get('/api/nurse/orders/non-existent')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/nurse/orders/:id', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING,
      } as NurseOrder;

      const mockOrderRepo = {
        findOne: jest.fn().mockResolvedValue(mockOrder),
        save: jest.fn().mockResolvedValue({
          ...mockOrder,
          status: OrderStatus.APPROVED,
        }),
      };

      mockDataSource.getRepository.mockReturnValue(mockOrderRepo as any);

      const response = await request(app)
        .patch('/api/nurse/orders/order-1')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: OrderStatus.APPROVED });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(OrderStatus.APPROVED);
    });
  });

  describe('DELETE /api/nurse/orders/:id', () => {
    it('should cancel order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING,
      } as NurseOrder;

      const mockOrderRepo = {
        findOne: jest.fn().mockResolvedValue(mockOrder),
        save: jest.fn().mockResolvedValue({
          ...mockOrder,
          status: OrderStatus.CANCELLED,
        }),
      };

      mockDataSource.getRepository.mockReturnValue(mockOrderRepo as any);

      const response = await request(app)
        .delete('/api/nurse/orders/order-1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe(OrderStatus.CANCELLED);
    });
  });
});
