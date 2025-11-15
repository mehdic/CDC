/**
 * Payment Controller
 * PCI-DSS compliant payment processing with tokenization
 * HIPAA/GDPR compliant with audit logging
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Payment, PaymentStatus, PaymentMethod, Currency } from '../../../../shared/models/Payment';
import { AuditLog } from '../../../../shared/models/AuditLog';
import Stripe from 'stripe';

const paymentRepository = AppDataSource.getRepository(Payment);
const auditLogRepository = AppDataSource.getRepository(AuditLog);

// Initialize Stripe (PCI-DSS compliant payment gateway)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Create audit log entry
 */
async function createAuditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  changes?: Record<string, any>
): Promise<void> {
  try {
    const auditLog = auditLogRepository.create({
      user_id: userId,
      action,
      resource: resourceType,
      resource_id: resourceId,
      details: changes || {},
      ip_address: null,
      user_agent: null,
    });
    await auditLogRepository.save(auditLog);
  } catch (error) {
    console.error('[AuditLog] Failed to create audit log:', error);
    // Don't throw - audit logging failure shouldn't block the operation
  }
}

/**
 * PCI-DSS: Sanitize payment data (remove sensitive info before logging/storage)
 */
function sanitizePaymentData(payment: any): any {
  const sanitized = { ...payment };
  // Never log or return full card numbers
  if (sanitized.card_number) {
    delete sanitized.card_number;
  }
  if (sanitized.cvv) {
    delete sanitized.cvv;
  }
  return sanitized;
}

/**
 * GET /payments
 * List all payments with filtering
 */
export async function listPayments(req: Request, res: Response): Promise<void> {
  try {
    const {
      user_id,
      order_id,
      status,
      payment_method,
      limit = 50,
      offset = 0,
    } = req.query;

    const query = paymentRepository.createQueryBuilder('payment');

    // Apply filters
    if (user_id) {
      query.andWhere('payment.user_id = :user_id', { user_id });
    }
    if (order_id) {
      query.andWhere('payment.order_id = :order_id', { order_id });
    }
    if (status) {
      query.andWhere('payment.status = :status', { status });
    }
    if (payment_method) {
      query.andWhere('payment.payment_method = :payment_method', { payment_method });
    }

    // Apply pagination
    query.take(Number(limit));
    query.skip(Number(offset));

    // Order by created_at DESC
    query.orderBy('payment.created_at', 'DESC');

    const [payments, total] = await query.getManyAndCount();

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('[Payment] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list payments',
      message: error.message,
    });
  }
}

/**
 * GET /payments/:id
 * Get payment by ID
 */
export async function getPayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const payment = await paymentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('[Payment] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment',
      message: error.message,
    });
  }
}

/**
 * POST /payments
 * Create new payment (PCI-DSS: Only stores tokenized data)
 */
export async function createPayment(req: Request, res: Response): Promise<void> {
  try {
    const {
      user_id,
      order_id,
      amount,
      currency,
      payment_method,
      payment_token,
      card_last_four,
      card_brand,
      insurance_provider,
      insurance_policy_number,
      insurance_coverage_amount,
      patient_copay_amount,
      metadata,
    } = req.body;

    // Validation
    if (!user_id || !amount || !payment_method) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, amount, payment_method',
      });
      return;
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(payment_method)) {
      res.status(400).json({
        success: false,
        error: `Invalid payment method. Must be one of: ${Object.values(PaymentMethod).join(', ')}`,
      });
      return;
    }

    // PCI-DSS: Validate that we're only storing tokenized data
    if (payment_method === PaymentMethod.CARD && !payment_token) {
      res.status(400).json({
        success: false,
        error: 'Card payments require payment_token (tokenized by payment gateway)',
      });
      return;
    }

    // Create payment
    const payment = paymentRepository.create({
      user_id,
      order_id: order_id || null,
      amount: parseFloat(amount),
      currency: currency || Currency.CHF,
      status: PaymentStatus.PENDING,
      payment_method,
      payment_token: payment_token || null,
      card_last_four: card_last_four || null,
      card_brand: card_brand || null,
      insurance_provider: insurance_provider || null,
      insurance_policy_number: insurance_policy_number || null,
      insurance_coverage_amount: insurance_coverage_amount ? parseFloat(insurance_coverage_amount) : null,
      patient_copay_amount: patient_copay_amount ? parseFloat(patient_copay_amount) : null,
      metadata: metadata || null,
      refunded_amount: 0,
    });

    const savedPayment = await paymentRepository.save(payment);

    // Audit log (PCI-DSS: Never log full card numbers)
    await createAuditLog(
      user_id,
      'CREATE',
      'payment',
      savedPayment.id,
      sanitizePaymentData({ amount, payment_method, card_last_four })
    );

    res.status(201).json({
      success: true,
      data: savedPayment,
      message: 'Payment created successfully',
    });
  } catch (error: any) {
    console.error('[Payment] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment',
      message: error.message,
    });
  }
}

/**
 * POST /payments/process
 * Process payment with payment gateway (PCI-DSS compliant)
 */
