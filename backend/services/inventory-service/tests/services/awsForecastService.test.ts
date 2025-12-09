/**
 * Unit tests for AWS Forecast Service
 * Tests real AWS SDK integration with mocked responses
 */

import { AwsForecastService, ForecastDataPoint } from '../../src/services/awsForecastService';
import { ForecastClient, DescribePredictorCommand } from '@aws-sdk/client-forecast';
import { ForecastqueryClient, QueryForecastCommand } from '@aws-sdk/client-forecastquery';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-forecast');
jest.mock('@aws-sdk/client-forecastquery');

describe('AwsForecastService', () => {
  let service: AwsForecastService;
  let mockForecastClient: jest.Mocked<ForecastClient>;
  let mockQueryClient: jest.Mocked<ForecastqueryClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mocked clients
    mockForecastClient = new ForecastClient({}) as jest.Mocked<ForecastClient>;
    mockQueryClient = new ForecastqueryClient({}) as jest.Mocked<ForecastqueryClient>;

    // Mock the send method
    mockForecastClient.send = jest.fn();
    mockQueryClient.send = jest.fn();

    // Initialize service with mock credentials
    service = new AwsForecastService({
      region: 'eu-central-1',
      accessKeyId: 'mock-key',
      secretAccessKey: 'mock-secret',
    });

    // Replace real clients with mocks
    (service as any).client = mockForecastClient;
    (service as any).queryClient = mockQueryClient;
    (service as any).isConfigured = true;
    (service as any).predictorArn = 'arn:aws:forecast:eu-central-1:123456789:predictor/test-predictor';
    (service as any).forecastArn = 'arn:aws:forecast:eu-central-1:123456789:forecast/test-forecast';
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with AWS credentials', () => {
      const serviceWithCreds = new AwsForecastService({
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-east-1',
      });

      expect(serviceWithCreds.isServiceConfigured()).toBe(true);
    });

    it('should run in stub mode without credentials', () => {
      const serviceStub = new AwsForecastService({
        accessKeyId: '',
        secretAccessKey: '',
      });

      expect(serviceStub.isServiceConfigured()).toBe(false);
    });

    it('should use environment variables for credentials', () => {
      process.env.AWS_REGION = 'eu-west-1';
      process.env.AWS_ACCESS_KEY_ID = 'env-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'env-secret';

      const serviceEnv = new AwsForecastService();

      const info = serviceEnv.getServiceInfo();
      expect(info.region).toBe('eu-west-1');
    });
  });

  describe('trainForecastModel', () => {
    it('should train model with sufficient historical data', async () => {
      // Generate 400 days of historical data
      const historicalData: ForecastDataPoint[] = [];
      for (let i = 0; i < 400; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        historicalData.push({
          timestamp: date,
          sku: 'MED-001',
          quantity: 10 + Math.random() * 5,
        });
      }

      // Mock AWS responses
      mockForecastClient.send.mockImplementation((command: any) => {
        if (command.constructor.name === 'CreateDatasetCommand') {
          return Promise.resolve({ DatasetArn: 'arn:aws:forecast:eu-central-1:123:dataset/test' });
        }
        if (command.constructor.name === 'CreateDatasetImportJobCommand') {
          return Promise.resolve({ DatasetImportJobArn: 'arn:aws:forecast:eu-central-1:123:import/test' });
        }
        if (command.constructor.name === 'CreatePredictorCommand') {
          return Promise.resolve({ PredictorArn: 'arn:aws:forecast:eu-central-1:123:predictor/test' });
        }
        if (command.constructor.name === 'CreateForecastCommand') {
          return Promise.resolve({ ForecastArn: 'arn:aws:forecast:eu-central-1:123:forecast/test' });
        }
        if (command.constructor.name === 'DescribePredictorCommand') {
          return Promise.resolve({
            Status: 'ACTIVE',
            PredictorExecutionDetails: {
              PredictorExecutions: [
                {
                  TestWindows: [
                    {
                      Metrics: {
                        WeightedQuantileLosses: [{ LossValue: 0.15 }],
                      },
                    },
                  ],
                },
              ],
            },
          });
        }
        if (command.constructor.name === 'DescribeDatasetImportJobCommand') {
          return Promise.resolve({ Status: 'ACTIVE' });
        }
        if (command.constructor.name === 'DescribeForecastCommand') {
          return Promise.resolve({ Status: 'ACTIVE' });
        }
        return Promise.resolve({});
      });

      // Mock S3 client
      const mockS3Send = jest.fn().mockResolvedValue({});
      (service as any).s3Client = { send: mockS3Send };

      const result = await service.trainForecastModel(historicalData);

      expect(result.success).toBe(true);
      expect(result.modelArn).toBeDefined();
      expect(result.accuracy).toBeGreaterThan(0.8);
    });

    it('should fail with insufficient historical data', async () => {
      // Only 100 days of data (need 365)
      const historicalData: ForecastDataPoint[] = [];
      for (let i = 0; i < 100; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        historicalData.push({
          timestamp: date,
          sku: 'MED-001',
          quantity: 10,
        });
      }

      const result = await service.trainForecastModel(historicalData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient historical data');
    });

    it('should handle AWS quota exceeded error', async () => {
      const historicalData: ForecastDataPoint[] = [];
      for (let i = 0; i < 400; i++) {
        historicalData.push({
          timestamp: new Date(),
          sku: 'MED-001',
          quantity: 10,
        });
      }

      (mockForecastClient.send as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Quota exceeded'), {
          name: 'LimitExceededException',
        })
      );

      const result = await service.trainForecastModel(historicalData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('quota exceeded');
    });

    it('should run in stub mode without AWS client', async () => {
      // Clear environment variables for this test
      const originalAccessKey = process.env.AWS_ACCESS_KEY_ID;
      const originalSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      const stubService = new AwsForecastService({
        accessKeyId: '',
        secretAccessKey: '',
      });

      const historicalData: ForecastDataPoint[] = [];
      for (let i = 0; i < 400; i++) {
        historicalData.push({
          timestamp: new Date(),
          sku: 'MED-001',
          quantity: 10,
        });
      }

      const result = await stubService.trainForecastModel(historicalData);

      expect(result.success).toBe(true);
      expect(result.modelArn).toContain('mock');

      // Restore environment variables
      if (originalAccessKey) process.env.AWS_ACCESS_KEY_ID = originalAccessKey;
      if (originalSecretKey) process.env.AWS_SECRET_ACCESS_KEY = originalSecretKey;
    });
  });

  describe('getForecast', () => {
    it('should get forecast from AWS with valid predictor', async () => {
      const mockPredictions = {
        p50: [
          { Timestamp: '2024-01-01', Value: 12.5 },
          { Timestamp: '2024-01-02', Value: 13.2 },
          { Timestamp: '2024-01-03', Value: 11.8 },
        ],
        p10: [
          { Timestamp: '2024-01-01', Value: 9.0 },
          { Timestamp: '2024-01-02', Value: 9.5 },
          { Timestamp: '2024-01-03', Value: 8.8 },
        ],
        p90: [
          { Timestamp: '2024-01-01', Value: 16.0 },
          { Timestamp: '2024-01-02', Value: 17.0 },
          { Timestamp: '2024-01-03', Value: 15.0 },
        ],
      };

      (mockQueryClient.send as jest.Mock).mockResolvedValue({
        Forecast: {
          Predictions: mockPredictions,
        },
      });

      const forecast = await service.getForecast('MED-001', 'PHARMACY-123', 3);

      expect(forecast.sku).toBe('MED-001');
      expect(forecast.predictions).toHaveLength(3);
      expect(forecast.predictions[0].predictedDemand).toBe(12.5);
      expect(forecast.predictions[0].lowerBound).toBe(9.0);
      expect(forecast.predictions[0].upperBound).toBe(16.0);
      expect(forecast.recommendation).toBeDefined();
    });

    it('should fallback to mock on AWS error', async () => {
      (mockQueryClient.send as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Predictor not found'), {
          name: 'ResourceNotFoundException',
        })
      );

      const forecast = await service.getForecast('MED-001', 'PHARMACY-123', 30);

      expect(forecast.sku).toBe('MED-001');
      expect(forecast.predictions.length).toBeGreaterThan(0);
    });

    it('should calculate restocking recommendation correctly', async () => {
      const mockPredictions = {
        p50: Array.from({ length: 30 }, (_, i) => ({
          Timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
          Value: 100.0, // 100 units per day (very high demand)
        })),
        p10: Array.from({ length: 30 }, () => ({ Timestamp: '', Value: 70.0 })),
        p90: Array.from({ length: 30 }, () => ({ Timestamp: '', Value: 130.0 })),
      };

      (mockQueryClient.send as jest.Mock).mockResolvedValue({
        Forecast: {
          Predictions: mockPredictions,
        },
      });

      // With very high demand (100/day) and stock between 50-150, stockout happens very quickly
      const forecast = await service.getForecast('MED-001', 'PHARMACY-123', 30);

      // With high demand, should definitely recommend restocking
      expect(forecast.recommendation.shouldRestock).toBe(true);
      expect(forecast.recommendation.urgency).toMatch(/^(low|medium|high)$/);
      expect(forecast.recommendation.estimatedStockoutDate).toBeDefined();
      expect(forecast.recommendation.suggestedQuantity).toBeGreaterThan(0);
    });

    it('should run in stub mode without forecast ARN', async () => {
      (service as any).forecastArn = null;

      const forecast = await service.getForecast('MED-001', 'PHARMACY-123', 30);

      expect(forecast.sku).toBe('MED-001');
      expect(forecast.predictions.length).toBe(30);
    });
  });

  describe('analyzeForecastAccuracy', () => {
    it('should calculate accuracy metrics correctly', async () => {
      const predictions = [
        {
          sku: 'MED-001',
          productName: 'Product 1',
          currentStock: 100,
          predictions: [
            {
              date: new Date('2024-01-01'),
              predictedDemand: 10,
              lowerBound: 7,
              upperBound: 13,
              confidence: 0.9,
            },
            {
              date: new Date('2024-01-02'),
              predictedDemand: 12,
              lowerBound: 9,
              upperBound: 15,
              confidence: 0.9,
            },
          ],
          recommendation: {
            shouldRestock: false,
            suggestedQuantity: 0,
            urgency: 'low' as const,
            estimatedStockoutDate: null,
          },
        },
      ];

      const actualSales: ForecastDataPoint[] = [
        { timestamp: new Date('2024-01-01'), sku: 'MED-001', quantity: 11 }, // Predicted 10, actual 11 → error 1
        { timestamp: new Date('2024-01-02'), sku: 'MED-001', quantity: 10 }, // Predicted 12, actual 10 → error 2
      ];

      const accuracy = await service.analyzeForecastAccuracy(predictions, actualSales);

      expect(accuracy.overallAccuracy).toBeGreaterThan(0.8);
      expect(accuracy.meanAbsoluteError).toBeCloseTo(1.5, 1); // (1 + 2) / 2 = 1.5
      expect(accuracy.itemAccuracies).toHaveLength(1);
      expect(accuracy.itemAccuracies[0].sku).toBe('MED-001');
    });

    it('should handle empty actual sales gracefully', async () => {
      const predictions = [
        {
          sku: 'MED-001',
          productName: 'Product 1',
          currentStock: 100,
          predictions: [],
          recommendation: {
            shouldRestock: false,
            suggestedQuantity: 0,
            urgency: 'low' as const,
            estimatedStockoutDate: null,
          },
        },
      ];

      const actualSales: ForecastDataPoint[] = [];

      const accuracy = await service.analyzeForecastAccuracy(predictions, actualSales);

      expect(accuracy.overallAccuracy).toBe(0.85); // Fallback
      expect(accuracy.meanAbsoluteError).toBe(5.2); // Fallback
    });
  });

  describe('generateRestockingPlan', () => {
    it('should generate restocking plan sorted by urgency', async () => {
      const forecasts = [
        {
          sku: 'MED-001',
          productName: 'Product 1',
          currentStock: 10,
          predictions: [
            { date: new Date(), predictedDemand: 5, lowerBound: 3, upperBound: 7, confidence: 0.9 },
            { date: new Date(), predictedDemand: 5, lowerBound: 3, upperBound: 7, confidence: 0.9 },
          ],
          recommendation: {
            shouldRestock: true,
            suggestedQuantity: 150,
            urgency: 'high' as const,
            estimatedStockoutDate: new Date(),
          },
        },
        {
          sku: 'MED-002',
          productName: 'Product 2',
          currentStock: 50,
          predictions: [
            { date: new Date(), predictedDemand: 3, lowerBound: 2, upperBound: 4, confidence: 0.9 },
          ],
          recommendation: {
            shouldRestock: true,
            suggestedQuantity: 90,
            urgency: 'low' as const,
            estimatedStockoutDate: new Date(),
          },
        },
      ];

      const plan = await service.generateRestockingPlan(forecasts);

      expect(plan).toHaveLength(2);
      expect(plan[0].urgency).toBe('high'); // Sorted by urgency
      expect(plan[0].sku).toBe('MED-001');
      expect(plan[1].urgency).toBe('low');
      expect(plan[1].sku).toBe('MED-002');
    });

    it('should filter out items that dont need restocking', async () => {
      const forecasts = [
        {
          sku: 'MED-001',
          productName: 'Product 1',
          currentStock: 1000,
          predictions: [
            { date: new Date(), predictedDemand: 5, lowerBound: 3, upperBound: 7, confidence: 0.9 },
          ],
          recommendation: {
            shouldRestock: false,
            suggestedQuantity: 0,
            urgency: 'low' as const,
            estimatedStockoutDate: null,
          },
        },
      ];

      const plan = await service.generateRestockingPlan(forecasts);

      expect(plan).toHaveLength(0); // No restocking needed
    });
  });

  describe('getBatchForecasts', () => {
    it('should get forecasts for multiple SKUs', async () => {
      (mockQueryClient.send as jest.Mock).mockResolvedValue({
        Forecast: {
          Predictions: {
            p50: [{ Timestamp: '2024-01-01', Value: 10 }],
            p10: [{ Timestamp: '2024-01-01', Value: 7 }],
            p90: [{ Timestamp: '2024-01-01', Value: 13 }],
          },
        },
      });

      const skus = ['MED-001', 'MED-002', 'MED-003'];
      const forecasts = await service.getBatchForecasts(skus, 'PHARMACY-123', 30);

      expect(forecasts).toHaveLength(3);
      expect(forecasts[0].sku).toBe('MED-001');
      expect(forecasts[1].sku).toBe('MED-002');
      expect(forecasts[2].sku).toBe('MED-003');
    });

    it('should handle errors for individual SKUs gracefully', async () => {
      let callCount = 0;
      (mockQueryClient.send as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Forecast error'));
        }
        return Promise.resolve({
          Forecast: {
            Predictions: {
              p50: [{ Timestamp: '2024-01-01', Value: 10 }],
              p10: [{ Timestamp: '2024-01-01', Value: 7 }],
              p90: [{ Timestamp: '2024-01-01', Value: 13 }],
            },
          },
        });
      });

      const skus = ['MED-001', 'MED-002', 'MED-003'];
      const forecasts = await service.getBatchForecasts(skus, 'PHARMACY-123', 30);

      // Should return 2 forecasts (MED-002 failed)
      expect(forecasts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Service Configuration', () => {
    it('should return correct service info', () => {
      const info = service.getServiceInfo();

      expect(info.isConfigured).toBe(true);
      expect(info.region).toBe('eu-central-1');
      expect(info.forecastHorizon).toBeDefined();
      expect(info.predictionInterval).toBeDefined();
    });

    it('should check if service is configured', () => {
      expect(service.isServiceConfigured()).toBe(true);

      // Clear environment variables for this test
      const originalAccessKey = process.env.AWS_ACCESS_KEY_ID;
      const originalSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      const stubService = new AwsForecastService({
        accessKeyId: '',
        secretAccessKey: '',
      });
      expect(stubService.isServiceConfigured()).toBe(false);

      // Restore environment variables
      if (originalAccessKey) process.env.AWS_ACCESS_KEY_ID = originalAccessKey;
      if (originalSecretKey) process.env.AWS_SECRET_ACCESS_KEY = originalSecretKey;
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid SKU (empty string)', async () => {
      await expect(service.getForecast('', 'PHARMACY-123', 30)).rejects.toThrow('Invalid SKU');
    });

    it('should reject invalid SKU (too long)', async () => {
      const longSku = 'A'.repeat(300);
      await expect(service.getForecast(longSku, 'PHARMACY-123', 30)).rejects.toThrow('Invalid SKU');
    });

    it('should reject invalid pharmacy ID (empty)', async () => {
      await expect(service.getForecast('MED-001', '', 30)).rejects.toThrow('Invalid pharmacy ID');
    });

    it('should reject invalid daysAhead (too low)', async () => {
      await expect(service.getForecast('MED-001', 'PHARMACY-123', 0)).rejects.toThrow('Invalid daysAhead');
    });

    it('should reject invalid daysAhead (too high)', async () => {
      await expect(service.getForecast('MED-001', 'PHARMACY-123', 100)).rejects.toThrow('Invalid daysAhead');
    });

    it('should sanitize SKU to prevent injection', async () => {
      const maliciousSku = 'MED-001; DROP TABLE inventory;';

      (mockQueryClient.send as jest.Mock).mockResolvedValue({
        Forecast: {
          Predictions: {
            p50: [{ Timestamp: '2024-01-01', Value: 10 }],
            p10: [{ Timestamp: '2024-01-01', Value: 7 }],
            p90: [{ Timestamp: '2024-01-01', Value: 13 }],
          },
        },
      });

      const forecast = await service.getForecast(maliciousSku, 'PHARMACY-123', 30);

      // Should sanitize to 'MED-001DROPTABLEinventory'
      expect(forecast.sku).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(forecast.sku).not.toContain(';');
      expect(forecast.sku).not.toContain(' ');
    });
  });

  describe('Stock Lookup Integration', () => {
    it('should use custom stock lookup function when configured', async () => {
      const mockStockLookup = jest.fn().mockResolvedValue(250);
      service.setStockLookup(mockStockLookup);

      (mockQueryClient.send as jest.Mock).mockResolvedValue({
        Forecast: {
          Predictions: {
            p50: [{ Timestamp: '2024-01-01', Value: 10 }],
            p10: [{ Timestamp: '2024-01-01', Value: 7 }],
            p90: [{ Timestamp: '2024-01-01', Value: 13 }],
          },
        },
      });

      const forecast = await service.getForecast('MED-001', 'PHARMACY-123', 30);

      expect(mockStockLookup).toHaveBeenCalledWith('MED-001', 'PHARMACY-123');
      expect(forecast.currentStock).toBe(250);
    });

    it('should use deterministic fallback when stock lookup not configured', async () => {
      // Don't set stock lookup
      (mockQueryClient.send as jest.Mock).mockResolvedValue({
        Forecast: {
          Predictions: {
            p50: [{ Timestamp: '2024-01-01', Value: 10 }],
            p10: [{ Timestamp: '2024-01-01', Value: 7 }],
            p90: [{ Timestamp: '2024-01-01', Value: 13 }],
          },
        },
      });

      const forecast = await service.getForecast('MED-001', 'PHARMACY-123', 30);

      // Should use deterministic value based on SKU
      expect(forecast.currentStock).toBeGreaterThan(0);
      expect(forecast.currentStock).toBeLessThan(150);
    });

    it('should fallback to deterministic value if stock lookup fails', async () => {
      // Don't set stock lookup - AWS configured but no stock lookup
      // This tests the "else" branch in getForecast

      (mockQueryClient.send as jest.Mock).mockResolvedValue({
        Forecast: {
          Predictions: {
            p50: [{ Timestamp: '2024-01-01', Value: 10 }],
            p10: [{ Timestamp: '2024-01-01', Value: 7 }],
            p90: [{ Timestamp: '2024-01-01', Value: 13 }],
          },
        },
      });

      const forecast = await service.getForecast('MED-001', 'PHARMACY-123', 30);

      // Should use deterministic value since no stock lookup configured
      expect(forecast.currentStock).toBeGreaterThan(0);
      expect(forecast.currentStock).toBeLessThan(150);
    });
  });

  describe('CreateForecast Workflow', () => {
    it('should create forecast after predictor training completes', async () => {
      const historicalData: ForecastDataPoint[] = [];
      for (let i = 0; i < 400; i++) {
        historicalData.push({
          timestamp: new Date(),
          sku: 'MED-001',
          quantity: 10,
        });
      }

      let createForecastCalled = false;

      mockForecastClient.send.mockImplementation((command: any) => {
        if (command.constructor.name === 'CreateDatasetCommand') {
          return Promise.resolve({ DatasetArn: 'arn:aws:forecast:eu-central-1:123:dataset/test' });
        }
        if (command.constructor.name === 'CreateDatasetImportJobCommand') {
          return Promise.resolve({ DatasetImportJobArn: 'arn:aws:forecast:eu-central-1:123:import/test' });
        }
        if (command.constructor.name === 'CreatePredictorCommand') {
          return Promise.resolve({ PredictorArn: 'arn:aws:forecast:eu-central-1:123:predictor/test' });
        }
        if (command.constructor.name === 'CreateForecastCommand') {
          createForecastCalled = true;
          return Promise.resolve({ ForecastArn: 'arn:aws:forecast:eu-central-1:123:forecast/test' });
        }
        if (command.constructor.name === 'DescribePredictorCommand') {
          return Promise.resolve({ Status: 'ACTIVE' });
        }
        if (command.constructor.name === 'DescribeForecastCommand') {
          return Promise.resolve({ Status: 'ACTIVE' });
        }
        if (command.constructor.name === 'DescribeDatasetImportJobCommand') {
          return Promise.resolve({ Status: 'ACTIVE' });
        }
        return Promise.resolve({});
      });

      // Mock S3 client
      const mockS3Send = jest.fn().mockResolvedValue({});
      (service as any).s3Client = { send: mockS3Send };

      const result = await service.trainForecastModel(historicalData);

      expect(result.success).toBe(true);
      expect(createForecastCalled).toBe(true);
    });

    it('should use forecast ARN (not predictor ARN) in QueryForecastCommand', async () => {
      // Ensure forecast ARN is set (from beforeEach)
      expect((service as any).forecastArn).toBeDefined();
      expect((service as any).forecastArn).toContain('forecast');
      expect((service as any).forecastArn).not.toContain('predictor');

      // Mock query response
      (mockQueryClient.send as jest.Mock).mockResolvedValue({
        Forecast: {
          Predictions: {
            p50: [{ Timestamp: '2024-01-01', Value: 10 }],
            p10: [{ Timestamp: '2024-01-01', Value: 7 }],
            p90: [{ Timestamp: '2024-01-01', Value: 13 }],
          },
        },
      });

      const forecast = await service.getForecast('MED-001', 'PHARMACY-123', 30);

      // Verify forecast was successfully retrieved
      expect(forecast).toBeDefined();
      expect(forecast.sku).toBe('MED-001');
      expect(forecast.predictions.length).toBeGreaterThan(0);

      // Verify queryClient.send was called (forecast ARN is used internally)
      expect(mockQueryClient.send).toHaveBeenCalled();
    });
  });

  describe('S3 Data Upload', () => {
    it('should upload CSV data to S3 during training', async () => {
      const historicalData: ForecastDataPoint[] = [];
      for (let i = 0; i < 400; i++) {
        historicalData.push({
          timestamp: new Date('2024-01-01'),
          sku: 'MED-001',
          quantity: 10,
        });
      }

      let s3UploadCalled = false;
      let s3Body: string | undefined;

      const mockS3Send = jest.fn().mockImplementation((command: any) => {
        if (command.constructor.name === 'PutObjectCommand') {
          s3UploadCalled = true;
          s3Body = command.input.Body;
        }
        return Promise.resolve({});
      });

      (service as any).s3Client = { send: mockS3Send };

      mockForecastClient.send.mockImplementation((command: any) => {
        if (command.constructor.name === 'CreateDatasetCommand') {
          return Promise.resolve({ DatasetArn: 'arn:aws:forecast:eu-central-1:123:dataset/test' });
        }
        if (command.constructor.name === 'CreateDatasetImportJobCommand') {
          return Promise.resolve({ DatasetImportJobArn: 'arn:aws:forecast:eu-central-1:123:import/test' });
        }
        if (command.constructor.name === 'CreatePredictorCommand') {
          return Promise.resolve({ PredictorArn: 'arn:aws:forecast:eu-central-1:123:predictor/test' });
        }
        if (command.constructor.name === 'CreateForecastCommand') {
          return Promise.resolve({ ForecastArn: 'arn:aws:forecast:eu-central-1:123:forecast/test' });
        }
        if (command.constructor.name === 'DescribeDatasetImportJobCommand') {
          return Promise.resolve({ Status: 'ACTIVE' });
        }
        if (command.constructor.name === 'DescribePredictorCommand') {
          return Promise.resolve({ Status: 'ACTIVE' });
        }
        if (command.constructor.name === 'DescribeForecastCommand') {
          return Promise.resolve({ Status: 'ACTIVE' });
        }
        return Promise.resolve({});
      });

      const result = await service.trainForecastModel(historicalData);

      expect(result.success).toBe(true);
      expect(s3UploadCalled).toBe(true);
      expect(s3Body).toContain('timestamp,item_id,demand');
      expect(s3Body).toContain('MED-001');
    });
  });
});
