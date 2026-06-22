import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { sanitizeFileName } from '../../common/utils/file.utils';
import {
  assertWasteImageOwnership,
  detectImageMimeType,
  hasPathTraversalInFileName,
  parseAllowedMimeTypes,
} from './waste-image.validation';

describe('waste-image.validation', () => {
  it('detects jpeg, png, and webp magic bytes', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const webp = Buffer.from('RIFFxxxxWEBP', 'ascii');

    expect(detectImageMimeType(jpeg)).toBe('image/jpeg');
    expect(detectImageMimeType(png)).toBe('image/png');
    expect(detectImageMimeType(webp)).toBe('image/webp');
    expect(detectImageMimeType(Buffer.from('not-image'))).toBeNull();
  });

  it('rejects path traversal in file names', () => {
    expect(hasPathTraversalInFileName('../secret.jpg')).toBe(true);
    expect(hasPathTraversalInFileName('folder/photo.jpg')).toBe(true);
    expect(hasPathTraversalInFileName('photo.jpg')).toBe(false);
  });

  it('sanitizes file names up to 255 characters', () => {
    const longName = `${'a'.repeat(300)}.jpg`;
    expect(sanitizeFileName(longName).length).toBeLessThanOrEqual(255);
  });

  it('enforces waste image ownership by user id in path', () => {
    const userId = '11111111-1111-1111-1111-111111111111';

    expect(() =>
      assertWasteImageOwnership(
        'waste-images/11111111-1111-1111-1111-111111111111/temp/file.jpg',
        userId,
        'waste-images',
      ),
    ).not.toThrow();

    expect(() =>
      assertWasteImageOwnership(
        'waste-images/22222222-2222-2222-2222-222222222222/temp/file.jpg',
        userId,
        'waste-images',
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects invalid storage paths', () => {
    const userId = '11111111-1111-1111-1111-111111111111';

    expect(() =>
      assertWasteImageOwnership(
        'waste-images/../escape/file.jpg',
        userId,
        'waste-images',
      ),
    ).toThrow(BadRequestException);
  });

  it('parses allowed mime types from env string', () => {
    expect(parseAllowedMimeTypes('image/jpeg, image/png')).toEqual([
      'image/jpeg',
      'image/png',
    ]);
  });
});
