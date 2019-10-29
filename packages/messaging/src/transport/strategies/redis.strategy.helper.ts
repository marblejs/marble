import * as redis from 'redis';
import { TransportMessage } from '../transport.interface';

export const connectClient = (options?: redis.ClientOpts | undefined): Promise<redis.RedisClient> =>
  new Promise((resolve, reject) => {
    const client = redis.createClient(options);
    client.once('connect', error => error ? reject() : resolve(client));
  });

export const quitClient = (client: redis.RedisClient): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.quit(error => error ? reject() : resolve());
  });

export const setExpirationForChannel = (client: redis.RedisClient) => (channel: string) => (seconds: number): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.expire(channel, seconds, error => error ? reject() : resolve());
  });

export const subscribeChannel = (client: redis.RedisClient) => (channel: string): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.subscribe(channel, error => error ? reject() : resolve());
  });

export const unsubscribeChannel = (client: redis.RedisClient) => (channel: string): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.unsubscribe(channel, error => error ? reject() : resolve());
  });

export const publishMessage = (client: redis.RedisClient) => (channel: string) => (message: string): Promise<boolean>  =>
  new Promise((res, rej) => {
    client.publish(channel, message, err => err ? rej(false) : res(true));
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

