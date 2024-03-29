import { RedisClient, ClientOpts } from 'redis';
import { TransportMessage } from '../transport.interface';

export const connectClient = async (options?: ClientOpts | undefined): Promise<RedisClient> => {
  const redis = await import('redis');

  return new Promise((resolve, reject) => {
    const client = redis.createClient(options);
    client.once('connect', error => error ? reject() : resolve(client));
  });
};

export const quitClient = (client: RedisClient): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.quit(error => error ? reject() : resolve(undefined));
  });

export const subscribeChannel = (client: RedisClient) => (channel: string): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.subscribe(channel, error => error ? reject() : resolve(undefined));
  });

export const unsubscribeChannel = (client: RedisClient) => (channel: string): Promise<undefined> =>
  new Promise((resolve, reject) => {
    client.unsubscribe(channel, error => error ? reject() : resolve(undefined));
  });

export const publishMessage = (client: RedisClient) => (channel: string) => (message: string): Promise<boolean>  =>
  new Promise((res, rej) => {
    client.publish(channel, message, err => err ? rej(false) : res(true));
  });

export const encodeMessage = (uuid: string | undefined) => (message: Buffer): string =>
  `${uuid}::${message.toString()}`;

export const decodeMessage = (message: string): TransportMessage<Buffer> => {
  const [id, data] =  message.split('::');

  const parseId = (id: string) => id === 'undefined' ? undefined : id;
  const parseData = (data: string) => Buffer.from(data);

  return {
    correlationId: parseId(id),
    replyTo: parseId(id),
    data: parseData(data),
  };
};

