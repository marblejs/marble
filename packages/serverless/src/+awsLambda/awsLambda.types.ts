import { Logger } from '@marblejs/proxy';

export interface AwsLambdaProxyOptions {
  binaryMimeTypes: string[];
  logger: Logger;
}

export enum AwsLambdaHeaders {
  APIGATEWAY_EVENT = 'x-apigateway-event',
  AWSLAMBDA_CONTEXT = 'x-awslambda-context',
}
