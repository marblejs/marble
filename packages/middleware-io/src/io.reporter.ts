import * as t from 'io-ts';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { Reporter } from 'io-ts/lib/Reporter';
import { stringify, getLast } from '@marblejs/core/dist/+internal/utils';

export interface ReporterResult {
  path: string;
  expected: string;
  got: any;
}

const getPath = (context: t.Context) =>
  context
    .map(c => c.key)
    .filter(Boolean)
    .join('.');

const getExpectedType = (context: t.ContextEntry[]) => pipe(
  getLast(context),
  O.map(c => c.type.name),
  O.getOrElse(() => 'any'),
);

const getErrorMessage = (value: any, context: t.Context): ReporterResult => ({
  path: getPath(context),
  expected: getExpectedType(context as t.ContextEntry[]),
  got: stringify(value),
});

const failure = (errors: t.ValidationError[]): ReporterResult[] =>
  errors.map(error => getErrorMessage(error.value, error.context));

const success = () => [];

export const defaultReporter: Reporter<ReporterResult[]> = {
  report: E.fold(failure, success),
};
