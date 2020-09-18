import * as t from 'io-ts';
import { Reporter } from 'io-ts/lib/Reporter';
import { identity } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { Observable } from 'rxjs';
import { map} from 'rxjs/operators';
import { throwException } from '@marblejs/core/dist/+internal/utils';
import { defaultReporter } from './io.reporter';
import { IOError } from './io.error';

export type Schema = t.Any;

export interface ValidatorOptions {
  reporter?: Reporter<any>;
  context?: string;
}

const validateError = (reporter: Reporter<any> = defaultReporter, context?: string) => (result: E.Either<t.Errors, any>) =>
  E.fold(
    () => throwException(new IOError('Validation error', reporter.report(result), context)),
    identity,
  )(result)

export function validator$<U extends Schema, T>(schema: U, options?: ValidatorOptions): (i$: Observable<T>) => Observable<t.TypeOf<U>>;
export function validator$<T>(schema: undefined, options?: ValidatorOptions): (i$: Observable<T>) => Observable<T>;
export function validator$<U extends Schema, T>(schema: U | undefined, options: ValidatorOptions = {}) {
  return (i$: Observable<T>) =>
    !schema ? i$ : i$.pipe(
      map(input => schema.decode(input)),
      map(validateError(options.reporter, options.context)),
    );
}

