import * as t from 'io-ts';
import { Reporter } from 'io-ts/lib/Reporter';
import { Either } from 'fp-ts/lib/Either';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IOError } from '@marblejs/core';
import { defaultReporter } from './io.reporter';

type Schema =
  | t.InterfaceType<any, any, any, any>
  | t.RecursiveType<any, any, any, any>
  ;

export interface ValidatorOptions {
  reporter?: Reporter<any>;
}

const validateError = (reporter: Reporter<any> = defaultReporter) => (result: Either<t.Errors, any>) =>
  result.getOrElseL(() => {
    throw new IOError('Validation error', reporter.report(result));
  });

export const validator$ = <T, U extends Schema>(schema: U, options: ValidatorOptions = {}) => (i$: Observable<T>) =>
  i$.pipe(
    map(input => schema.decode(input)),
    map(validateError(options.reporter)),
    map(input => input as t.TypeOf<typeof schema>),
  );
