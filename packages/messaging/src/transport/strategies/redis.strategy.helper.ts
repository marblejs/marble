import * as redis from 'redis';
import { TransportMessage } from '../transport.interface';

export const connectRedisClient = (options?: redis.ClientOpts | undefined): Promise<redis.RedisClient> =>
  new Promise((resolve, reject) => {
    const client = redis.createClient(options);
    client.on('connect', error => error ? reject() : resolve(client));
  });

export const quitRedisClient = (client: redis.RedisClient): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.quit(error => error ? reject() : resolve());
  });

export const subscribeRedisChannel = (client: redis.RedisClient) => (channel: string): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.subscribe(channel, error => error ? reject() : resolve());
  });

export const unsubscribeRedisChannel = (client: redis.RedisClient) => (channel: string): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.unsubscribe(channel, error => error ? reject() : resolve());
  });

export const encodeMessage = (uuid: string | undefined) => (message: Buffer): string =>
  `${uuid}::${message.toString()}`;

export const decodeMessage = (message: string): TransportMessage<Buffer> => {
  const splittedMsg =  message.split('::');
  return {
    replyTo: splittedMsg[0],
    data: Buffer.from(splittedMsg[1]),
  }
};