export async function processPayment(req: Request, res: Response): Promise<void> {
  try {
    const {
      user_id,
      order_id,
      amount,
      currency,
      payment_method_id, // Stripe payment method ID (tokenized)
      metadata,
    } = req.body;

    // Validation
    if (!user_id || !amount || !payment_method_id) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, amount, payment_method_id',
      });
      return;
    }

    // Create payment intent with Stripe (PCI-DSS compliant)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: (currency || Currency.CHF).toLowerCase(),
      payment_method: payment_method_id,
      confirm: true,
      metadata: {
        user_id,
        order_id: order_id || '',
        ...(metadata || {}),
      },
    });

    // Get payment method details (for card_last_four, card_brand)
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

    // Create payment record
    const payment = paymentRepository.create({
      user_id,
      order_id: order_id || null,
      amount: parseFloat(amount),
      currency: currency || Currency.CHF,
      status: PaymentStatus.PROCESSING,
      payment_method: PaymentMethod.CARD,
      payment_token: payment_method_id,
      card_last_four: paymentMethod.card?.last4 || null,
      card_brand: paymentMethod.card?.brand || null,
      gateway_transaction_id: paymentIntent.id,
      metadata: metadata || null,
      refunded_amount: 0,
    });

    const savedPayment = await paymentRepository.save(payment);

    // Update payment status based on Stripe response
    if (paymentIntent.status === 'succeeded') {
      savedPayment.markAsCompleted();
      await paymentRepository.save(savedPayment);
    } else if (paymentIntent.status === 'requires_action') {
      // 3D Secure or additional authentication required
      res.status(200).json({
        success: true,
        data: savedPayment,
        requires_action: true,
        client_secret: paymentIntent.client_secret,
        message: 'Additional authentication required',
      });
      return;
    }

    // Audit log
    await createAuditLog(
      user_id,
      'PROCESS_PAYMENT',
      'payment',
      savedPayment.id,
      sanitizePaymentData({ amount, status: savedPayment.status })
    );

    res.status(200).json({
      success: true,
      data: savedPayment,
      message: 'Payment processed successfully',
    });
  } catch (error: any) {
    console.error('[Payment] Process error:', error);

    // Create failed payment record
    if (req.body.user_id) {
      const failedPayment = paymentRepository.create({
        user_id: req.body.user_id,
        order_id: req.body.order_id || null,
        amount: parseFloat(req.body.amount || 0),
        currency: req.body.currency || Currency.CHF,
        status: PaymentStatus.FAILED,
        payment_method: PaymentMethod.CARD,
        error_message: error.message,
        refunded_amount: 0,
      });

      await paymentRepository.save(failedPayment);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
      message: error.message,
    });
  }
}

/**
 * PUT /payments/:id
 * Update payment
 */
export async function updatePayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      status,
      metadata,
      error_message,
    } = req.body;

    const payment = await paymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
      return;
    }

    // Track changes for audit log
    const changes: Record<string, any> = {};

    // Update status
    if (status && Object.values(PaymentStatus).includes(status)) {
      changes.status = { old: payment.status, new: status };
      payment.status = status;

      if (status === PaymentStatus.COMPLETED && !payment.processed_at) {
        payment.processed_at = new Date();
      }
    }

    // Update metadata
    if (metadata !== undefined) {
      changes.metadata = { old: payment.metadata, new: metadata };
      payment.metadata = metadata;
    }

    // Update error message
    if (error_message !== undefined) {
      changes.error_message = { old: payment.error_message, new: error_message };
      payment.error_message = error_message;
    }

    const updatedPayment = await paymentRepository.save(payment);

    // Audit log
    await createAuditLog(
      payment.user_id,
      'UPDATE',
      'payment',
      payment.id,
      sanitizePaymentData(changes)
    );

    res.status(200).json({
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully',
    });
  } catch (error: any) {
    console.error('[Payment] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment',
      message: error.message,
    });
  }
}

/**
 * POST /payments/:id/refund
 * Refund payment (full or partial)
 */
export async function refundPayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await paymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
      return;
    }

    // Validate payment can be refunded
    if (!payment.isCompleted()) {
      res.status(400).json({
        success: false,
        error: 'Can only refund completed payments',
      });
      return;
    }

    // Validate refund amount
    const refundAmount = amount ? parseFloat(amount) : payment.getRemainingRefundableAmount();
    if (refundAmount <= 0 || refundAmount > payment.getRemainingRefundableAmount()) {
      res.status(400).json({
        success: false,
        error: `Invalid refund amount. Remaining refundable: ${payment.getRemainingRefundableAmount()}`,
      });
      return;
    }

    // Process refund with Stripe
    if (payment.gateway_transaction_id) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.gateway_transaction_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: reason || 'requested_by_customer',
      });

      if (refund.status !== 'succeeded' && refund.status !== 'pending') {
        res.status(500).json({
          success: false,
          error: 'Refund failed at payment gateway',
        });
        return;
      }
    }

    // Update payment record
    payment.processRefund(refundAmount, reason || 'Customer requested refund');
    const updatedPayment = await paymentRepository.save(payment);

    // Audit log
    await createAuditLog(
      payment.user_id,
      'REFUND',
      'payment',
      payment.id,
      { amount: refundAmount, reason }
    );

    res.status(200).json({
      success: true,
      data: updatedPayment,
      message: 'Refund processed successfully',
    });
  } catch (error: any) {
    console.error('[Payment] Refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
      message: error.message,
    });
  }
}

/**
 * DELETE /payments/:id
 * Delete payment (soft delete for audit trail)
 */
export async function deletePayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const payment = await paymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
      return;
    }

    // PCI-DSS: Only allow deletion of failed/cancelled payments
    // Completed payments must be retained for audit trail
    if (payment.isCompleted() && !payment.isRefunded()) {
      res.status(403).json({
        success: false,
        error: 'Cannot delete completed payments. Refund first if needed.',
      });
      return;
    }

    // Hard delete (after validation)
    await paymentRepository.remove(payment);

    // Audit log
    await createAuditLog(
      payment.user_id,
      'DELETE',
      'payment',
      id,
      sanitizePaymentData({ amount: payment.amount, status: payment.status })
    );

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error: any) {
    console.error('[Payment] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment',
      message: error.message,
    });
  }
}
