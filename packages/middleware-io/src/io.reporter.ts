import * as t from 'io-ts';
import { Reporter } from 'io-ts/lib/Reporter';
import { stringify, getLast } from '@marblejs/core/dist/+internal/utils';

export interface DefaultReporterResult {
  path: string;
  expected: string;
  got: any;
}

const getPath = (context: t.Context) =>
  context
    .map(c => c.key)
    .filter(Boolean)
    .join('.');

const getExpectedType = (context: t.ContextEntry[]) =>
  getLast(context)
    .map(c => c.type.name)
    .valueOr('any');

const getErrorMessage = (value: any, context: t.Context): DefaultReporterResult => {

  return ({
    path: getPath(context),
    expected: getExpectedType(context as t.ContextEntry[]),
    got: stringify(value),
  });
};

const failure = (errors: t.ValidationError[]): DefaultReporterResult[] =>
  errors.map(error => getErrorMessage(error.value, error.context));

const success = () =>
  new Array();

export const defaultReporter: Reporter<DefaultReporterResult[]> = {
  report: validation => validation.fold(failure, success),
};
