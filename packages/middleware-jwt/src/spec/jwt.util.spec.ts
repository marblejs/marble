import { HttpRequest } from '@marblejs/core';
import { parseAuthorizationHeader } from '../jwt.util';

describe('JWT util', () => {
  describe('#parseAuthorizationHeader', () => {
    test('retrieves JWT token from header', () => {
      // given
      const token = 'TEST_TOKEN';
      const req = { headers: { authorization: `Bearer ${token}` }};

      // when
      const result = parseAuthorizationHeader(req as HttpRequest);

      // then
      expect(result).toEqual(token);
    });

    test('retrieves token string if authorization header is incomplete', () => {
      // given
      const token = 'TEST_TOKEN';
      const req = { headers: { authorization: token } };

      // when
      const result = parseAuthorizationHeader(req as HttpRequest);

      // then
      expect(result).toEqual(token);
    });

    test('returns empty string if JWT token is not found', () => {
      // given
      const req = { headers: {} };

      // when
      const result = parseAuthorizationHeader(req as HttpRequest);

      // then
      expect(result).toEqual('');
    });
  });
});
