export function isString(data: any): data is string {
  return typeof data === 'string' || data instanceof String;
}

export const trim = (strings: TemplateStringsArray, ...values: any[]) => {
  const notNilValues = values.map(value =>
    value !== null && value !== undefined ? value : ''
  );

  const interpolation = strings.reduce(
    (prev, current) => prev + current + (notNilValues.length ? notNilValues.shift() : ''), '',
  );

  return interpolation.trim();
};

export const stringify = (value: any): string =>
  typeof value === 'function'
    ? (value.displayName || value.name)
    : JSON.stringify(value);
