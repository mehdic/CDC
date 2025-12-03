/**
 * Image Enhancement Utilities Tests
 * T5-025: Image enhancement tests
 */

import {
  enhancePrescriptionImage,
  enhancePoorQualityImage,
  enhanceMultiplePrescriptions,
  assessImageQuality,
  isEnhancementAvailable,
} from '../utils/imageEnhancement';
import { S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

// Mock AWS S3
jest.mock('@aws-sdk/client-s3');

// Mock sharp
jest.mock('sharp');

describe('Image Enhancement Utilities', () => {
  const mockS3Url = 'https://test-bucket.s3.eu-central-1.amazonaws.com/prescriptions/test-rx.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isEnhancementAvailable', () => {
    it('should return true when sharp is available', () => {
      const available = isEnhancementAvailable();
      expect(available).toBe(true);
    });
  });

  describe('enhancePrescriptionImage', () => {
    it('should apply all default enhancements', async () => {
      // Mock S3 download
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      // Mock sharp operations
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          width: 1000,
          height: 1500,
          format: 'jpeg',
        }),
        rotate: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        sharpen: jest.fn().mockReturnThis(),
        median: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('enhanced-image-data')),
      };

      (sharp as any).mockReturnValue(mockSharpInstance);

      // Mock S3 upload
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({});

      const result = await enhancePrescriptionImage(mockS3Url, {
        autoCrop: true,
        autoRotate: true,
        enhanceContrast: true,
        denoiseImage: true,
      });

      expect(result).toContain('-enhanced.png');
      expect(mockSharpInstance.rotate).toHaveBeenCalled();
      expect(mockSharpInstance.normalize).toHaveBeenCalled();
      expect(mockSharpInstance.sharpen).toHaveBeenCalled();
      expect(mockSharpInstance.median).toHaveBeenCalled();
      expect(mockSharpInstance.trim).toHaveBeenCalled();
    });

    it('should apply upscaling for low-resolution images', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          width: 800, // Low resolution
          height: 600,
          format: 'jpeg',
        }),
        rotate: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        sharpen: jest.fn().mockReturnThis(),
        median: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('enhanced-image-data')),
      };

      (sharp as any).mockReturnValue(mockSharpInstance);
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({});

      await enhancePrescriptionImage(mockS3Url);

      // Should upscale to 2000px width
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 2000,
          kernel: sharp.kernel.lanczos3,
        })
      );
    });

    it('should NOT upscale high-resolution images', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          width: 3000, // High resolution - no upscaling needed
          height: 2000,
          format: 'jpeg',
        }),
        rotate: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        sharpen: jest.fn().mockReturnThis(),
        median: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('enhanced-image-data')),
      };

      (sharp as any).mockReturnValue(mockSharpInstance);
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({});

      await enhancePrescriptionImage(mockS3Url);

      // Should NOT resize
      expect(mockSharpInstance.resize).not.toHaveBeenCalled();
    });

    it('should apply binarization when requested', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          width: 2000,
          height: 1500,
          format: 'jpeg',
        }),
        rotate: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        normalise: jest.fn().mockReturnThis(),
        sharpen: jest.fn().mockReturnThis(),
        median: jest.fn().mockReturnThis(),
        grayscale: jest.fn().mockReturnThis(),
        threshold: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('enhanced-image-data')),
      };

      (sharp as any).mockReturnValue(mockSharpInstance);
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({});

      await enhancePrescriptionImage(mockS3Url, { binarize: true });

      expect(mockSharpInstance.grayscale).toHaveBeenCalled();
      expect(mockSharpInstance.threshold).toHaveBeenCalledWith(128);
    });

    it('should handle S3 download errors', async () => {
      (S3Client.prototype.send as jest.Mock).mockRejectedValue(new Error('S3 download failed'));

      await expect(enhancePrescriptionImage(mockS3Url)).rejects.toThrow('Image enhancement failed');
    });

    it('should handle sharp processing errors', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      (sharp as any).mockImplementation(() => {
        throw new Error('Sharp processing failed');
      });

      await expect(enhancePrescriptionImage(mockS3Url)).rejects.toThrow('Image enhancement failed');
    });
  });

  describe('enhancePoorQualityImage', () => {
    it('should apply aggressive enhancements', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          width: 1000,
          height: 1500,
          format: 'jpeg',
        }),
        rotate: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        normalise: jest.fn().mockReturnThis(),
        sharpen: jest.fn().mockReturnThis(),
        median: jest.fn().mockReturnThis(),
        grayscale: jest.fn().mockReturnThis(),
        threshold: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('enhanced-image-data')),
      };

      (sharp as any).mockReturnValue(mockSharpInstance);
      (S3Client.prototype.send as jest.Mock).mockResolvedValueOnce({});

      await enhancePoorQualityImage(mockS3Url);

      // Should apply binarization for poor quality
      expect(mockSharpInstance.grayscale).toHaveBeenCalled();
      expect(mockSharpInstance.threshold).toHaveBeenCalled();
    });
  });

  describe('enhanceMultiplePrescriptions', () => {
    it('should enhance multiple images in parallel', async () => {
      const urls = [
        'https://bucket.s3.aws.com/img1.jpg',
        'https://bucket.s3.aws.com/img2.jpg',
        'https://bucket.s3.aws.com/img3.jpg',
      ];

      // Mock successful enhancements
      (S3Client.prototype.send as jest.Mock).mockResolvedValue({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(Buffer.from('mock'));
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500, format: 'jpeg' }),
        rotate: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        sharpen: jest.fn().mockReturnThis(),
        median: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('enhanced')),
      };

      (sharp as any).mockReturnValue(mockSharpInstance);

      const results = await enhanceMultiplePrescriptions(urls);

      expect(results.size).toBe(3);
      expect(results.get(urls[0])).toContain('-enhanced.png');
    });

    it('should fallback to original on individual failures', async () => {
      const urls = ['https://bucket.s3.aws.com/img1.jpg', 'https://bucket.s3.aws.com/img2.jpg'];

      // First succeeds, second fails
      (S3Client.prototype.send as jest.Mock)
        .mockResolvedValueOnce({
          Body: {
            on: (event: string, handler: Function) => {
              if (event === 'data') handler(Buffer.from('mock'));
              if (event === 'end') handler();
              return { on: () => {} };
            },
          },
        })
        .mockRejectedValueOnce(new Error('S3 error'));

      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500, format: 'jpeg' }),
        rotate: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        sharpen: jest.fn().mockReturnThis(),
        median: jest.fn().mockReturnThis(),
        trim: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('enhanced')),
      };

      (sharp as any).mockReturnValue(mockSharpInstance);

      const results = await enhanceMultiplePrescriptions(urls);

      expect(results.size).toBe(2);
      expect(results.get(urls[0])).toContain('-enhanced.png');
      expect(results.get(urls[1])).toBe(urls[1]); // Fallback to original
    });
  });

  describe('assessImageQuality', () => {
    it('should assess high-quality images', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValue({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      (sharp as any).mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 2400,
          height: 1800,
          format: 'png',
        }),
        stats: jest.fn().mockResolvedValue({
          channels: [
            {
              mean: 120, // Good brightness
              stdev: 50, // Good contrast
            },
          ],
        }),
      });

      const result = await assessImageQuality(mockS3Url);

      expect(result.qualityScore).toBeGreaterThan(80);
      expect(result.issues.length).toBe(0);
    });

    it('should detect low resolution', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValue({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      (sharp as any).mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 600, // Low resolution
          height: 400,
          format: 'jpeg',
        }),
        stats: jest.fn().mockResolvedValue({
          channels: [{ mean: 120, stdev: 50 }],
        }),
      });

      const result = await assessImageQuality(mockS3Url);

      expect(result.issues).toContain('Low resolution');
      expect(result.recommendations).toEqual(
        expect.arrayContaining([expect.stringMatching(/upscaling/i)])
      );
    });

    it('should detect poor brightness', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValue({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      (sharp as any).mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 2000,
          height: 1500,
          format: 'jpeg',
        }),
        stats: jest.fn().mockResolvedValue({
          channels: [
            {
              mean: 30, // Too dark
              stdev: 50,
            },
          ],
        }),
      });

      const result = await assessImageQuality(mockS3Url);

      expect(result.issues).toContain('Image too dark');
      expect(result.recommendations).toEqual(
        expect.arrayContaining([expect.stringMatching(/contrast/i)])
      );
    });

    it('should detect low contrast', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValue({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      (sharp as any).mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 2000,
          height: 1500,
          format: 'jpeg',
        }),
        stats: jest.fn().mockResolvedValue({
          channels: [
            {
              mean: 120,
              stdev: 20, // Low contrast
            },
          ],
        }),
      });

      const result = await assessImageQuality(mockS3Url);

      expect(result.issues).toContain('Low contrast');
      expect(result.recommendations).toEqual(
        expect.arrayContaining([expect.stringMatching(/contrast.*sharpening/i)])
      );
    });

    it('should detect JPEG compression artifacts', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      (S3Client.prototype.send as jest.Mock).mockResolvedValue({
        Body: {
          on: (event: string, handler: Function) => {
            if (event === 'data') handler(mockImageBuffer);
            if (event === 'end') handler();
            return { on: () => {} };
          },
        },
      });

      (sharp as any).mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 2000,
          height: 1500,
          format: 'jpeg', // JPEG format
        }),
        stats: jest.fn().mockResolvedValue({
          channels: [{ mean: 120, stdev: 50 }],
        }),
      });

      const result = await assessImageQuality(mockS3Url);

      expect(result.issues).toContain('JPEG compression artifacts possible');
      expect(result.recommendations).toEqual(expect.arrayContaining([expect.stringMatching(/denoising/i)]));
    });

    it('should handle assessment errors gracefully', async () => {
      (S3Client.prototype.send as jest.Mock).mockRejectedValue(new Error('S3 error'));

      const result = await assessImageQuality(mockS3Url);

      expect(result.qualityScore).toBe(0);
      expect(result.issues).toContain('Failed to assess image quality');
    });
  });
});
