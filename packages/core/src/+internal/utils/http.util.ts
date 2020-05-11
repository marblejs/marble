import { AddressInfo } from 'net';
import { pipe } from 'fp-ts/lib/pipeable';
import { Task } from 'fp-ts/lib/Task';
import { toUndefined } from 'fp-ts/lib/Option';
import { HttpRequest, HttpServer } from '../../http/http.interface';
import { getHead } from './array.util';

export const getHeaderValueHead = <T extends string = string>(key: string) => (req: HttpRequest): T | undefined => {
  const header = req.headers[key.toLowerCase()];
  return Array.isArray(header)
    ? pipe(getHead(header), toUndefined) as T
    : header as T;
};

export const closeServer = (server: HttpServer): Task<void> =>
  () => new Promise((res, rej) =>
    server.close(err => err ? rej(err) : res()));

export const getServerAddress = (server: HttpServer): { host: string; port: number } => {
  const serverAddressInfo = server.address() as AddressInfo;
  const host = serverAddressInfo.address === '::' ? '127.0.0.1' : serverAddressInfo.address;
  const port = serverAddressInfo.port;

  return { host, port };
}

