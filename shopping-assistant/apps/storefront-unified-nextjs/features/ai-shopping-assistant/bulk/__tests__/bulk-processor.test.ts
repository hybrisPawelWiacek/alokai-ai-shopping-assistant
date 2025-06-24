import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BulkOrderProcessor } from '../bulk-processor';
import { CSVBulkOrderParser } from '../csv-parser';
import { B2BAlternativeSuggester } from '../alternative-suggester';
import type { BulkOrderRow } from '../csv-parser';
import type { ProductAvailability, BulkProcessingStatus } from '../bulk-processor';

describe('BulkOrderProcessor', () => {
  let processor: BulkOrderProcessor;
  let mockCheckAvailability: jest.Mock;
  let mockFindAlternatives: jest.Mock;
  let mockAddToCart: jest.Mock;
  let mockProgressCallback: jest.Mock;

  beforeEach(() => {
    mockCheckAvailability = jest.fn();
    mockFindAlternatives = jest.fn();
    mockAddToCart = jest.fn();
    mockProgressCallback = jest.fn();

    processor = new BulkOrderProcessor({
      batchSize: 10,
      maxConcurrent: 3,
      enableAlternatives: true,
      progressCallback: mockProgressCallback,
      checkAvailability: mockCheckAvailability,
      findAlternatives: mockFindAlternatives,
      addToCart: mockAddToCart
    });
  });

  describe('Performance Tests', () => {
    it('should process 100 items within 30 seconds', async () => {
      // Generate 100 test items
      const items: BulkOrderRow[] = Array.from({ length: 100 }, (_, i) => ({
        sku: `PROD-${String(i + 1).padStart(3, '0')}`,
        quantity: Math.floor(Math.random() * 50) + 1,
        priority: i < 20 ? 'high' : i < 60 ? 'normal' : 'low'
      }));

      // Mock availability checks (80% available)
      mockCheckAvailability.mockImplementation(async (sku: string) => {
        const index = parseInt(sku.split('-')[1]);
        const available = index % 5 !== 0; // 20% unavailable
        
        return {
          sku,
          available,
          quantity: available ? 1000 : 0,
          price: 10 + (index % 20),
          name: `Product ${sku}`
        };
      });

      // Mock alternatives for unavailable items
      mockFindAlternatives.mockResolvedValue([
        {
          sku: 'ALT-001',
          name: 'Alternative Product',
          similarity: 0.85,
          availability: 'in_stock',
          price: 12,
          reason: 'Same category, similar specs'
        }
      ]);

      // Mock cart operations
      mockAddToCart.mockResolvedValue(undefined);

      const startTime = Date.now();
      const result = await processor.processBulkOrder(items);
      const processingTime = Date.now() - startTime;

      // Assert performance
      expect(processingTime).toBeLessThan(30000); // Under 30 seconds
      expect(result.itemsProcessed).toBe(100);
      expect(result.itemsAdded).toBeGreaterThanOrEqual(70); // At least 70% success
      expect(result.suggestions.size).toBeGreaterThan(0); // Has alternatives

      // Verify progress callbacks were made
      expect(mockProgressCallback).toHaveBeenCalled();
      const progressCalls = mockProgressCallback.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(5); // Multiple progress updates

      // Verify batching worked correctly
      const addToCartCalls = mockAddToCart.mock.calls;
      expect(addToCartCalls.length).toBeGreaterThan(0);
      
      // Check that high priority items were processed first
      const firstBatchSkus = addToCartCalls[0][0].map((item: any) => item.sku);
      const highPrioritySkus = items
        .filter(item => item.priority === 'high')
        .map(item => item.sku);
      
      const highPriorityProcessedFirst = firstBatchSkus.some((sku: string) => 
        highPrioritySkus.includes(sku)
      );
      expect(highPriorityProcessedFirst).toBe(true);
    });

    it('should handle 500 items with progressive updates', async () => {
      const items: BulkOrderRow[] = Array.from({ length: 500 }, (_, i) => ({
        sku: `BULK-${String(i + 1).padStart(4, '0')}`,
        quantity: 10,
        priority: 'normal'
      }));

      mockCheckAvailability.mockResolvedValue({
        sku: 'test',
        available: true,
        quantity: 1000,
        price: 15,
        name: 'Test Product'
      });

      mockAddToCart.mockResolvedValue(undefined);

      const progressUpdates: BulkProcessingStatus[] = [];
      const processor = new BulkOrderProcessor({
        batchSize: 50,
        maxConcurrent: 5,
        enableAlternatives: false,
        progressCallback: (status) => progressUpdates.push(status),
        checkAvailability: mockCheckAvailability,
        findAlternatives: mockFindAlternatives,
        addToCart: mockAddToCart
      });

      await processor.processBulkOrder(items);

      // Verify progressive updates
      expect(progressUpdates.length).toBeGreaterThan(10);
      
      // Check that progress increases monotonically
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].processedItems).toBeGreaterThanOrEqual(
          progressUpdates[i - 1].processedItems
        );
      }

      // Verify final status
      const finalStatus = progressUpdates[progressUpdates.length - 1];
      expect(finalStatus.processedItems).toBe(500);
      expect(finalStatus.totalItems).toBe(500);
    });

    it('should handle mixed availability scenarios efficiently', async () => {
      const items: BulkOrderRow[] = Array.from({ length: 100 }, (_, i) => ({
        sku: `MIX-${String(i + 1).padStart(3, '0')}`,
        quantity: i < 50 ? 5 : 100, // Mix of small and large quantities
        priority: i % 3 === 0 ? 'high' : 'normal'
      }));

      let availabilityCheckCount = 0;
      mockCheckAvailability.mockImplementation(async (sku: string) => {
        availabilityCheckCount++;
        const index = parseInt(sku.split('-')[1]);
        
        // Simulate various scenarios
        if (index % 10 === 0) {
          // Out of stock
          return { sku, available: false, quantity: 0, price: 10, name: `${sku} Product` };
        } else if (index % 7 === 0) {
          // Limited stock
          return { sku, available: true, quantity: 3, price: 10, name: `${sku} Product` };
        } else {
          // In stock
          return { sku, available: true, quantity: 1000, price: 10, name: `${sku} Product` };
        }
      });

      mockFindAlternatives.mockResolvedValue([]);
      mockAddToCart.mockResolvedValue(undefined);

      const result = await processor.processBulkOrder(items);

      // Verify all items were checked
      expect(availabilityCheckCount).toBe(100);
      
      // Verify partial fulfillment handling
      const partialItems = items.filter((_, i) => (i + 1) % 7 === 0 && (i + 1) % 10 !== 0);
      expect(result.errors.some(e => e.error.includes('Only'))).toBe(true);
      
      // Check performance metrics
      expect(result.processingTime).toBeLessThan(10000); // Under 10 seconds for 100 items
    });
  });

  describe('CSV Parsing Integration', () => {
    it('should process CSV with various formats', async () => {
      const csvContent = `
SKU,Quantity,Notes,Reference,Priority
PROD-001,100,"For warehouse A",PO-2024-001,high
PROD-002,50,Rush order,PO-2024-001,high
PROD-003,200,,PO-2024-002,normal
"PROD-004",25,"Special chars: , ; |",PO-2024-003,low
      `.trim();

      const parser = new CSVBulkOrderParser();
      const parseResult = await parser.parseString(csvContent);

      expect(parseResult.success).toBe(true);
      expect(parseResult.rows).toHaveLength(4);
      expect(parseResult.summary.totalQuantity).toBe(375);
      expect(parseResult.summary.uniqueSkus).toBe(4);

      // Process parsed rows
      mockCheckAvailability.mockResolvedValue({
        sku: 'test',
        available: true,
        quantity: 1000,
        price: 20,
        name: 'Test Product'
      });
      mockAddToCart.mockResolvedValue(undefined);

      const result = await processor.processBulkOrder(parseResult.rows);
      
      expect(result.itemsProcessed).toBe(4);
      expect(result.totalQuantity).toBe(375);
    });

    it('should handle large CSV files efficiently', async () => {
      // Generate large CSV
      const headers = 'SKU,Quantity,Priority';
      const rows = Array.from({ length: 1000 }, (_, i) => 
        `CSV-${String(i + 1).padStart(4, '0')},${Math.floor(Math.random() * 100) + 1},normal`
      );
      const csvContent = [headers, ...rows].join('\n');

      const parser = new CSVBulkOrderParser({ maxRows: 1000 });
      const startTime = Date.now();
      const parseResult = await parser.parseString(csvContent);
      const parseTime = Date.now() - startTime;

      expect(parseTime).toBeLessThan(1000); // Parse in under 1 second
      expect(parseResult.rows).toHaveLength(1000);
      expect(parseResult.success).toBe(true);
    });
  });

  describe('Alternative Suggestions', () => {
    it('should find relevant alternatives for out-of-stock items', async () => {
      const suggester = new B2BAlternativeSuggester({
        maxSuggestions: 3,
        minSimilarity: 0.7,
        enableCrossBrand: true,
        priceTolerancePercent: 30
      });

      const originalProduct = {
        sku: 'OUT-001',
        name: 'Industrial Widget Pro 5000',
        category: ['Industrial', 'Widgets', 'Professional'],
        brand: 'WidgetCorp',
        attributes: {
          power: '5000W',
          size: 'Large',
          certification: 'ISO-9001'
        },
        price: 500,
        availability: 'out_of_stock' as const,
        tags: ['heavy-duty', 'professional']
      };

      const candidates = [
        {
          sku: 'ALT-001',
          name: 'Industrial Widget Pro 4500',
          category: ['Industrial', 'Widgets', 'Professional'],
          brand: 'WidgetCorp',
          attributes: {
            power: '4500W',
            size: 'Large',
            certification: 'ISO-9001'
          },
          price: 450,
          availability: 'in_stock' as const,
          tags: ['heavy-duty', 'professional']
        },
        {
          sku: 'ALT-002',
          name: 'Professional Widget Max',
          category: ['Industrial', 'Widgets'],
          brand: 'AlternaWidget',
          attributes: {
            power: '5200W',
            size: 'Large',
            certification: 'ISO-9001'
          },
          price: 520,
          availability: 'in_stock' as const,
          tags: ['professional']
        },
        {
          sku: 'ALT-003',
          name: 'Consumer Widget Basic',
          category: ['Consumer', 'Widgets'],
          brand: 'BudgetWidgets',
          attributes: {
            power: '1000W',
            size: 'Small'
          },
          price: 100,
          availability: 'in_stock' as const,
          tags: ['budget']
        }
      ];

      const suggestions = await suggester.findAlternatives(originalProduct, candidates, 100);

      expect(suggestions).toHaveLength(2); // Only similar products
      expect(suggestions[0].sku).toBe('ALT-001'); // Same brand, very similar
      expect(suggestions[0].similarity).toBeGreaterThan(0.8);
      expect(suggestions[0].reason).toContain('Same brand');
      expect(suggestions[1].sku).toBe('ALT-002'); // Different brand but similar specs
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should maintain sub-250ms response time for availability checks', async () => {
    const mockCheckAvailability = jest.fn().mockImplementation(async () => {
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        sku: 'test',
        available: true,
        quantity: 100,
        price: 10,
        name: 'Test'
      };
    });

    const processor = new BulkOrderProcessor({
      batchSize: 10,
      maxConcurrent: 5,
      enableAlternatives: false,
      checkAvailability: mockCheckAvailability,
      findAlternatives: jest.fn(),
      addToCart: jest.fn()
    });

    const items = Array.from({ length: 10 }, (_, i) => ({
      sku: `PERF-${i}`,
      quantity: 1
    }));

    const startTime = Date.now();
    await processor.processBulkOrder(items);
    const totalTime = Date.now() - startTime;

    // With 5 concurrent and 50ms each, should complete in ~100ms
    expect(totalTime).toBeLessThan(250);
  });
});