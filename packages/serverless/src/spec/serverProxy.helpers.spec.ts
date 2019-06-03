import { normalizeHeaders } from '../serverProxy.helpers';

describe('@marblejs/serverless - Server Proxy Helpers', () => {
  describe('#normalizeHeaders', () => {
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
});
