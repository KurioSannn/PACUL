import { BadRequestException, ForbiddenException } from '@nestjs/common';

export type DetectedImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export function detectImageMimeType(
  buffer: Buffer,
): DetectedImageMimeType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

export function hasPathTraversalInFileName(fileName: string): boolean {
  if (!fileName || fileName.includes('\0')) {
    return true;
  }

  if (fileName.includes('..')) {
    return true;
  }

  return /[/\\]/.test(fileName);
}

export function assertWasteImageOwnership(
  path: string,
  userId: string,
  bucketName: string,
): void {
  const normalized = path.replace(/\\/g, '/');

  if (normalized.includes('..') || normalized.includes('//')) {
    throw new BadRequestException({
      error: 'Invalid storage path',
      code: 'INVALID_STORAGE_PATH',
    });
  }

  const objectPath = normalized.startsWith(`${bucketName}/`)
    ? normalized.slice(bucketName.length + 1)
    : normalized;

  if (!objectPath.startsWith(`${userId}/`)) {
    throw new ForbiddenException({
      error: 'You do not have access to this storage path',
      code: 'STORAGE_ACCESS_DENIED',
    });
  }
}

export function parseAllowedMimeTypes(value: string): string[] {
  return value
    .split(',')
    .map((mime) => mime.trim().toLowerCase())
    .filter((mime) => mime.length > 0);
}
