import { createServer, IncomingMessage, OutgoingHttpHeaders, OutgoingMessage, request, Server } from 'http';
import { makeSocketPath, normalizeHeaders } from './serverProxy.helpers';
import { HttpMethod } from '@marblejs/core';

type Resolver<T> = (result: T | Promise<T>) => void;

export type ServerApp = (req: IncomingMessage, res: OutgoingMessage) => void;

export interface ServerProxyRequest {
  method: HttpMethod;
  path: string;
  host?: string;
  protocol?: string;
  headers?: OutgoingHttpHeaders;
  body?: Buffer;
}

export interface ServerProxyResponse {
  statusCode?: number;
  statusMessage?: string;
  body: Buffer;
  headers: Record<string, string[]>;
}

export abstract class ServerProxy<ProxyRequest, ProxyResponse> {
  private readonly server: Server;
  private listening = false;
  private socketPath: string;

  constructor(
    private app: ServerApp
  ) {
    this.socketPath = makeSocketPath();
    this.server = createServer(this.app);
    this.server
      .on('close', () => {
        this.listening = false;
        console.log(this.logTag, 'closed');
      })
      .on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          this.socketPath = makeSocketPath();
          this.server.close(() => this.startServer());
          return;
        }
        console.log(this.logTag, error.toString());
      })
      .on('listening', () => {
        this.listening = true;
        console.log(this.logTag, 'listening');
      });
  }

  close(): void {
    this.server.close();
  }

  abstract normalizeRequest(proxyRequest: ProxyRequest): ServerProxyRequest | Promise<ServerProxyRequest>;

  abstract normalizeResponse(serverProxyResponse: ServerProxyResponse): ProxyResponse | Promise<ProxyResponse>;

  abstract normalizeError(error: Error): ProxyResponse | Promise<ProxyResponse>;

  async handle(proxyRequest: ProxyRequest): Promise<ProxyResponse> {
    const serverProxyRequest = await Promise.resolve(this.normalizeRequest(proxyRequest));
    return await new Promise<ProxyResponse>((resolve) => {
      if (this.listening) {
        this.sendToServer(serverProxyRequest, resolve);
      } else {
        this.server.on('listening', () => this.sendToServer(serverProxyRequest, resolve));
        this.startServer();
      }
    });
  }

  private get logTag(): string {
    return `ServerProxy ${this.socketPath}`;
  }

  private sendToServer(serverProxyRequest: ServerProxyRequest, resolve: Resolver<ProxyResponse>) {
    try {
      const { headers = {}, body, host, path, method, protocol } = serverProxyRequest;
      if (body) {
        headers['Content-Type'] = headers['Content-Type'] || 'text/plain; charset=utf-8';
      }
      const req = request({
        headers,
        path,
        method,
        host,
        protocol,
        socketPath: this.socketPath,
      }, (response: IncomingMessage) => {
        response.headers = normalizeHeaders(response.headers);
        const bufferChunks: any[] = [];
        response
          .on('data', chunk => bufferChunks.push(chunk))
          .on('end', () => {
            const { statusCode, statusMessage, headers } = response;

            resolve(this.normalizeResponse({
              statusCode,
              statusMessage,
              headers: normalizeHeaders(headers),
              body: Buffer.concat(bufferChunks),
            }));
          });
      }).on('error', error => resolve(this.normalizeError(error)));
      if (body) {
        req.write(body);
      }
      req.end();
    } catch (error) {
      resolve(this.normalizeError(error));
    }
  };

  private startServer = () => this.server.listen(this.socketPath);

}
