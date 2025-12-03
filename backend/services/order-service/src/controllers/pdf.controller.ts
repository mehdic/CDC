/**
 * PDF Controller
 * Handles PDF export endpoints for order history
 * Task T5-051 - Order History PDF Export
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Order } from '../../../../shared/models/Order';
import { PDFExportService } from '../services/pdf-export.service';

/**
 * GET /export/pdf
 * Export order history as PDF with optional date range filtering
 *
 * Query parameters:
 * - patientId (required): UUID of the patient/user
 * - startDate (optional): ISO date string (YYYY-MM-DD)
 * - endDate (optional): ISO date string (YYYY-MM-DD)
 * - pharmacyId (optional): UUID of pharmacy (for nurse access control)
 *
 * Response: application/pdf stream
 */
export async function exportOrderHistoryPDF(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const orderRepo = dataSource.getRepository(Order);
    const pharmacyRepo = dataSource.getRepository('Pharmacy');

    // Validate required parameters
    const { patientId, startDate, endDate, pharmacyId } = req.query;

    if (!patientId || typeof patientId !== 'string') {
      res.status(400).json({
        error: 'patientId query parameter is required',
      });
      return;
    }

    // Validate and parse dates
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate && typeof startDate === 'string') {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        res.status(400).json({
          error: 'Invalid startDate format. Use YYYY-MM-DD',
        });
        return;
      }
      // Set to start of day
      start.setHours(0, 0, 0, 0);
      parsedStartDate = start;
    }

    if (endDate && typeof endDate === 'string') {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        res.status(400).json({
          error: 'Invalid endDate format. Use YYYY-MM-DD',
        });
        return;
      }
      // Set to end of day
      end.setHours(23, 59, 59, 999);
      parsedEndDate = end;
    }

    // Validate date range
    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      res.status(400).json({
        error: 'startDate must be before endDate',
      });
      return;
    }

    // Build query to fetch orders
    let queryBuilder = orderRepo
      .createQueryBuilder('order')
      .where('order.user_id = :userId', { userId: patientId })
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.pharmacy', 'pharmacy')
      .orderBy('order.created_at', 'DESC');

    // Apply date range filters
    if (parsedStartDate) {
      queryBuilder = queryBuilder.andWhere('order.created_at >= :startDate', {
        startDate: parsedStartDate,
      });
    }

    if (parsedEndDate) {
      queryBuilder = queryBuilder.andWhere('order.created_at <= :endDate', {
        endDate: parsedEndDate,
      });
    }

    // Apply pharmacy filter if provided (for access control)
    if (pharmacyId && typeof pharmacyId === 'string') {
      queryBuilder = queryBuilder.andWhere('order.pharmacy_id = :pharmacyId', {
        pharmacyId,
      });
    }

    // Execute query
    const orders = await queryBuilder.getMany();

    if (orders.length === 0) {
      res.status(404).json({
        error: 'No orders found for the specified criteria',
      });
      return;
    }

    // Get pharmacy information from first order for branding
    const firstOrder = orders[0];
    const pharmacyName = firstOrder.pharmacy?.name || 'MetaPharm';
    // Address is encrypted, use a placeholder for PDF display
    const pharmacyAddress = firstOrder.pharmacy?.name ? 'Switzerland' : 'Switzerland';

    // Generate PDF
    const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, {
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      pharmacyName,
      pharmacyAddress,
    });

    // Set response headers for PDF download
    const filename = `order-history-${patientId}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Stream PDF to response
    pdfStream.pipe(res);

    // Handle errors during streaming
    pdfStream.on('error', (err) => {
      console.error('[PDF Controller] PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to generate PDF',
          message: err.message,
        });
      }
    });
  } catch (error: any) {
    console.error('[PDF Controller] Export error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to export order history',
        message: error.message,
      });
    }
  }
}

/**
 * GET /export/pdf/validate
 * Validate PDF export parameters without generating PDF
 * Useful for pre-flight checks
 *
 * Query parameters: same as exportOrderHistoryPDF
 * Response: JSON with validation result and order count
 */
export async function validatePDFExport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const orderRepo = dataSource.getRepository(Order);

    const { patientId, startDate, endDate } = req.query;

    if (!patientId || typeof patientId !== 'string') {
      res.status(400).json({
        error: 'patientId query parameter is required',
        valid: false,
      });
      return;
    }

    // Validate dates
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate && typeof startDate === 'string') {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        res.status(400).json({
          error: 'Invalid startDate format. Use YYYY-MM-DD',
          valid: false,
        });
        return;
      }
      start.setHours(0, 0, 0, 0);
      parsedStartDate = start;
    }

    if (endDate && typeof endDate === 'string') {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        res.status(400).json({
          error: 'Invalid endDate format. Use YYYY-MM-DD',
          valid: false,
        });
        return;
      }
      end.setHours(23, 59, 59, 999);
      parsedEndDate = end;
    }

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      res.status(400).json({
        error: 'startDate must be before endDate',
        valid: false,
      });
      return;
    }

    // Count orders matching criteria
    let countQuery = orderRepo
      .createQueryBuilder('order')
      .where('order.user_id = :userId', { userId: patientId });

    if (parsedStartDate) {
      countQuery = countQuery.andWhere('order.created_at >= :startDate', {
        startDate: parsedStartDate,
      });
    }

    if (parsedEndDate) {
      countQuery = countQuery.andWhere('order.created_at <= :endDate', {
        endDate: parsedEndDate,
      });
    }

    const orderCount = await countQuery.getCount();

    res.json({
      valid: true,
      orderCount,
      canExport: orderCount > 0,
      filters: {
        patientId,
        startDate: parsedStartDate?.toISOString().split('T')[0],
        endDate: parsedEndDate?.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    console.error('[PDF Controller] Validation error:', error);
    res.status(500).json({
      error: 'Failed to validate export parameters',
      message: error.message,
      valid: false,
    });
  }
}
