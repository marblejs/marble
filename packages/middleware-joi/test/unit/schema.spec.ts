import { validator$ } from '../../src';

describe('Joi middleware - Schema', () => {
  it('should throws an error if using an invalid schema', done => {
    const schema = { headers: 'foo' };
    const http$ = validator$(schema)(null, null, {});
    http$.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error).toBeDefined();
        done();
      }
    );
  });

  it('should throws an error if using an empty schema', done => {
    const http$ = validator$({})(null, null, {});
    http$.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error).toBeDefined();
        done();
      }
    );
  });
});
