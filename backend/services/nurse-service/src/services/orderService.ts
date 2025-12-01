/**
 * Order Service
 * Core business logic for nurse medication orders
 */

import { DataSource, Repository } from 'typeorm';
import { NurseOrder, OrderStatus } from '../models/NurseOrder';
import {
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderFilters,
  PaginatedResponse,
} from '../types';

export class OrderService {
  private orderRepo: Repository<NurseOrder>;

  constructor(private dataSource: DataSource) {
    this.orderRepo = this.dataSource.getRepository(NurseOrder);
  }

  /**
   * Create a new medication order
   */
  async createOrder(dto: CreateOrderDTO): Promise<NurseOrder> {
    // Validate required fields
    if (!dto.nurseId || !dto.patientId || !dto.medication || !dto.dosage) {
      throw new Error('Missing required fields: nurseId, patientId, medication, dosage');
    }

    if (!dto.quantity || dto.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const order = this.orderRepo.create({
      nurseId: dto.nurseId,
      patientId: dto.patientId,
      medication: dto.medication,
      dosage: dto.dosage,
      quantity: dto.quantity,
      urgency: dto.urgency,
      instructions: dto.instructions,
      nurseNotes: dto.nurseNotes,
      status: OrderStatus.PENDING,
    });

    return await this.orderRepo.save(order);
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<NurseOrder | null> {
    return await this.orderRepo.findOne({
      where: { id },
      relations: ['nurse', 'patient'],
    });
  }

  /**
   * List orders with filters and pagination
   */
  async listOrders(filters: OrderFilters): Promise<PaginatedResponse<NurseOrder>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepo.createQueryBuilder('order');

    // Apply filters
    if (filters.nurseId) {
      queryBuilder.andWhere('order.nurseId = :nurseId', { nurseId: filters.nurseId });
    }

    if (filters.patientId) {
      queryBuilder.andWhere('order.patientId = :patientId', { patientId: filters.patientId });
    }

    if (filters.pharmacyId) {
      queryBuilder.andWhere('order.pharmacyId = :pharmacyId', { pharmacyId: filters.pharmacyId });
    }

    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters.urgency) {
      queryBuilder.andWhere('order.urgency = :urgency', { urgency: filters.urgency });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    const orders = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .leftJoinAndSelect('order.nurse', 'nurse')
      .leftJoinAndSelect('order.patient', 'patient')
      .getMany();

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update order status and fields
   */
  async updateOrder(id: string, dto: UpdateOrderDTO): Promise<NurseOrder> {
    const order = await this.orderRepo.findOne({ where: { id } });

    if (!order) {
      throw new Error(`Order ${id} not found`);
    }

    // Validate status transitions
    if (dto.status && !this.isValidStatusTransition(order.status, dto.status)) {
      throw new Error(`Invalid status transition from ${order.status} to ${dto.status}`);
    }

    // Update fields
    if (dto.status) {
      order.status = dto.status;

      // Update timestamps based on status
      if (dto.status === OrderStatus.APPROVED) {
        order.approvedAt = new Date();
      } else if (dto.status === OrderStatus.DELIVERED) {
        order.deliveredAt = new Date();
      } else if (dto.status === OrderStatus.CANCELLED) {
        order.cancelledAt = new Date();
      }
    }

    if (dto.pharmacyId !== undefined) {
      order.pharmacyId = dto.pharmacyId;
    }

    if (dto.deliveryId !== undefined) {
      order.deliveryId = dto.deliveryId;
    }

    if (dto.pharmacistNotes !== undefined) {
      order.pharmacistNotes = dto.pharmacistNotes;
    }

    if (dto.stockValidated !== undefined) {
      order.stockValidated = dto.stockValidated;
    }

    if (dto.prescriptionValidated !== undefined) {
      order.prescriptionValidated = dto.prescriptionValidated;
    }

    return await this.orderRepo.save(order);
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string): Promise<NurseOrder> {
    const order = await this.orderRepo.findOne({ where: { id } });

    if (!order) {
      throw new Error(`Order ${id} not found`);
    }

    // Can only cancel pending or approved orders
    if (![OrderStatus.PENDING, OrderStatus.APPROVED].includes(order.status)) {
      throw new Error(`Cannot cancel order in ${order.status} status`);
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();

    return await this.orderRepo.save(order);
  }

  /**
   * Validate status transition
   */
  private isValidStatusTransition(current: OrderStatus, next: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.APPROVED, OrderStatus.CANCELLED],
      [OrderStatus.APPROVED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [], // Terminal state
      [OrderStatus.CANCELLED]: [], // Terminal state
    };

    return validTransitions[current]?.includes(next) || false;
  }

  /**
   * Get order count by status
   */
  async getOrderCountByStatus(nurseId?: string): Promise<Record<OrderStatus, number>> {
    const queryBuilder = this.orderRepo.createQueryBuilder('order');

    if (nurseId) {
      queryBuilder.where('order.nurseId = :nurseId', { nurseId });
    }

    const orders = await queryBuilder.getMany();

    const counts = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.APPROVED]: 0,
      [OrderStatus.PREPARING]: 0,
      [OrderStatus.READY]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
    };

    orders.forEach(order => {
      counts[order.status]++;
    });

    return counts;
  }
}
