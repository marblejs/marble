import * as path from 'path';

export const makeSocketPath = () => {
  const suffix = Math.random().toString(36).substring(2, 15);
  /* istanbul ignore if */
  if (/^win/.test(process.platform)) {
    return path.join('\\\\?\\pipe', process.cwd(), `server-${suffix}`);
  } else {
    return `/tmp/server-${suffix}.sock`;
  }
};

export const normalizeHeaders = (
  inputHeaders: Record<string, string | string[] | undefined>,
): Record<string, string[]> => {
  const headers = Object.keys(inputHeaders)
    .reduce((headers, key) => {
      const header = headers[key] || (headers[key] = []);
      const value = inputHeaders[key];
      if (typeof value === 'string') {
        header.push(value);
      } else if (Array.isArray(value)) {
        header.push(...value.filter(v => v !== undefined));
      }
      return headers;
    }, {});
  for (const key in headers) {
    if (!headers[key].length) {
      delete headers[key];
    }
  }
  return headers;
};

type MaybeArray<T> = T | T[];

export const getHeaderByKey = (
  headers: Record<string, MaybeArray<number | string | boolean | undefined>> | undefined = {},
  key: string,
) => {
  const lowercaseKey = key.toLowerCase();
  const foundKey = Object.keys(headers).find(key => key.toLowerCase() === lowercaseKey);
  const header = foundKey && headers[foundKey];
  return header && String(Array.isArray(header) ? header[0] : header);
};
