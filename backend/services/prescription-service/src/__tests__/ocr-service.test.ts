/**
 * Enhanced OCR Service Tests
 * T5-024: OCR handwriting recognition tests
 * T5-025: Image enhancement tests
 */

import {
  extractTextWithHandwritingRecognition,
  extractTextFromPrescription,
  OCRLine,
  EnhancedOCRResult,
} from '../services/ocr.service';
import { TextractClient } from '@aws-sdk/client-textract';

// Mock AWS Textract
jest.mock('@aws-sdk/client-textract');

describe('Enhanced OCR Service', () => {
  const mockS3Url = 'https://test-bucket.s3.eu-central-1.amazonaws.com/prescriptions/test-rx.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTextWithHandwritingRecognition', () => {
    it('should extract text with handwriting detection', async () => {
      // Mock Textract response
      const mockBlocks = [
        {
          BlockType: 'LINE',
          Text: 'Dr. Smith',
          Confidence: 95.5,
          Geometry: {
            BoundingBox: {
              Left: 0.1,
              Top: 0.1,
              Width: 0.2,
              Height: 0.05,
            },
          },
        },
        {
          BlockType: 'LINE',
          Text: 'Amoxicillin 500mg',
          Confidence: 65.0, // Low confidence = likely handwritten
          Geometry: {
            BoundingBox: {
              Left: 0.1,
              Top: 0.2,
              Width: 0.3,
              Height: 0.05,
            },
          },
        },
        {
          BlockType: 'WORD',
          Text: 'Amoxicillin',
          Confidence: 65.0,
        },
        {
          BlockType: 'WORD',
          Text: '500mg',
          Confidence: 70.0,
        },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result).toBeDefined();
      expect(result.lines).toHaveLength(2);
      expect(result.words).toHaveLength(2);
      expect(result.fullText).toContain('Dr. Smith');
      expect(result.fullText).toContain('Amoxicillin 500mg');

      // Check handwriting detection
      const printedLine = result.lines.find((l) => l.text === 'Dr. Smith');
      const handwrittenLine = result.lines.find((l) => l.text === 'Amoxicillin 500mg');

      expect(printedLine?.isHandwritten).toBe(false); // High confidence = printed
      expect(handwrittenLine?.isHandwritten).toBe(true); // Low confidence = handwritten
    });

    it('should calculate handwritten percentage correctly', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Printed text', Confidence: 95.0 },
        { BlockType: 'LINE', Text: 'Handwritten 1', Confidence: 60.0 },
        { BlockType: 'LINE', Text: 'Handwritten 2', Confidence: 55.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      // 2 out of 3 lines are handwritten
      expect(result.handwrittenPercentage).toBeCloseTo(66.7, 1);
    });

    it('should calculate overall confidence correctly', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Line 1', Confidence: 90.0 },
        { BlockType: 'LINE', Text: 'Line 2', Confidence: 80.0 },
        { BlockType: 'LINE', Text: 'Line 3', Confidence: 70.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      // Average: (0.9 + 0.8 + 0.7) / 3 = 0.8
      expect(result.overallConfidence).toBeCloseTo(0.8, 2);
    });

    it('should handle empty OCR result', async () => {
      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: [],
      });

      await expect(extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false })).rejects.toThrow(
        'No text detected in image'
      );
    });

    it('should handle AWS Textract errors', async () => {
      (TextractClient.prototype.send as jest.Mock).mockRejectedValue({
        name: 'InvalidS3ObjectException',
        message: 'Object not found',
      });

      await expect(extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false })).rejects.toThrow(
        'Prescription image not found in S3'
      );
    });

    it('should handle invalid parameter errors', async () => {
      (TextractClient.prototype.send as jest.Mock).mockRejectedValue({
        name: 'InvalidParameterException',
        message: 'Invalid image',
      });

      await expect(extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false })).rejects.toThrow(
        'Invalid image format for OCR'
      );
    });

    it('should handle throughput exceeded errors', async () => {
      (TextractClient.prototype.send as jest.Mock).mockRejectedValue({
        name: 'ProvisionedThroughputExceededException',
        message: 'Rate limit exceeded',
      });

      await expect(extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false })).rejects.toThrow(
        'OCR service temporarily unavailable, please retry'
      );
    });
  });

  describe('Swiss Prescription Format Detection', () => {
    it('should detect Swiss prescription format', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Dr. med. Hans Müller', Confidence: 95.0 },
        { BlockType: 'LINE', Text: 'GLN: 7601234567890', Confidence: 92.0 },
        { BlockType: 'LINE', Text: 'Bahnhofstrasse 12, 8001 Zürich', Confidence: 93.0 },
        { BlockType: 'LINE', Text: 'Patient: Maria Schmidt', Confidence: 94.0 },
        { BlockType: 'LINE', Text: 'Rp.', Confidence: 96.0 },
        { BlockType: 'LINE', Text: 'Amoxicillin 500mg', Confidence: 88.0 },
        { BlockType: 'LINE', Text: '31.12.2024', Confidence: 95.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.swissFormat.detected).toBe(true);
      expect(result.swissFormat.format).toMatch(/Swiss/);
      expect(result.swissFormat.elements.medicationSection).toBe(true);
      expect(result.swissFormat.elements.date).toBe('31.12.2024'); // Actual date extracted
    });

    it('should distinguish electronic from handwritten Swiss prescriptions', async () => {
      const mockBlocksElectronic = [
        { BlockType: 'LINE', Text: 'Dr. Schmidt GLN: 7601234567890', Confidence: 95.0 },
        { BlockType: 'LINE', Text: 'Rp.', Confidence: 96.0 },
        { BlockType: 'LINE', Text: 'Amoxicillin 500mg', Confidence: 94.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocksElectronic,
      });

      const resultElectronic = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(resultElectronic.swissFormat.format).toBe('Swiss-Electronic');

      // Now test handwritten
      const mockBlocksHandwritten = [
        { BlockType: 'LINE', Text: 'Dr. Schmidt', Confidence: 60.0 },
        { BlockType: 'LINE', Text: 'Rp.', Confidence: 55.0 },
        { BlockType: 'LINE', Text: 'Amoxicillin', Confidence: 58.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocksHandwritten,
      });

      const resultHandwritten = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(resultHandwritten.swissFormat.format).toBe('Swiss-Handwritten');
    });

    it('should not detect non-Swiss prescriptions', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Dr. John Smith', Confidence: 95.0 },
        { BlockType: 'LINE', Text: '123 Main St, New York, NY', Confidence: 94.0 },
        { BlockType: 'LINE', Text: 'Rx: Amoxicillin 500mg', Confidence: 93.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.swissFormat.detected).toBe(false);
      expect(result.swissFormat.format).toBe('Unknown');
    });
  });

  describe('Image Quality Assessment', () => {
    it('should assess excellent quality', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Dr. med. Hans Müller GLN: 7601234567890', Confidence: 95.0 },
        { BlockType: 'LINE', Text: 'Rp. Amoxicillin 500mg', Confidence: 94.0 },
        { BlockType: 'LINE', Text: '2x täglich für 7 Tage', Confidence: 96.0 },
        { BlockType: 'LINE', Text: '31.12.2024', Confidence: 93.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.imageQuality).toBe('excellent');
      expect(result.warnings).toHaveLength(0);
    });

    it('should assess poor quality with warnings', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Line 1', Confidence: 45.0 },
        { BlockType: 'LINE', Text: 'Line 2', Confidence: 42.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.imageQuality).toBe('poor');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringMatching(/low.*confidence|quality/i)])
      );
    });

    it('should warn about mostly handwritten content', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Handwritten 1', Confidence: 55.0 },
        { BlockType: 'LINE', Text: 'Handwritten 2', Confidence: 58.0 },
        { BlockType: 'LINE', Text: 'Handwritten 3', Confidence: 60.0 },
        { BlockType: 'LINE', Text: 'Handwritten 4', Confidence: 57.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/handwritten/i)]));
    });

    it('should warn about incomplete prescriptions', async () => {
      const mockBlocks = [{ BlockType: 'LINE', Text: 'Line 1', Confidence: 95.0 }];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/few lines|incomplete/i)]));
    });

    it('should warn about non-Swiss format', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Some prescription text', Confidence: 95.0 },
        { BlockType: 'LINE', Text: 'More text here', Confidence: 94.0 },
        { BlockType: 'LINE', Text: 'Additional info', Confidence: 93.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringMatching(/swiss.*format.*not detected/i)])
      );
    });
  });

  describe('Backward Compatibility', () => {
    it('should provide backward-compatible interface', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Line 1', Confidence: 90.0 },
        { BlockType: 'LINE', Text: 'Line 2', Confidence: 85.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextFromPrescription(mockS3Url);

      // Should have same structure as old textract.ts
      expect(result).toHaveProperty('fullText');
      expect(result).toHaveProperty('lines');
      expect(result).toHaveProperty('rawBlocks');

      expect(result.lines).toHaveLength(2);
      expect(result.lines[0]).toHaveProperty('text');
      expect(result.lines[0]).toHaveProperty('confidence');

      // Should NOT have enhanced properties (backward compatible)
      expect(result.lines[0]).not.toHaveProperty('isHandwritten');
    });
  });

  describe('Handwriting Detection Heuristics', () => {
    it('should detect handwriting by low confidence', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Handwritten text', Confidence: 60.0 },
        { BlockType: 'WORD', Text: 'Handwritten', Confidence: 60.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.lines[0].isHandwritten).toBe(true);
      expect(result.words[0].isHandwritten).toBe(true);
    });

    it('should detect handwriting by single character with low confidence', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'A', Confidence: 80.0 },
        { BlockType: 'WORD', Text: 'A', Confidence: 80.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.lines[0].isHandwritten).toBe(true);
    });

    it('should detect handwriting by mixed case with low confidence', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'AmOx', Confidence: 72.0 },
        { BlockType: 'WORD', Text: 'AmOx', Confidence: 72.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.lines[0].isHandwritten).toBe(true);
    });

    it('should NOT detect printed text as handwriting', async () => {
      const mockBlocks = [
        { BlockType: 'LINE', Text: 'Printed text with high confidence', Confidence: 95.0 },
        { BlockType: 'WORD', Text: 'Printed', Confidence: 95.0 },
      ];

      (TextractClient.prototype.send as jest.Mock).mockResolvedValue({
        Blocks: mockBlocks,
      });

      const result = await extractTextWithHandwritingRecognition(mockS3Url, { enhanceImage: false });

      expect(result.lines[0].isHandwritten).toBe(false);
      expect(result.words[0].isHandwritten).toBe(false);
    });
  });
});
