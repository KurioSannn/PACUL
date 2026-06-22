import { Transform } from 'class-transformer';

const HTML_TAG_PATTERN = /<[^>]*>/g;

export function trimString(value: string): string {
  return value.trim();
}

export function truncateMaxLength(value: string, maxLength: number): string {
  if (maxLength <= 0) {
    return '';
  }

  return value.length <= maxLength ? value : value.slice(0, maxLength);
}

export function stripHtml(value: string): string {
  return value.replace(HTML_TAG_PATTERN, '');
}

export function sanitizeText(
  value: string,
  options?: { maxLength?: number },
): string {
  let result = stripHtml(trimString(value));

  if (options?.maxLength !== undefined) {
    result = truncateMaxLength(result, options.maxLength);
  }

  return result;
}

export function SanitizeText(options?: { maxLength?: number }) {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return sanitizeText(value, options);
  });
}
