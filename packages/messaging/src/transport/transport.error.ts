import { coreErrorFactory, CoreErrorOptions } from '@marblejs/core';
import { NamedError } from '@marblejs/core/dist/+internal/utils';

export enum ErrorType {
  UNSUPPORTED_ERROR = 'UnsupportedError',
}

export class UnsupportedError extends NamedError {
  constructor(public readonly message: string) {
    super(ErrorType.UNSUPPORTED_ERROR, message);
  }
}

export const throwUnsupportedError = (transportName: string) => (method: string) => {
  const message = `Unsupported operation.`;
  const detail = `Method "${method}" is unsupported for ${transportName} transport layer.`;
  const error = new UnsupportedError(`${message} ${detail}`);
  const coreErrorOptions: CoreErrorOptions =  { contextMethod: method, offset: 1 };
  const coreError = coreErrorFactory(error.message, coreErrorOptions);

  console.error(coreError.stack);

  throw error;
};
