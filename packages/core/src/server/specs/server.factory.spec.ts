import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { forkJoin } from 'rxjs';
import { mapTo, tap, filter, take } from 'rxjs/operators';
import { httpListener } from '../../listener/http.listener';
import { createServer } from '../server.factory';
import {
  ServerEventType,
  isListenEvent,
  isUpgradeEvent,
  isConnectEvent,
  isErrorEvent,
  isConnectionEvent,
  isCheckContinueEvent,
  isCheckExpectationEvent,
  isClientErrorEvent,
  isRequestEvent,
} from '../server.event';
import { EffectFactory } from '../../effects/effects.factory';
import { mockHttpServer } from '../../+internal/testing';
import { EventEmitter } from 'events';

describe('#createServer', () => {
  let marbleServer: ReturnType<typeof createServer>;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(done => {
    if (marbleServer) {
      marbleServer.server.close(() => done());
    } else {
      done();
    }
  });

  test('creates http server and starts listening to given port', () => {
    // given
    const port = 1337;
    const hostname = '127.0.0.1';
    const app = httpListener({ effects: [] });
    const mocks = { listen: jest.fn(), on: jest.fn() };

    // when
    mockHttpServer(mocks);
    marbleServer = createServer({
      port,
      hostname,
      httpListener: app,
    });

    // then
    expect(mocks.listen.mock.calls[0][0]).toBe(port);
    expect(mocks.listen.mock.calls[0][1]).toBe(hostname);
  });

  test('creates http server and starts listening without specified port and hostname', () => {
    // given
    const app = httpListener({ effects: [] });
    const mocks = { listen: jest.fn(), on: jest.fn() };

    // when
    mockHttpServer(mocks);
    marbleServer = createServer({ httpListener: app });

    // then
    expect(mocks.listen.mock.calls[0][0]).toBe(undefined);
    expect(mocks.listen.mock.calls[0][1]).toBe(undefined);
  });

  test('creates https server', done => {
    // given
    const app = httpListener({ effects: [] });
    const httpsOptions: https.ServerOptions = {
      key: fs.readFileSync(path.resolve(__dirname, '../../../../../assets/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../../../../assets/cert.pem')),
    };

    // when
    marbleServer = createServer({
      httpListener: app,
      options: { httpsOptions },
    });

    // then
    setTimeout(() => {
      expect(marbleServer.server.listening).toBe(true);
      marbleServer.server.close(done);
    }, 100);
  });

  test('returns server and routing', () => {
    // given
    const effect$ = EffectFactory
      .matchPath('/')
      .matchType('GET')
      .use(req$ => req$.pipe(mapTo({ status: 200 })));
    const app = httpListener({ effects: [effect$] });

    // when
    marbleServer = createServer({ httpListener: app });

    // then
    expect(marbleServer.server).toBeDefined();
    expect(marbleServer.info).toBeDefined();
    expect(marbleServer.info.routing).toBeInstanceOf(Array);
    expect(marbleServer.info.routing[0].path).toEqual('');
    expect(marbleServer.info.routing[0].methods.GET!.effect).toBeDefined();
  });

  test('registers dependencies if defined', () => {
    // given
    const app = httpListener({ effects: [] });
    const { injector } = app.config;

    // when
    jest.spyOn(injector, 'registerAll').mockImplementation(jest.fn(() => jest.fn()));
    marbleServer = createServer({ httpListener: app, dependencies: [] });

    // then
    expect(injector.registerAll).toHaveBeenCalledWith([]);
  });

  test('doesn\'t register dependencies if not defined', () => {
    // given
    const app = httpListener({ effects: [] });
    const { injector } = app.config;

    // when
    jest.spyOn(injector, 'registerAll').mockImplementation(jest.fn(() => jest.fn()));
    marbleServer = createServer({ httpListener: app });

    // then
    expect(injector.registerAll).not.toHaveBeenCalled();
  });

  test(`emits server events`, (done) => {
    // given
    const app = httpListener({ effects: [] });

    // then
    marbleServer = createServer({
      httpListener: app,
      event$: event$ => forkJoin(
        event$.pipe(filter(isErrorEvent), take(1)),
        event$.pipe(filter(isClientErrorEvent), take(1)),
        event$.pipe(filter(isConnectEvent), take(1)),
        event$.pipe(filter(isConnectionEvent), take(1)),
        event$.pipe(filter(isListenEvent), take(1)),
        event$.pipe(filter(isUpgradeEvent), take(1)),
        event$.pipe(filter(isRequestEvent), take(1)),
        event$.pipe(filter(isCheckContinueEvent), take(1)),
        event$.pipe(filter(isCheckExpectationEvent), take(1)),
      ).pipe(
        tap(() => done()),
      ),
    });

    marbleServer.server.emit(ServerEventType.ERROR);
    marbleServer.server.emit(ServerEventType.CLIENT_ERROR);
    marbleServer.server.emit(ServerEventType.CONNECT);
    marbleServer.server.emit(ServerEventType.CONNECTION, new EventEmitter());
    marbleServer.server.emit(ServerEventType.LISTEN);
    marbleServer.server.emit(ServerEventType.UPGRADE);
    marbleServer.server.emit(ServerEventType.REQUEST);
    marbleServer.server.emit(ServerEventType.CHECK_CONTINUE);
    marbleServer.server.emit(ServerEventType.CHECK_EXPECTATION);
  });
});
