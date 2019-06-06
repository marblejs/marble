import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { ServerApp } from '../serverProxy';
import { AwsLambdaProxy } from './awsLambdaProxy';
import { AwsLambdaProxyOptions } from './awsLambda.types';

export const createAwsLambdaHandler = (app: ServerApp, options: AwsLambdaProxyOptions) => {
  const proxy = new AwsLambdaProxy(app, options);

  const handler = (event: APIGatewayProxyEvent, context: Context) =>
    proxy.handle({ event, context });
  handler.close = () => proxy.close();
  return handler;
};
