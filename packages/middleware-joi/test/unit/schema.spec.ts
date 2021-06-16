/* eslint-disable deprecation/deprecation */

import { HttpRequest } from '@marblejs/core';
import { Observable } from 'rxjs';
import { validator$ } from '../../src';

describe('Joi middleware - Schema', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => jest.fn());
  });

  it('should throws an error if using an invalid schema', done => {
    const schema = { headers: 'foo' };
    const http$ = validator$(schema)(undefined as unknown as Observable<HttpRequest>);
    http$.subscribe({
      next: () => fail('Exceptions should be thrown'),
      error: error => {
        expect(error).toBeDefined();
        done();
      }
    });
  });

  it('should throws an error if using an empty schema', done => {
    const http$ = validator$({})(undefined as unknown as Observable<HttpRequest>);
    http$.subscribe({
      next: () => fail('Exceptions should be thrown'),
      error: err => {
        expect(err).toBeDefined();
        done();
      }
    });
  });
});
