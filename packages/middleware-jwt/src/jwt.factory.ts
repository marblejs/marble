import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';

export type Payload = string | Record<string, unknown> | Buffer;
export type IssuedAt = { iat: number };
export type ExpiresAt = { exp: number };
export type GenerateOptions = jwt.SignOptions & { secret: jwt.Secret };
export type VerifyOptions = jwt.VerifyOptions & { secret: string | Buffer };

type VerifyTokenHandler = <T extends Record<string, unknown>>(opts: VerifyOptions) => (token: string) => Observable<T & IssuedAt>;

export const generateExpirationInHours = (hours = 1) =>
  Math.floor(Date.now() / 1000) + (60 * 60 * hours);

export const generateToken = ({ secret, ...opts }: GenerateOptions) => (payload: Payload = {}) =>
  jwt.sign(payload, secret, opts);

export const verifyToken = <T extends Record<string, unknown>>({ secret, ...opts }: VerifyOptions) => (token: string) =>
  jwt.verify(token, secret,  opts) as T & IssuedAt;

export const verifyToken$: VerifyTokenHandler = <T extends Record<string, unknown>>({ secret, ...opts }) => token =>
  new Observable<T & IssuedAt>(subscriber => {
    jwt.verify(token, secret,  opts, (error, payload) => {
      if (error) {
        return subscriber.error(error);
      }

      subscriber.next(payload as T & IssuedAt);
      subscriber.complete();
    });
  });
