export function isString(data: any): data is string {
  return typeof data === 'string' || data instanceof String;
}

export const trim = (strings: TemplateStringsArray, ...values: any[]) => {
  const notNullValues = values.map(value =>
    value !== null && value !== undefined ? value : ''
  );

  const interpolation = strings.reduce(
    (prev, current) => prev + current + (notNullValues.length ? notNullValues.shift() : ''), '',
  );

  return interpolation.trim();
};
