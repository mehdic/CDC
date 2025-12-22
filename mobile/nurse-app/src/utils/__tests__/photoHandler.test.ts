/**
 * Photo Handler Utilities Tests
 * Unit tests for photo handling functions
 */

import {
  generatePhotoId,
  validatePhotoFile,
  createPhotoFile,
  formatFileSize,
  isPhotoEditable,
} from '../photoHandler';

describe('Photo Handler', () => {
  describe('generatePhotoId', () => {
    it('should generate unique IDs', () => {
      const id1 = generatePhotoId();
      const id2 = generatePhotoId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^photo_/);
      expect(id2).toMatch(/^photo_/);
    });

    it('should start with photo_ prefix', () => {
      const id = generatePhotoId();
      expect(id).toMatch(/^photo_\d+_/);
    });
  });

  describe('validatePhotoFile', () => {
    it('should reject missing file', () => {
      const result = validatePhotoFile(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No photo selected');
    });

    it('should reject oversized files', () => {
      const largeFile = {
        size: 15 * 1024 * 1024, // 15MB
        type: 'image/jpeg',
      };

      const result = validatePhotoFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject invalid file types', () => {
      const invalidFile = {
        size: 1024,
        type: 'video/mp4',
      };

      const result = validatePhotoFile(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JPEG');
    });

    it('should accept valid JPEG', () => {
      const validFile = {
        size: 500 * 1024, // 500KB
        type: 'image/jpeg',
      };

      const result = validatePhotoFile(validFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG', () => {
      const validFile = {
        size: 500 * 1024,
        type: 'image/png',
      };

      const result = validatePhotoFile(validFile);
      expect(result.valid).toBe(true);
    });

    it('should accept valid JPG', () => {
      const validFile = {
        size: 500 * 1024,
        type: 'image/jpg',
      };

      const result = validatePhotoFile(validFile);
      expect(result.valid).toBe(true);
    });

    it('should handle file at exact size limit', () => {
      const limitFile = {
        size: 10 * 1024 * 1024, // exactly 10MB
        type: 'image/jpeg',
      };

      const result = validatePhotoFile(limitFile);
      expect(result.valid).toBe(true);
    });
  });

  describe('createPhotoFile', () => {
    it('should create valid photo file', () => {
      const imageResult = {
        uri: 'file:///path/to/photo.jpg',
        fileName: 'photo.jpg',
        type: 'image/jpeg',
        size: 500 * 1024,
      };

      const photoFile = createPhotoFile(imageResult);

      expect(photoFile).not.toBeNull();
      expect(photoFile?.uri).toBe('file:///path/to/photo.jpg');
      expect(photoFile?.fileName).toBe('photo.jpg');
      expect(photoFile?.type).toBe('image/jpeg');
      expect(photoFile?.id).toMatch(/^photo_/);
    });

    it('should return null for invalid result', () => {
      const photoFile = createPhotoFile(null);
      expect(photoFile).toBeNull();
    });

    it('should return null for missing URI', () => {
      const photoFile = createPhotoFile({ fileName: 'photo.jpg' });
      expect(photoFile).toBeNull();
    });

    it('should return null for invalid file type', () => {
      const imageResult = {
        uri: 'file:///path/to/video.mp4',
        type: 'video/mp4',
        size: 500 * 1024,
      };

      const photoFile = createPhotoFile(imageResult);
      expect(photoFile).toBeNull();
    });

    it('should generate filename if not provided', () => {
      const imageResult = {
        uri: 'file:///path/to/photo',
        type: 'image/jpeg',
        size: 500 * 1024,
      };

      const photoFile = createPhotoFile(imageResult);

      expect(photoFile?.fileName).toMatch(/^photo_\d+\.(jpg|png)$/);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(512)).toMatch(/\d+ B/);
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(2048)).toMatch(/\d+ KB/);
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toMatch(/\d+ MB/);
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toMatch(/\d+ GB/);
    });

    it('should return 0 B for zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should handle decimal values', () => {
      const size = 1.5 * 1024; // 1.5 KB
      const formatted = formatFileSize(size);
      expect(formatted).toContain('KB');
    });
  });

  describe('isPhotoEditable', () => {
    it('should allow JPEG editing', () => {
      const photo = {
        id: 'photo-1',
        uri: 'file:///path',
        fileName: 'photo.jpg',
        type: 'image/jpeg',
        size: 1024,
      };

      expect(isPhotoEditable(photo)).toBe(true);
    });

    it('should allow PNG editing', () => {
      const photo = {
        id: 'photo-1',
        uri: 'file:///path',
        fileName: 'photo.png',
        type: 'image/png',
        size: 1024,
      };

      expect(isPhotoEditable(photo)).toBe(true);
    });

    it('should not allow other types', () => {
      const photo = {
        id: 'photo-1',
        uri: 'file:///path',
        fileName: 'photo.webp',
        type: 'image/webp',
        size: 1024,
      };

      expect(isPhotoEditable(photo)).toBe(false);
    });
  });
});
