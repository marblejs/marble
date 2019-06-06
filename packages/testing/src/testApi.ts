import { TestProxy } from './testProxy';
import { BoundDependency, createContext, HttpHeaders, httpListener, HttpMethod, registerAll } from '@marblejs/core';
import { setTestingMode } from '@marblejs/core/dist/+internal/testing';
import { TestProxyOptions } from './testProxy.options';
import { ApiRequest, Bodyless } from './apiRequest';

export interface ApiTestOptions {
  httpListener: ReturnType<typeof httpListener>;
  proxyOptions?: TestProxyOptions;
  dependencies?: BoundDependency<any>[];
}

export class TestApi {
  private defaultHeaders: HttpHeaders = {};
  private defaultProtocol?: string;
  private defaultHost?: string;

  constructor(private proxy: TestProxy) {
    setTestingMode(true);
  }

  useHeaders(headers: HttpHeaders) {
    this.defaultHeaders = headers;
    return this;
  }

  useProtocol(protocol: string | undefined) {
    this.defaultProtocol = protocol;
    return this;
  }

  useHost(host: string | undefined) {
    this.defaultHost = host;
    return this;
  }

  connect(path: string) {
    return this.request<Bodyless>('CONNECT', path);
  }

  options(path: string) {
    return this.request<Bodyless>('OPTIONS', path);
  }

  trace(path: string) {
    return this.request<Bodyless>('TRACE', path);
  }

  head(path: string) {
    return this.request<Bodyless>('HEAD', path);
  }

  get(path: string) {
    return this.request<Bodyless>('GET', path);
  }

  post(path: string) {
    return this.request('POST', path);
  }

  patch(path: string) {
    return this.request('PATCH', path);
  }

  put(path: string) {
    return this.request('PUT', path);
  }

  delete(path: string) {
    return this.request<Bodyless>('DELETE', path);
  }

  private request<IsBodyless = false>(method: HttpMethod, path: string) {
    let request = new ApiRequest<IsBodyless>(this.proxy, method, path)
      .withHeaders(this.defaultHeaders);
    if (this.defaultHost) {
      request = request.withHost(this.defaultHost);
    }
    if (this.defaultProtocol) {
      request = request.withProtocol(this.defaultProtocol);
    }
    return request;
  }

  finish() {
    setTestingMode(false);
    this.proxy.close();
  }
}

export const createTestApi = ({
  httpListener,
  proxyOptions,
  dependencies = [],
}: ApiTestOptions) => {
  const context = registerAll([...dependencies])(createContext());
  const app = httpListener.run(context);
  return new TestApi(new TestProxy(app, proxyOptions));
};
