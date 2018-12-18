export function isString(data: any): data is string {
  return typeof data === 'string' || data instanceof String;
}
