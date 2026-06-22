const SAFE_FILENAME_PATTERN = /[^a-zA-Z0-9._-]/g;

export function validateFileType(
  mimeType: string,
  allowedTypes: readonly string[],
): boolean {
  const normalized = mimeType.trim().toLowerCase();
  return allowedTypes.some((allowed) => allowed.toLowerCase() === normalized);
}

export function validateFileSize(sizeBytes: number, maxMb: number): boolean {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return false;
  }

  return sizeBytes <= maxMb * 1024 * 1024;
}

export function sanitizeFileName(originalName: string): string {
  const baseName = originalName.split(/[/\\]/).pop() ?? 'file';
  const sanitized = baseName
    .replace(SAFE_FILENAME_PATTERN, '_')
    .replace(/_+/g, '_');

  if (sanitized.length === 0) {
    return 'file';
  }

  return sanitized.slice(0, 255);
}

export function getFileSizeMB(sizeBytes: number): number {
  return Number((sizeBytes / (1024 * 1024)).toFixed(4));
}
