/**
 * Order Routes
 * API endpoints for nurse medication orders
 */

import { Router, Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { WorkflowService } from '../services/workflowService';
import { NotificationService } from '../services/notificationService';
import { requireNurseRole, AuthenticatedRequest } from '../middleware/nurseAuth';
import { OrderStatus, OrderUrgency } from '../models/NurseOrder';
import { CreateOrderDTO, UpdateOrderDTO, OrderFilters } from '../types';

const router = Router();

/**
 * POST /api/nurse/orders - Create new medication order
 */
router.post(
  '/',
  requireNurseRole,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { dataSource } = req.app.locals;

      if (!dataSource || !dataSource.isInitialized) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Database not connected',
          timestamp: new Date().toISOString(),
        });
      }

      const orderService = new OrderService(dataSource);
      const workflowService = new WorkflowService();
      const notificationService = new NotificationService(req.app.locals.io);

      const {
        patientId,
        medication,
        dosage,
        quantity,
        urgency,
        instructions,
        nurseNotes,
      } = req.body;

      // Validate required fields
      if (!patientId || !medication || !dosage || !quantity) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required fields: patientId, medication, dosage, quantity',
          timestamp: new Date().toISOString(),
        });
      }

      // Create order DTO
      const dto: CreateOrderDTO = {
        nurseId: req.user!.userId,
        patientId,
        medication,
        dosage,
        quantity,
        urgency: urgency as OrderUrgency,
        instructions,
        nurseNotes,
      };

      // Create order
      const order = await orderService.createOrder(dto);

      // Process workflow (stock check + prescription validation)
      const workflowResult = await workflowService.processOrderWorkflow(order);

      // Update order with validation results
      await orderService.updateOrder(order.id, {
        stockValidated: workflowResult.stockCheck.available,
        prescriptionValidated: workflowResult.prescriptionValidation.valid,
      });

      // Send notification
      await notificationService.notifyOrderCreated(order);

      return res.status(201).json({
        order,
        workflow: {
          stockAvailable: workflowResult.stockCheck.available,
          currentStock: workflowResult.stockCheck.currentStock,
          prescriptionValid: workflowResult.prescriptionValidation.valid,
          canProceed: workflowResult.canProceed,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create order',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/nurse/orders - List orders with filters
 */
router.get(
  '/',
  requireNurseRole,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { dataSource } = req.app.locals;

      if (!dataSource || !dataSource.isInitialized) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Database not connected',
          timestamp: new Date().toISOString(),
        });
      }

      const orderService = new OrderService(dataSource);

      const filters: OrderFilters = {
        nurseId: req.query.nurseId as string,
        patientId: req.query.patientId as string,
        pharmacyId: req.query.pharmacyId as string,
        status: req.query.status as OrderStatus,
        urgency: req.query.urgency as OrderUrgency,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await orderService.listOrders(filters);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error listing orders:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list orders',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/nurse/orders/:id - Get order by ID
 */
router.get(
  '/:id',
  requireNurseRole,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { dataSource } = req.app.locals;

      if (!dataSource || !dataSource.isInitialized) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Database not connected',
          timestamp: new Date().toISOString(),
        });
      }

      const orderService = new OrderService(dataSource);
      const { id } = req.params;

      const order = await orderService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(200).json(order);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to fetch order',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * PATCH /api/nurse/orders/:id - Update order status
 */
router.patch(
  '/:id',
  requireNurseRole,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { dataSource } = req.app.locals;

      if (!dataSource || !dataSource.isInitialized) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Database not connected',
          timestamp: new Date().toISOString(),
        });
      }

      const orderService = new OrderService(dataSource);
      const notificationService = new NotificationService(req.app.locals.io);
      const { id } = req.params;

      // Get current order
      const currentOrder = await orderService.getOrderById(id);

      if (!currentOrder) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const previousStatus = currentOrder.status;

      // Create update DTO
      const dto: UpdateOrderDTO = {
        status: req.body.status as OrderStatus,
        pharmacyId: req.body.pharmacyId,
        deliveryId: req.body.deliveryId,
        pharmacistNotes: req.body.pharmacistNotes,
      };

      // Update order
      const updatedOrder = await orderService.updateOrder(id, dto);

      // Send notification if status changed
      if (dto.status && dto.status !== previousStatus) {
        await notificationService.notifyStatusUpdate(updatedOrder, previousStatus);
      }

      return res.status(200).json(updatedOrder);
    } catch (error: any) {
      console.error('Error updating order:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to update order',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * DELETE /api/nurse/orders/:id - Cancel order
 */
router.delete(
  '/:id',
  requireNurseRole,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { dataSource } = req.app.locals;

      if (!dataSource || !dataSource.isInitialized) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Database not connected',
          timestamp: new Date().toISOString(),
        });
      }

      const orderService = new OrderService(dataSource);
      const notificationService = new NotificationService(req.app.locals.io);
      const { id } = req.params;

      const previousStatus = (await orderService.getOrderById(id))?.status;

      if (!previousStatus) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Order ${id} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const cancelledOrder = await orderService.cancelOrder(id);

      // Send notification
      await notificationService.notifyStatusUpdate(cancelledOrder, previousStatus);

      return res.status(200).json({
        message: 'Order cancelled successfully',
        order: cancelledOrder,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to cancel order',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

export default router;
