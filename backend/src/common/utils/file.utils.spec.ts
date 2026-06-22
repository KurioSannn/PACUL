import {
  getFileSizeMB,
  sanitizeFileName,
  validateFileSize,
  validateFileType,
} from './file.utils';

describe('file.utils', () => {
  it('validateFileType accepts allowed mime types', () => {
    expect(validateFileType('image/jpeg', ['image/jpeg', 'image/png'])).toBe(
      true,
    );
    expect(validateFileType('image/gif', ['image/jpeg', 'image/png'])).toBe(
      false,
    );
  });

  it('validateFileSize enforces max size in MB', () => {
    expect(validateFileSize(4 * 1024 * 1024, 5)).toBe(true);
    expect(validateFileSize(6 * 1024 * 1024, 5)).toBe(false);
  });

  it('sanitizeFileName removes unsafe characters', () => {
    expect(sanitizeFileName('../../evil name!.jpg')).toBe('evil_name_.jpg');
    expect(sanitizeFileName('')).toBe('file');
  });

  it('getFileSizeMB converts bytes to MB', () => {
    expect(getFileSizeMB(1024 * 1024)).toBe(1);
  });
});
