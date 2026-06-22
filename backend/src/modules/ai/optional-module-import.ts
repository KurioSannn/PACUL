/* Optional runtime imports for ONNX inference dependencies (not installed by default). */

export async function importOptionalModule<T>(moduleName: string): Promise<T> {
  // Dynamic import by string avoids compile-time module resolution for optional deps.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const importer = new Function('moduleName', 'return import(moduleName)') as (
    name: string,
  ) => Promise<T>;

  return importer(moduleName);
}
