import { generateDocumentation } from './openApi.reporter.helper';
import { map, tap } from 'rxjs/operators';
import { bodyParser$ } from '@marblejs/middleware-body';
import { createServer, HttpEffectResponse, httpListener, r } from '@marblejs/core';
import * as http from 'http';
import { DocumentData } from './testing.types';

const createReporterServer = (chunks: DocumentData[]) => {
  const collectEffect$ = r.pipe(
    r.matchPath('/'),
    r.matchType('POST'),
    r.useEffect(req$ => req$.pipe(
      tap(req => chunks.push(req.body as any)),
      map((): HttpEffectResponse => ({
        headers: { 'Content-Type': 'text/plain' },
        body: '',
      }))
    )),
  );

  return createServer({
    httpListener: httpListener({
      middlewares: [bodyParser$()],
      effects: [collectEffect$],
    }),
  }).run();
};

const getServerPort = (server: http.Server): number => {
  const address = server.address();
  if (typeof address === 'string') {
    const portMatch = address.match(/:(\d+)/);
    return Number(portMatch && portMatch[1]);
  } else {
    return address.port;
  }
};

class OpenApiReporter {
  output: string;
  chunks: DocumentData[] = [];
  server?: http.Server;

  constructor(globalConfig, options) {
    this.output = options.output || 'swagger.json';
  }

  onRunStart() {
    const server = this.server = createReporterServer(this.chunks) as http.Server;
    const port = getServerPort(server);
    process.env.MARBLE_TESTING_PORT = String(port);
    console.log(`Created @marblejs/testing report collector on port ${port}`);
  }

  async onRunComplete() {
    if (this.server) {
      this.server.close();
    }
    if (!this.chunks.length) {
      console.log('No chunks provided. Skipping OpenAPI 3.0 doc generation...');
      return;
    }
    console.log(`Generating OpenAPI 3.0 documentation...`);
    await generateDocumentation(this.output, this.chunks);
  }
}

export = OpenApiReporter;
