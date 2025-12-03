/**
 * PDF Export Service
 * Generates professional PDF documents for order history
 * Includes traceability data required for Swiss healthcare
 * Task T5-051 - Order History PDF Export
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { Order } from '../../../../shared/models/Order';

export interface PDFExportOptions {
  startDate?: Date;
  endDate?: Date;
  pharmacyName: string;
  pharmacyAddress: string;
  logoPath?: string;
}

export class PDFExportService {
  /**
   * Generate a PDF stream for order history
   * @param orders Array of orders to include in PDF
   * @param options PDF configuration options
   * @returns Stream readable PDF document
   */
  static generateOrderHistoryPDF(
    orders: Order[],
    options: PDFExportOptions
  ): any {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });

    // Add header
    this.addHeader(doc, options);

    // Add metadata and filters
    this.addMetadata(doc, orders.length, options);

    // Add orders table
    if (orders.length > 0) {
      this.addOrdersTable(doc, orders);
    } else {
      doc.fontSize(11).text('No orders found for the specified date range.', {
        align: 'center',
      });
    }

    // Add footer with page numbers
    this.addFooter(doc);

    // Finalize document
    doc.end();

    return doc;
  }

  /**
   * Add professional header with pharmacy branding
   */
  private static addHeader(doc: any, options: PDFExportOptions): void {
    const pageWidth = doc.page.width - 80; // Account for margins

    // Pharmacy branding
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(options.pharmacyName, {
        align: 'left',
      });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(options.pharmacyAddress, {
        align: 'left',
      });

    // Document title on right side
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Order History Export', {
        align: 'right',
        y: doc.y - 30,
      });

    // Separator line
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(40, doc.y + 10)
      .lineTo(doc.page.width - 40, doc.y + 10)
      .stroke();

    doc.moveDown(1);
  }

  /**
   * Add export metadata and filter information
   */
  private static addMetadata(
    doc: any,
    orderCount: number,
    options: PDFExportOptions
  ): void {
    const currentDate = new Date();

    doc.fontSize(10).font('Helvetica');

    // Export information
    doc.text(`Export Date: ${currentDate.toLocaleDateString('en-US')} ${currentDate.toLocaleTimeString('en-US')}`, {
      align: 'left',
    });

    // Date range filter
    if (options.startDate || options.endDate) {
      const startStr = options.startDate
        ? new Date(options.startDate).toLocaleDateString('en-US')
        : 'Beginning';
      const endStr = options.endDate
        ? new Date(options.endDate).toLocaleDateString('en-US')
        : 'Today';
      doc.text(`Date Range: ${startStr} - ${endStr}`, {
        align: 'left',
      });
    }

    // Order count
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Total Orders: ${orderCount}`, {
        align: 'left',
      });

    doc.moveDown(0.5);

    // Separator
    doc
      .strokeColor('#eeeeee')
      .lineWidth(0.5)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Add orders table with all traceability data
   */
  private static addOrdersTable(doc: any, orders: Order[]): void {
    const pageWidth = doc.page.width - 80;
    const colWidths = {
      orderID: 80,
      date: 65,
      status: 70,
      items: 45,
      amount: 60,
      payment: 55,
    };

    // Table header
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333');

    const headerY = doc.y;
    doc.text('Order ID', 40, headerY);
    doc.text('Order Date', 40 + colWidths.orderID, headerY);
    doc.text('Status', 40 + colWidths.orderID + colWidths.date, headerY);
    doc.text('Items', 40 + colWidths.orderID + colWidths.date + colWidths.status, headerY);
    doc.text(
      'Total',
      40 + colWidths.orderID + colWidths.date + colWidths.status + colWidths.items,
      headerY
    );
    doc.text(
      'Payment',
      40 + colWidths.orderID + colWidths.date + colWidths.status + colWidths.items + colWidths.amount,
      headerY
    );

    doc.moveDown();

    // Header separator
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(40, doc.y)
      .lineTo(pageWidth + 40, doc.y)
      .stroke();

    doc.moveDown(0.3);

    // Table rows
    doc.fontSize(9).font('Helvetica').fillColor('#000000');

    orders.forEach((order, index) => {
      const y = doc.y;
      const rowHeight = 25;

      // Check if we need a new page
      if (doc.y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        doc.moveDown();
      }

      // Alternate row background for readability
      if (index % 2 === 0) {
        doc
          .rect(40, doc.y - 2, pageWidth, rowHeight)
          .fillAndStroke('#f9f9f9', '#f9f9f9');
        doc.fillColor('#000000');
      }

      // Order ID (truncated with ellipsis if needed)
      const orderIDDisplay = order.id.substring(0, 12) + '...';
      doc.text(orderIDDisplay, 40, y, { width: colWidths.orderID - 5 });

      // Order Date
      const orderDate = new Date(order.created_at).toLocaleDateString('en-US');
      doc.text(orderDate, 40 + colWidths.orderID, y, { width: colWidths.date - 5 });

      // Status with color coding
      const statusColor = this.getStatusColor(order.status);
      doc.fillColor(statusColor);
      doc.text(
        order.status.replace(/_/g, ' ').toUpperCase(),
        40 + colWidths.orderID + colWidths.date,
        y,
        { width: colWidths.status - 5 }
      );
      doc.fillColor('#000000');

      // Items count
      const itemCount = order.getTotalItemsCount();
      doc.text(`${itemCount} item${itemCount !== 1 ? 's' : ''}`, 40 + colWidths.orderID + colWidths.date + colWidths.status, y, {
        width: colWidths.items - 5,
      });

      // Total amount
      const amount = parseFloat(order.total_amount.toString()).toFixed(2);
      doc.text(`CHF ${amount}`, 40 + colWidths.orderID + colWidths.date + colWidths.status + colWidths.items, y, {
        width: colWidths.amount - 5,
        align: 'right',
      });

      // Payment status
      doc.text(
        order.payment_status.replace(/_/g, ' ').toUpperCase(),
        40 + colWidths.orderID + colWidths.date + colWidths.status + colWidths.items + colWidths.amount,
        y,
        { width: colWidths.payment - 5 }
      );

      doc.moveDown(2.5);
    });

    // Footer separator
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(40, doc.y)
      .lineTo(pageWidth + 40, doc.y)
      .stroke();

    doc.moveDown(0.5);

    // Summary information
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333');

    const subtotal = orders.reduce((sum, order) => sum + parseFloat(order.subtotal.toString()), 0);
    const totalTax = orders.reduce((sum, order) => sum + parseFloat(order.tax_amount.toString()), 0);
    const totalShipping = orders.reduce((sum, order) => sum + parseFloat(order.shipping_cost.toString()), 0);
    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);

    doc.text(`Subtotal: CHF ${subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Tax: CHF ${totalTax.toFixed(2)}`, { align: 'right' });
    doc.text(`Shipping: CHF ${totalShipping.toFixed(2)}`, { align: 'right' });
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Total: CHF ${totalAmount.toFixed(2)}`, { align: 'right' });
  }

  /**
   * Add footer with page numbers and compliance notice
   */
  private static addFooter(doc: any): void {
    const pages = doc.bufferedPageRange().count;

    for (let i = 0; i < pages; i++) {
      doc.switchToPage(i);

      // Page number
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#999999')
        .text(
          `Page ${i + 1} of ${pages}`,
          40,
          doc.page.height - 30,
          { align: 'center' }
        );

      // Compliance notice
      doc
        .fontSize(7)
        .text(
          'This document contains sensitive healthcare information. Please keep it confidential.',
          40,
          doc.page.height - 20,
          { align: 'center' }
        );
    }
  }

  /**
   * Get color code for order status
   */
  private static getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: '#FF9800',
      confirmed: '#2196F3',
      processing: '#2196F3',
      ready_for_pickup: '#4CAF50',
      out_for_delivery: '#4CAF50',
      completed: '#4CAF50',
      cancelled: '#F44336',
      refunded: '#F44336',
    };
    return colors[status] || '#999999';
  }
}
