import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { EventEmitter } from 'events';
import { forkJoin, lastValueFrom, ReplaySubject } from 'rxjs';
import { tap, filter, take } from 'rxjs/operators';
import { pipe, constant } from 'fp-ts/lib/function';
import { lookup, bindTo, useContext, createContextToken, Event } from '@marblejs/core';
import { HttpServer } from '../http.interface';
import { HttpServerClientToken } from './internal-dependencies/httpServerClient.reader';
import { httpListener } from './http.server.listener';
import { createServer } from './http.server';
import {
  ServerEventType,
  isListeningEvent,
  isUpgradeEvent,
  isConnectEvent,
  isErrorEvent,
  isConnectionEvent,
  isCheckContinueEvent,
  isCheckExpectationEvent,
  isClientErrorEvent,
  isCloseEvent,
} from './http.server.event';

describe('#createServer', () => {
  let server: HttpServer;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(done => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test('creates http server and starts listening', async () => {
    // given
    const hostname = '127.0.0.1';
    const app = await createServer({
      hostname,
      listener: httpListener(),
    });

    // when
    server = await app();

    // then
    expect(server.listening).toBe(true);
  });

  test('creates http server and starts listening without specified port and hostname', async () => {
    // given
    const app = await createServer({
      listener: httpListener(),
    });

    // when
    server = await app();

    // then
    expect(server.listening).toBe(true);
  });

  test('creates https server', async () => {
    // given
    const httpsOptions: https.ServerOptions = {
      key: fs.readFileSync(path.resolve(__dirname, '../../../../assets/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../../../assets/cert.pem')),
    };
    const app = await createServer({
      listener: httpListener(),
      options: { httpsOptions },
    });

    // when
    server = await app();

    // then
    expect(server.listening).toBe(true);
  });

  test('returns server via context', async () => {
    // given
    const app = await createServer({
      listener: httpListener(),
    });

    // when
    server = await app();

    const ask = lookup(app.context);
    const boundServer = useContext(HttpServerClientToken)(ask);

    expect(boundServer).toBeDefined();
  });

  test('can register `nullable` context dependency', async () => {
    // given - context dependency
    const someToken = createContextToken();
    const someDependency = 'test';

    // given - server
    const app = await createServer({
      listener: httpListener(),
      dependencies: [
        bindTo(someToken)(constant(someDependency)),
        undefined,
      ],
    });

    // when
    server = await app();

    // then
    const ask = lookup(app.context);
    const boundDependency = useContext(someToken)(ask);

    expect(boundDependency).toEqual(someDependency);
  });

  test(`emits server events`, async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(9);
    const app = await createServer({
      listener: httpListener(),
      event$: event$ => event$.pipe(tap(event => eventSubject.next(event))),
    });

    server = await app();

    // when
    server.emit(ServerEventType.ERROR, new Error('test_error'));
    server.emit(ServerEventType.CLIENT_ERROR);
    server.emit(ServerEventType.CONNECT);
    server.emit(ServerEventType.CONNECTION, new EventEmitter());
    server.emit(ServerEventType.LISTENING);
    server.emit(ServerEventType.UPGRADE);
    server.emit(ServerEventType.CHECK_CONTINUE);
    server.emit(ServerEventType.CHECK_EXPECTATION);
    server.emit(ServerEventType.CLOSE);

    // then
    await pipe(
      forkJoin([
        eventSubject.pipe(filter(isErrorEvent), take(1)),
        eventSubject.pipe(filter(isClientErrorEvent), take(1)),
        eventSubject.pipe(filter(isCloseEvent), take(1)),
        eventSubject.pipe(filter(isConnectEvent), take(1)),
        eventSubject.pipe(filter(isConnectionEvent), take(1)),
        eventSubject.pipe(filter(isListeningEvent), take(1)),
        eventSubject.pipe(filter(isUpgradeEvent), take(1)),
        eventSubject.pipe(filter(isCheckContinueEvent), take(1)),
        eventSubject.pipe(filter(isCheckExpectationEvent), take(1)),
      ]),
      lastValueFrom,
    );
  });
});
