/**
 * Unit Tests for OrderService
 */

import { DataSource, Repository } from 'typeorm';
import { OrderService } from '../../services/orderService';
import { NurseOrder, OrderStatus, OrderUrgency } from '../../models/NurseOrder';

describe('OrderService', () => {
  let orderService: OrderService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockOrderRepo: jest.Mocked<Repository<NurseOrder>>;

  beforeEach(() => {
    // Create mock repository
    mockOrderRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockOrderRepo),
    } as any;

    orderService = new OrderService(mockDataSource);
  });

  describe('createOrder', () => {
    it('should create a new order successfully', async () => {
      const dto = {
        nurseId: 'nurse-1',
        patientId: 'patient-1',
        medication: 'Aspirin',
        dosage: '100mg',
        quantity: 30,
        urgency: OrderUrgency.ROUTINE,
      };

      const mockOrder = {
        id: 'order-1',
        ...dto,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
      } as NurseOrder;

      mockOrderRepo.create.mockReturnValue(mockOrder);
      mockOrderRepo.save.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(dto);

      expect(mockOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nurseId: dto.nurseId,
          patientId: dto.patientId,
          medication: dto.medication,
          dosage: dto.dosage,
          quantity: dto.quantity,
          status: OrderStatus.PENDING,
        })
      );
      expect(mockOrderRepo.save).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual(mockOrder);
    });

    it('should throw error if required fields are missing', async () => {
      const dto = {
        nurseId: 'nurse-1',
        patientId: '',
        medication: 'Aspirin',
        dosage: '100mg',
        quantity: 30,
      };

      await expect(orderService.createOrder(dto)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw error if quantity is invalid', async () => {
      const dto = {
        nurseId: 'nurse-1',
        patientId: 'patient-1',
        medication: 'Aspirin',
        dosage: '100mg',
        quantity: 0,
      };

      await expect(orderService.createOrder(dto)).rejects.toThrow(
        'Quantity must be greater than 0'
      );
    });
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const mockOrder = {
        id: 'order-1',
        nurseId: 'nurse-1',
        patientId: 'patient-1',
        medication: 'Aspirin',
        status: OrderStatus.PENDING,
      } as NurseOrder;

      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1');

      expect(mockOrderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        relations: ['nurse', 'patient'],
      });
      expect(result).toEqual(mockOrder);
    });

    it('should return null when order not found', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      const result = await orderService.getOrderById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateOrder', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING,
      } as NurseOrder;

      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockOrderRepo.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.APPROVED,
        approvedAt: expect.any(Date),
      });

      const result = await orderService.updateOrder('order-1', {
        status: OrderStatus.APPROVED,
      });

      expect(result.status).toBe(OrderStatus.APPROVED);
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw error if order not found', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(
        orderService.updateOrder('non-existent', { status: OrderStatus.APPROVED })
      ).rejects.toThrow('Order non-existent not found');
    });

    it('should throw error for invalid status transition', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DELIVERED,
      } as NurseOrder;

      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      await expect(
        orderService.updateOrder('order-1', { status: OrderStatus.PENDING })
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel pending order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING,
      } as NurseOrder;

      mockOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockOrderRepo.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      });

      const result = await orderService.cancelOrder('order-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancelledAt).toBeDefined();
    });

    it('should not cancel delivered order', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DELIVERED,
      } as NurseOrder;

      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      await expect(orderService.cancelOrder('order-1')).rejects.toThrow(
        'Cannot cancel order in delivered status'
      );
    });
  });

  describe('listOrders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: 'order-1', status: OrderStatus.PENDING },
        { id: 'order-2', status: OrderStatus.APPROVED },
      ] as NurseOrder[];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      mockOrderRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await orderService.listOrders({
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });
});
