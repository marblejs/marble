import { AwsLambdaProxyOptions } from './+awsLambda/awsLambda.types';
import { BoundDependency, createContext, httpListener, registerAll } from '@marblejs/core';

export enum ProxyType {
  AWS = 'aws',
}

type ProxyOptions<Type extends ProxyType> =
  Type extends ProxyType.AWS ? Partial<AwsLambdaProxyOptions> :
    never;

export interface LambdaOptions<Type extends ProxyType> {
  httpListener: ReturnType<typeof httpListener>;
  type: ProxyType;
  dependencies?: BoundDependency<any>[];
  proxyOptions?: ProxyOptions<Type>;
}

export const createLambda = <Type extends ProxyType>({
  httpListener,
  type,
  dependencies = [],
  proxyOptions
}: LambdaOptions<Type>) => {
  const context = registerAll([...dependencies])(createContext());
  const app = httpListener.run(context);
  switch (type) {
    case ProxyType.AWS:
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createAwsLambdaHandler } = require('./+awsLambda');
      return createAwsLambdaHandler(app, proxyOptions);
    default:
      throw new Error(`Invalid type specified. Expected: ${Object.values(ProxyType)}`);
  }
};
