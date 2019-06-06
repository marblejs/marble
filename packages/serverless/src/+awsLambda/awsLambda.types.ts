export interface AwsLambdaProxyOptions {
  binaryMimeTypes: string[];
}

export enum AwsLambdaHeaders {
  APIGATEWAY_EVENT = 'x-apigateway-event',
  AWSLAMBDA_CONTEXT = 'x-awslambda-context',
}
