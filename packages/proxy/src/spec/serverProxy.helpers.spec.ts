import { getHeaderByKey, normalizeHeaders } from '../serverProxy.helpers';

describe('@marblejs/proxy - Server Proxy Helpers', () => {
  describe('#normalizeHeaders()', () => {
    test('converts headers to Record<string, string[]> format', () => {
      expect(normalizeHeaders({
        'Content-Type': 'text/plain',
        'Host': ['example.com', 'example2.com'],
        'X-Test': undefined,
        'X-Test-2': [],
        'X-Test-3': '',
      })).toEqual({
        'Content-Type': ['text/plain'],
        'Host': ['example.com', 'example2.com'],
        'X-Test-3': [''],
      })
    });
  });
  describe('#getHeaderByKey()', () => {
    test('returns first element of array header', () => {
      const headers = {
        'content-type': ['text/plain', 'other array element'],
        'Content-Length': 13,
      };
      expect(getHeaderByKey(headers, 'content-type')).toBe('text/plain');
      expect(getHeaderByKey(headers, 'content-length')).toBe('13');
    });
    test('does not care about letter casing', () => {
      const headers = {
        'x-h1': 'h1',
        'X-H2': 'h2',
      };
      expect(getHeaderByKey(headers, 'X-h1')).toBe('h1');
      expect(getHeaderByKey(headers, 'x-h2')).toBe('h2');
    });
    test('stringifies all headers', () => {
      const headers = {
        'X-Number': 13,
        'X-Bool': true,
      };
      expect(getHeaderByKey(headers, 'X-Number')).toBe('13');
      expect(getHeaderByKey(headers, 'X-Bool')).toBe('true');
    });
    test('returns undefined if header or headers object does not exist', () => {
      const headers = {
        'x-header': 'header',
      };
      expect(getHeaderByKey(headers, 'x')).toBe(undefined);
      expect(getHeaderByKey(undefined, 'x')).toBe(undefined);
    });
  });
});
