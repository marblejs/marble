import { AddressInfo } from 'net';
import { Task } from 'fp-ts/lib/Task';
import { HttpServer } from '../http.interface';

export const closeServer = (server: HttpServer): Task<void> => () =>
  new Promise((res, rej) => server.close(err => err ? rej(err) : res(undefined)));

export const getServerAddress = (server: HttpServer): { host: string; port: number } => {
  const serverAddressInfo = server.address() as AddressInfo;
  const host = serverAddressInfo.address === '::' ? '127.0.0.1' : serverAddressInfo.address;
  const port = serverAddressInfo.port;

  return { host, port };
}
