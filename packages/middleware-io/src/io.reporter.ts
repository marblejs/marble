import * as t from 'io-ts';
import { Reporter } from 'io-ts/lib/Reporter';
import { stringify } from '@marblejs/core/dist/+internal/utils';

export interface DefaultReporterResult {
  expected: string;
  got: string;
}

const getErrorMessage = (value: any, context: t.Context): DefaultReporterResult => ({
  expected: context.map(c => `${c.key || 'model'}: ${c.type.name}`).join(' / '),
  got: stringify(value),
});

const failure = (errors: t.ValidationError[]): DefaultReporterResult[] =>
  errors.map(error => getErrorMessage(error.value, error.context));

const success = () =>
  new Array();

export const defaultReporter: Reporter<DefaultReporterResult[]> = {
  report: validation => validation.fold(failure, success),
};
