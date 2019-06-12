import { binaryMimeTypes } from '@marblejs/proxy';

export const defaultAwsLambdaProxyOptions = {
  binaryMimeTypes,
  logger: console.log,
};
