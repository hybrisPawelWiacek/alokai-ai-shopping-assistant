import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BulkProcessor } from '../bulk-processor';
import { CSVParser } from '../csv-parser';
import { createTestState, createTestSDK, PerformanceTimer } from '../../testing/test-utils';
import type { CommerceState } from '../../state';
import type { BulkOrderItem, BulkOperationResult } from '../types';

describe('B2B Bulk Operations', () => {
  let bulkProcessor: BulkProcessor;
  let csvParser: CSVParser;
  let mockSDK: ReturnType<typeof createTestSDK>;
  let mockState: CommerceState;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSDK = createTestSDK();
    mockState = createTestState({ mode: 'b2b' });
    bulkProcessor = new BulkProcessor(mockSDK);
    csvParser = new CSVParser();
  });

  describe('CSV Parsing', () => {
    it('should parse valid CSV with headers', async () => {
      const csvContent = `sku,quantity,notes
SKU-001,10,Urgent
SKU-002,25,Standard delivery
SKU-003,100,Bulk discount eligible`;

      const result = await csvParser.parse(csvContent);

      expect(result.items).toHaveLength(3);
      expect(result.items[0]).toMatchObject({
        sku: 'SKU-001',
        quantity: 10,
        notes: 'Urgent'
      });
      expect(result.items[2].quantity).toBe(100);
    });

    it('should handle different CSV formats', async () => {
      const formats = [
        // Tab-separated
        `sku\tquantity\nSKU-001\t50`,
        // Semicolon-separated
        `sku;quantity\nSKU-001;50`,
        // With quotes
        `"sku","quantity"\n"SKU-001","50"`,
        // Mixed case headers
        `SKU,Quantity\nSKU-001,50`
      ];

      for (const csv of formats) {
        const result = await csvParser.parse(csv);
        expect(result.items[0]).toMatchObject({
          sku: 'SKU-001',
          quantity: 50
        });
      }
    });

    it('should validate required columns', async () => {
      const invalidCSV = `product,amount
Product 1,10`;

      await expect(csvParser.parse(invalidCSV))
        .rejects.toThrow('Missing required columns: sku, quantity');
    });

    it('should handle large CSV files efficiently', async () => {
      // Generate large CSV (1000 rows)
      const rows = ['sku,quantity'];
      for (let i = 0; i < 1000; i++) {
        rows.push(`SKU-${i.toString().padStart(4, '0')},${Math.floor(Math.random() * 100) + 1}`);
      }
      const largeCSV = rows.join('\n');

      const timer = new PerformanceTimer();
      const result = await csvParser.parse(largeCSV);
      
      expect(result.items).toHaveLength(1000);
      timer.assertUnder(100); // Should parse in under 100ms
    });

    it('should handle encoding issues', async () => {
      // CSV with special characters
      const csvWithSpecialChars = `sku,quantity,notes
SKU-001,10,Café items
SKU-002,20,Naïve approach
SKU-003,30,日本語 products`;

      const result = await csvParser.parse(csvWithSpecialChars);
      
      expect(result.items[0].notes).toBe('Café items');
      expect(result.items[2].notes).toBe('日本語 products');
    });

    it('should skip invalid rows and report errors', async () => {
      const csvWithErrors = `sku,quantity
SKU-001,10
SKU-002,invalid
SKU-003,20
,30
SKU-005,-5`;

      const result = await csvParser.parse(csvWithErrors, { skipInvalid: true });

      expect(result.items).toHaveLength(2); // Only valid rows
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0]).toMatchObject({
        row: 3,
        error: 'Invalid quantity'
      });
    });
  });

  describe('Bulk Order Processing', () => {
    it('should process bulk orders with inventory check', async () => {
      const items: BulkOrderItem[] = [
        { sku: 'SKU-001', quantity: 10 },
        { sku: 'SKU-002', quantity: 50 },
        { sku: 'SKU-003', quantity: 100 }
      ];

      // Mock inventory responses
      mockSDK.unified.checkInventory = jest.fn()
        .mockResolvedValueOnce({ sku: 'SKU-001', available: 15 })
        .mockResolvedValueOnce({ sku: 'SKU-002', available: 30 }) // Not enough
        .mockResolvedValueOnce({ sku: 'SKU-003', available: 150 });

      const result = await bulkProcessor.processBulkOrder(items, mockState);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toMatchObject({
        sku: 'SKU-002',
        reason: 'Insufficient inventory',
        availableQuantity: 30
      });
    });

    it('should apply bulk pricing tiers', async () => {
      const items: BulkOrderItem[] = [
        { sku: 'SKU-001', quantity: 100 }, // Should get bulk pricing
        { sku: 'SKU-002', quantity: 5 }    // Regular pricing
      ];

      mockSDK.customExtension.getBulkPricing = jest.fn().mockResolvedValue([
        {
          sku: 'SKU-001',
          tiers: [
            { minQuantity: 50, price: 89.99 },
            { minQuantity: 100, price: 79.99 }
          ],
          regularPrice: 99.99
        },
        {
          sku: 'SKU-002',
          tiers: [{ minQuantity: 10, price: 19.99 }],
          regularPrice: 24.99
        }
      ]);

      const result = await bulkProcessor.calculateBulkPricing(items);

      expect(result.items[0].unitPrice).toBe(79.99); // Bulk tier
      expect(result.items[0].totalPrice).toBe(7999.00);
      expect(result.items[1].unitPrice).toBe(24.99); // Regular price
      expect(result.totalAmount).toBe(8123.95);
    });

    it('should handle alternative product suggestions', async () => {
      const items: BulkOrderItem[] = [
        { sku: 'DISCONTINUED-001', quantity: 50 }
      ];

      mockSDK.unified.getProductDetails = jest.fn().mockRejectedValue(
        new Error('Product not found')
      );

      mockSDK.customExtension.findSimilarProducts = jest.fn().mockResolvedValue({
        products: [
          { sku: 'ALT-001', name: 'Alternative Product 1', similarity: 0.9 },
          { sku: 'ALT-002', name: 'Alternative Product 2', similarity: 0.85 }
        ]
      });

      const result = await bulkProcessor.processBulkOrder(items, mockState, {
        suggestAlternatives: true
      });

      expect(result.failed[0].alternatives).toHaveLength(2);
      expect(result.failed[0].alternatives[0]).toMatchObject({
        sku: 'ALT-001',
        similarity: 0.9
      });
    });

    it('should batch process large orders efficiently', async () => {
      // Create 500 item order
      const items: BulkOrderItem[] = Array(500).fill(null).map((_, i) => ({
        sku: `SKU-${i.toString().padStart(4, '0')}`,
        quantity: Math.floor(Math.random() * 50) + 1
      }));

      mockSDK.unified.checkInventory = jest.fn().mockResolvedValue({
        available: 1000
      });

      const timer = new PerformanceTimer();
      const progressUpdates: number[] = [];

      const result = await bulkProcessor.processBulkOrder(items, mockState, {
        batchSize: 50,
        onProgress: (processed, total) => {
          progressUpdates.push(processed);
        }
      });

      // Should complete within 30 seconds
      timer.assertUnder(30000);

      // Should process in batches
      expect(progressUpdates.length).toBeGreaterThan(5);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(500);

      // Should have results for all items
      expect(result.successful.length + result.failed.length).toBe(500);
    });

    it('should validate minimum order quantities', async () => {
      const items: BulkOrderItem[] = [
        { sku: 'BULK-001', quantity: 5 } // Below minimum
      ];

      mockSDK.unified.getProductDetails = jest.fn().mockResolvedValue({
        sku: 'BULK-001',
        minimumOrderQuantity: 50,
        b2bOnly: true
      });

      const result = await bulkProcessor.processBulkOrder(items, mockState);

      expect(result.failed[0]).toMatchObject({
        sku: 'BULK-001',
        reason: 'Below minimum order quantity',
        minimumQuantity: 50
      });
    });
  });

  describe('Bulk Operations with Business Rules', () => {
    it('should apply customer-specific pricing', async () => {
      mockState.context.customerId = 'vip-customer-123';
      mockState.context.accountId = 'enterprise-001';

      const items: BulkOrderItem[] = [
        { sku: 'SKU-001', quantity: 100 }
      ];

      mockSDK.customExtension.getCustomerPricing = jest.fn().mockResolvedValue({
        'SKU-001': {
          basePrice: 99.99,
          customerDiscount: 0.15, // 15% VIP discount
          volumeDiscount: 0.10,   // 10% volume discount
          finalPrice: 76.49
        }
      });

      const result = await bulkProcessor.calculateBulkPricing(items, {
        customerId: mockState.context.customerId
      });

      expect(result.items[0].unitPrice).toBe(76.49);
      expect(result.discounts).toMatchObject({
        customer: 0.15,
        volume: 0.10
      });
    });

    it('should validate credit limits for B2B', async () => {
      const items: BulkOrderItem[] = [
        { sku: 'SKU-001', quantity: 1000, unitPrice: 99.99 }
      ];

      mockSDK.customExtension.getAccountCredit = jest.fn().mockResolvedValue({
        creditLimit: 50000,
        availableCredit: 30000,
        paymentTerms: 'Net 30'
      });

      const orderTotal = 99990; // Exceeds available credit

      const result = await bulkProcessor.validateB2BOrder({
        items,
        total: orderTotal,
        accountId: mockState.context.accountId
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Order exceeds available credit');
      expect(result.availableCredit).toBe(30000);
    });

    it('should handle tax exemptions for B2B', async () => {
      mockState.context.taxExempt = true;
      mockState.context.taxExemptionId = 'TAX-EXEMPT-123';

      const items: BulkOrderItem[] = [
        { sku: 'SKU-001', quantity: 100, unitPrice: 99.99 }
      ];

      const result = await bulkProcessor.calculateBulkPricing(items, {
        applyTaxExemption: true
      });

      expect(result.tax).toBe(0);
      expect(result.taxExemptionApplied).toBe(true);
      expect(result.subtotal).toBe(9999);
      expect(result.totalAmount).toBe(9999); // No tax added
    });
  });

  describe('Progress Streaming', () => {
    it('should stream progress for long operations', async () => {
      const items: BulkOrderItem[] = Array(100).fill(null).map((_, i) => ({
        sku: `SKU-${i}`,
        quantity: 10
      }));

      const progressEvents: any[] = [];

      await bulkProcessor.processBulkOrder(items, mockState, {
        batchSize: 10,
        onProgress: (processed, total, currentBatch) => {
          progressEvents.push({
            processed,
            total,
            percentage: Math.round((processed / total) * 100),
            currentBatch
          });
        }
      });

      // Should have progress updates for each batch
      expect(progressEvents.length).toBe(10);
      
      // Progress should increase monotonically
      for (let i = 1; i < progressEvents.length; i++) {
        expect(progressEvents[i].processed).toBeGreaterThan(
          progressEvents[i - 1].processed
        );
      }

      // Final progress should be 100%
      expect(progressEvents[progressEvents.length - 1]).toMatchObject({
        processed: 100,
        total: 100,
        percentage: 100
      });
    });

    it('should handle errors during streaming', async () => {
      const items: BulkOrderItem[] = Array(20).fill(null).map((_, i) => ({
        sku: `SKU-${i}`,
        quantity: 10
      }));

      // Fail on specific item
      mockSDK.unified.checkInventory = jest.fn().mockImplementation(({ sku }) => {
        if (sku === 'SKU-10') {
          throw new Error('Inventory service error');
        }
        return { available: 100 };
      });

      const errors: any[] = [];

      const result = await bulkProcessor.processBulkOrder(items, mockState, {
        onError: (error, item) => {
          errors.push({ error: error.message, item });
        }
      });

      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        error: 'Inventory service error',
        item: { sku: 'SKU-10' }
      });

      // Should continue processing other items
      expect(result.successful.length).toBe(19);
      expect(result.failed.length).toBe(1);
    });
  });

  describe('Export and Reporting', () => {
    it('should generate bulk order summary', async () => {
      const result: BulkOperationResult = {
        successful: [
          { sku: 'SKU-001', quantity: 100, unitPrice: 89.99, totalPrice: 8999 },
          { sku: 'SKU-002', quantity: 50, unitPrice: 45.99, totalPrice: 2299.50 }
        ],
        failed: [
          { sku: 'SKU-003', quantity: 200, reason: 'Insufficient inventory', availableQuantity: 150 }
        ],
        totalAmount: 11298.50,
        processingTime: 5432
      };

      const summary = bulkProcessor.generateOrderSummary(result);

      expect(summary).toMatchObject({
        totalItems: 3,
        successfulItems: 2,
        failedItems: 1,
        totalQuantity: 150,
        totalAmount: 11298.50,
        successRate: 0.67,
        processingTime: '5.43s'
      });
    });

    it('should export results to CSV', async () => {
      const result: BulkOperationResult = {
        successful: [
          { sku: 'SKU-001', quantity: 100, unitPrice: 89.99, status: 'confirmed' }
        ],
        failed: [
          { sku: 'SKU-002', quantity: 50, reason: 'Out of stock' }
        ]
      };

      const csv = await bulkProcessor.exportToCSV(result);

      expect(csv).toContain('sku,quantity,status,unit_price,total_price,error');
      expect(csv).toContain('SKU-001,100,confirmed,89.99,8999.00,');
      expect(csv).toContain('SKU-002,50,failed,,,Out of stock');
    });
  });

  describe('Integration with Commerce Graph', () => {
    it('should integrate with the main commerce flow', async () => {
      const csvContent = `sku,quantity
SKU-001,25
SKU-002,50`;

      // Parse CSV
      const parseResult = await csvParser.parse(csvContent);
      
      // Process through bulk processor
      const orderResult = await bulkProcessor.processBulkOrder(
        parseResult.items,
        mockState
      );

      // Add to cart
      mockSDK.unified.addBulkToCart = jest.fn().mockResolvedValue({
        id: 'cart-b2b-123',
        items: orderResult.successful.map((item, i) => ({
          id: `item-${i}`,
          ...item
        })),
        total: orderResult.totalAmount
      });

      const cartResult = await mockSDK.unified.addBulkToCart({
        items: orderResult.successful
      });

      expect(cartResult.items).toHaveLength(2);
      expect(cartResult.total).toBeGreaterThan(0);
    });
  });
});