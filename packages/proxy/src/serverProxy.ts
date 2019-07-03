import { createServer, IncomingMessage, OutgoingHttpHeaders, OutgoingMessage, request, Server } from 'http';
import { makeSocketPath, normalizeHeaders } from './serverProxy.helpers';
import { HttpMethod, HttpStatus } from '@marblejs/core';
import { isStream } from '@marblejs/core/dist/+internal';
import { Readable } from 'stream';

type Resolver<T> = (result: T | Promise<T>) => void;

export type ServerApp = (req: IncomingMessage, res: OutgoingMessage) => void;
export type Logger = (message: string) => void;

export interface ServerProxyRequest {
  method: HttpMethod;
  path: string;
  host?: string;
  protocol?: string;
  headers?: OutgoingHttpHeaders;
  body?: Buffer | Readable;
}

export interface ServerProxyResponse {
  statusCode: number;
  statusMessage?: string;
  body?: Buffer;
  headers: Record<string, string[]>;
}

export abstract class ServerProxy<ProxyRequest, ProxyResponse> {
  /* istanbul ignore next */
  protected log: Logger = () => void 0;
  private readonly server: Server;
  private listening = false;
  private socketPath: string;

  constructor(
    private app: ServerApp,
  ) {
    this.socketPath = makeSocketPath();
    this.server = createServer(this.app);
    this.server
      .on('close', () => {
        this.listening = false;
        this.logWithTag('closed');
      })
      .on('error', (error: NodeJS.ErrnoException) => {
        this.logWithTag(error.toString());
        if (error.code === 'EADDRINUSE') {
          this.socketPath = makeSocketPath();
          this.server.close(() => this.startServer());
          return;
        }
      })
      .on('listening', () => {
        this.listening = true;
        this.logWithTag('listening');
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

  /** Emits an error to server for testing purposes */
  emitError(error: Error) {
    this.server.emit('error', error);
  }

  private logWithTag(message: string): void {
    this.log(`[ServerProxy ${this.socketPath}] ${message}`);
  }

  private sendToServer(serverProxyRequest: ServerProxyRequest, resolve: Resolver<ProxyResponse>) {
    try {
      const { headers = {}, body, host, path, method, protocol } = serverProxyRequest;
      const req = request({
        headers,
        path,
        method,
        host,
        protocol,
        socketPath: this.socketPath,
      }, (response: IncomingMessage) => {
        const bufferChunks: any[] = [];
        response
          .on('data', chunk => bufferChunks.push(chunk))
          .on('end', () => {
            /* istanbul ignore next: Status code is always present in Marble, but TS requires to specify default */
            const {
              statusCode = HttpStatus.OK,
              statusMessage,
              headers,
            } = response;

            resolve(this.normalizeResponse({
              statusCode,
              statusMessage,
              headers: normalizeHeaders(headers),
              body: Buffer.concat(bufferChunks),
            }));
          });
      }).on('error', error => resolve(this.normalizeError(error)));
      if (body) {
        if(isStream(body)){
          body.pipe(req);
        } else {
          req.write(body);
        }
      }
      req.end();
    } catch (error) {
      this.logWithTag(error.toString());
      resolve(this.normalizeError(error));
    }
  };

  private startServer = () => this.server.listen(this.socketPath);

}
