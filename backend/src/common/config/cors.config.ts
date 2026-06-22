export function parseCorsAllowedOrigins(
  value: string | undefined,
  fallback = 'http://localhost:3000',
): string[] {
  const source = value?.trim() ? value : fallback;

  return source
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
