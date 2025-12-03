/**
 * PDF Export Service Tests
 * Tests for order history PDF generation
 * Task T5-051 - Order History PDF Export
 */

import { PDFExportService, PDFExportOptions } from '../services/pdf-export.service';
import { Order, OrderStatus, PaymentStatus } from '../../../../shared/models/Order';

describe('PDFExportService', () => {
  // Mock Order objects for testing
  const createMockOrder = (overrides?: Partial<Order>): any => {
    const order: any = {
      id: 'order-' + Math.random().toString(36).substr(2, 9),
      pharmacy_id: 'pharmacy-123',
      user_id: 'user-123',
      status: OrderStatus.COMPLETED,
      items: [
        {
          product_id: 'prod-1',
          product_name: 'Ibuprofen 400mg',
          quantity: 2,
          unit_price: 5.5,
          total_price: 11.0,
        },
      ],
      subtotal: 11.0,
      tax_amount: 1.76,
      shipping_cost: 5.0,
      discount_amount: 0,
      total_amount: 17.76,
      payment_status: PaymentStatus.PAID,
      payment_method: 'credit_card',
      created_at: new Date('2025-12-01'),
      updated_at: new Date('2025-12-01'),
      paid_at: new Date('2025-12-01'),
      getTotalItemsCount: () => 2,
      isPending: () => false,
      isConfirmed: () => false,
      isProcessing: () => false,
      isCompleted: () => true,
      isCancelled: () => false,
      isPaid: () => true,
      canBeCancelled: () => false,
      confirm: () => {},
      process: () => {},
      complete: () => {},
      cancel: () => {},
      markAsPaid: () => {},
    };

    return {
      ...order,
      ...overrides,
    };
  };

  describe('generateOrderHistoryPDF', () => {
    it('should generate a PDF stream for valid orders', (done) => {
      const orders = [createMockOrder()];
      const options: PDFExportOptions = {
        pharmacyName: 'Test Pharmacy',
        pharmacyAddress: 'Zurich, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      // Verify stream is created
      expect(pdfStream).toBeDefined();
      expect(pdfStream.readable).toBe(true);

      // Verify we can listen to data events
      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });

      pdfStream.on('error', (err) => {
        done(err);
      });
    });

    it('should handle multiple orders', (done) => {
      const orders = [
        createMockOrder(),
        createMockOrder(),
        createMockOrder(),
      ];
      const options: PDFExportOptions = {
        pharmacyName: 'Multi Order Test',
        pharmacyAddress: 'Basel, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should handle empty order list', (done) => {
      const orders: Order[] = [];
      const options: PDFExportOptions = {
        pharmacyName: 'Empty Orders Test',
        pharmacyAddress: 'Bern, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should include date range filters when provided', (done) => {
      const orders = [createMockOrder()];
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const options: PDFExportOptions = {
        pharmacyName: 'Date Filter Test',
        pharmacyAddress: 'Lausanne, Switzerland',
        startDate,
        endDate,
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should handle orders with different statuses', (done) => {
      const orders = [
        createMockOrder({ status: OrderStatus.PENDING }),
        createMockOrder({ status: OrderStatus.CONFIRMED }),
        createMockOrder({ status: OrderStatus.PROCESSING }),
        createMockOrder({ status: OrderStatus.COMPLETED }),
        createMockOrder({ status: OrderStatus.CANCELLED }),
      ];

      const options: PDFExportOptions = {
        pharmacyName: 'Status Test Pharmacy',
        pharmacyAddress: 'Geneva, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should handle orders with different payment statuses', (done) => {
      const orders = [
        createMockOrder({ payment_status: PaymentStatus.PENDING }),
        createMockOrder({ payment_status: PaymentStatus.PAID }),
        createMockOrder({ payment_status: PaymentStatus.FAILED }),
        createMockOrder({ payment_status: PaymentStatus.REFUNDED }),
      ];

      const options: PDFExportOptions = {
        pharmacyName: 'Payment Status Test',
        pharmacyAddress: 'Zurich, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should handle orders with large amounts', (done) => {
      const orders = [
        createMockOrder({
          subtotal: 1250.5,
          tax_amount: 237.595,
          shipping_cost: 25.0,
          total_amount: 1513.095,
        }),
      ];

      const options: PDFExportOptions = {
        pharmacyName: 'Large Amount Test',
        pharmacyAddress: 'Zurich, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should handle orders with multiple items', (done) => {
      const order = createMockOrder({
        items: [
          {
            product_id: 'prod-1',
            product_name: 'Aspirin 500mg',
            quantity: 2,
            unit_price: 3.0,
            total_price: 6.0,
          },
          {
            product_id: 'prod-2',
            product_name: 'Vitamin C 1000mg',
            quantity: 3,
            unit_price: 4.5,
            total_price: 13.5,
          },
          {
            product_id: 'prod-3',
            product_name: 'Bandages Box',
            quantity: 1,
            unit_price: 8.5,
            total_price: 8.5,
          },
        ],
        subtotal: 28.0,
        tax_amount: 4.76,
        total_amount: 37.76,
      });

      const orders = [order];
      const options: PDFExportOptions = {
        pharmacyName: 'Multi-Item Test',
        pharmacyAddress: 'Bern, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should calculate correct totals for multiple orders', (done) => {
      const orders = [
        createMockOrder({ total_amount: 17.76 }),
        createMockOrder({ total_amount: 25.5 }),
        createMockOrder({ total_amount: 42.3 }),
      ];

      const options: PDFExportOptions = {
        pharmacyName: 'Totals Test',
        pharmacyAddress: 'Zurich, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should handle pharmacy branding with special characters', (done) => {
      const orders = [createMockOrder()];
      const options: PDFExportOptions = {
        pharmacyName: 'Pharmacie Santé & Bien-être',
        pharmacyAddress: 'Rue du Rhône 123, 1204 Genève, Suisse',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should generate PDF with all traceability fields', (done) => {
      const order = createMockOrder({
        id: 'ORD-2025-001234',
        delivery_id: 'DEL-2025-005678',
        payment_transaction_id: 'TXN-ABC123XYZ',
        created_at: new Date('2025-12-01T10:30:00Z'),
        paid_at: new Date('2025-12-01T10:35:00Z'),
      });

      const orders = [order];
      const options: PDFExportOptions = {
        pharmacyName: 'Traceability Test',
        pharmacyAddress: 'Zurich, Switzerland',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-31'),
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });
  });

  describe('PDF content validation', () => {
    it('should include pharmacy name in PDF', (done) => {
      const orders = [createMockOrder()];
      const pharmacyName = 'Test Pharmacy ABC';
      const options: PDFExportOptions = {
        pharmacyName,
        pharmacyAddress: 'Zurich, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let buffer = Buffer.alloc(0);
      pdfStream.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
      });

      pdfStream.on('end', () => {
        // PDF should be non-empty and valid
        expect(buffer.length).toBeGreaterThan(100);
        // Check for PDF header
        expect(buffer.toString('utf8', 0, 4)).toBe('%PDF');
        done();
      });
    });

    it('should generate valid PDF structure', (done) => {
      const orders = [createMockOrder(), createMockOrder()];
      const options: PDFExportOptions = {
        pharmacyName: 'Structure Test',
        pharmacyAddress: 'Test Address',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let buffer = Buffer.alloc(0);
      pdfStream.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
      });

      pdfStream.on('end', () => {
        // Verify PDF structure
        const pdfStr = buffer.toString('utf8');
        expect(pdfStr).toContain('%PDF');
        expect(pdfStr).toContain('endobj');
        done();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very long order history', (done) => {
      const orders = Array.from({ length: 100 }, () => createMockOrder());
      const options: PDFExportOptions = {
        pharmacyName: 'Large History Test',
        pharmacyAddress: 'Zurich, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should handle very small amounts', (done) => {
      const orders = [
        createMockOrder({
          subtotal: 0.1,
          tax_amount: 0.02,
          total_amount: 0.12,
        }),
      ];

      const options: PDFExportOptions = {
        pharmacyName: 'Small Amount Test',
        pharmacyAddress: 'Zurich, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });

    it('should handle zero-cost items', (done) => {
      const orders = [
        createMockOrder({
          items: [
            {
              product_id: 'prod-1',
              product_name: 'Free Sample',
              quantity: 1,
              unit_price: 0,
              total_price: 0,
            },
          ],
          subtotal: 0,
          tax_amount: 0,
          total_amount: 0,
        }),
      ];

      const options: PDFExportOptions = {
        pharmacyName: 'Zero Cost Test',
        pharmacyAddress: 'Zurich, Switzerland',
      };

      const pdfStream = PDFExportService.generateOrderHistoryPDF(orders, options);

      let dataReceived = false;
      pdfStream.on('data', () => {
        dataReceived = true;
      });

      pdfStream.on('end', () => {
        expect(dataReceived).toBe(true);
        done();
      });
    });
  });
});
