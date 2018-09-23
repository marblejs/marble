import { JsonWebTokenError } from 'jsonwebtoken';
import { generateToken, verifyToken, verifyToken$, generateExpirationInHours } from '../jwt.factory';

describe('JWT factory', () => {
  test('#generateToken generates and verifies valid JWT token', () => {
    // given
    const secret = 'test_secret';
    const payload = { id: 'test_id' };

    // when
    const token = generateToken({ secret })(payload);
    const verifiedToken = verifyToken({ secret })(token) as typeof payload & { iat: number };

    // then
    expect(typeof token).toBe('string');
    expect(typeof verifiedToken.iat).toBe('number');
    expect(verifiedToken.id).toEqual(payload.id);
  });

  test('#generateToken generates and verifies valid JWT token if payload is undefined', () => {
    // given
    const secret = 'test_secret';

    // when
    const token = generateToken({ secret })();
    const verifiedToken = verifyToken({ secret })(token) as { iat: number };

    // then
    expect(typeof token).toBe('string');
    expect(typeof verifiedToken.iat).toBe('number');
  });

  test('#verifyToken verifies wrong JWT token and throws error', () => {
    // given
    const secret = 'test_secret';
    const payload = { id: 'test_id' };
    const token = generateToken({ secret: 'wrong_secret' })(payload);
    const expectedError = new JsonWebTokenError('invalid signature');

    type Payload = typeof payload;

    // when
    const verifiedToken = () => verifyToken<Payload>({ secret })(token);

    // then
    expect(verifiedToken).toThrowError(expectedError);
  });

  test('#verifyToken$ verifies valid JWT token as stream', done => {
    // given
    const secret = 'test_secret';
    const payload = { id: 'test_id' };
    const token = generateToken({ secret })(payload);

    type Payload = typeof payload;

    // when
    const verify$ = verifyToken$<Payload>({ secret })(token);

    // then
    verify$.subscribe(
      payload => {
        expect(payload.id).toBeDefined();
        expect(payload.iat).toBeDefined();
        done();
      },
      () => {
        fail('Stream should\'t return an error');
        done();
      }
    );
  });

  test('#verifyToken$ verifies wrong JWT token as stream and throws error', done => {
    // given
    const secret = 'test_secret';
    const payload = { id: 'test_id' };

    type Payload = typeof payload;

    // when
    const verify$ = verifyToken$<Payload>({ secret })('test_token');

    // then
    verify$.subscribe(
      () => {
        fail('Stream should\'t return next data');
        done();
      },
      error => {
        expect(error.name).toEqual('JsonWebTokenError');
        expect(error.message).toEqual('jwt malformed');
        done();
      }
    );
  });

  test('#verifyToken$ verifies JWT token with wrong secret as stream and throws error', done => {
    // given
    const secret = 'test_secret';
    const payload = { id: 'test_id' };
    const token = generateToken({ secret })(payload);

    type Payload = typeof payload;

    // when
    const verify$ = verifyToken$<Payload>({ secret: 'wrong_secret' })(token);

    // then
    verify$.subscribe(
      () => {
        fail('Stream should\'t return next data');
        done();
      },
      error => {
        expect(error.name).toEqual('JsonWebTokenError');
        expect(error.message).toEqual('invalid signature');
        done();
      }
    );
  });

  test('#generateExpirationInHours creates timestamp for JWT expiration date', () => {
    // given
    // tslint:disable-next-line:variable-name
    const time_22h_40m = 1537562461868;
    // tslint:disable-next-line:variable-name
    const time_23h_40m = 1537566061;
    // tslint:disable-next-line:variable-name
    const time_24_40 = 1537569661;

    // when
    spyOn(Date, 'now').and.returnValue(time_22h_40m);
    const timestampWithDefault = generateExpirationInHours();
    const timestampFor2h = generateExpirationInHours(2);

    // then
    expect(timestampWithDefault).toEqual(time_23h_40m);
    expect(timestampFor2h).toEqual(time_24_40);
  });
});
