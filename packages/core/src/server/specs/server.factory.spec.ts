import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import { forkJoin } from 'rxjs';
import { mapTo, tap, filter, take } from 'rxjs/operators';
import { httpListener } from '../../listener/http.listener';
import { createServer } from '../server.factory';
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
  isRequestEvent,
} from '../server.event';
import { EffectFactory } from '../../effects/effects.factory';
import { EventEmitter } from 'events';

describe('#createServer', () => {
  let server: https.Server | http.Server;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(done => {
    if (server) {
      server.close(() => done());
    } else {
      done();
    }
  });

  test('creates http server and starts listening', done => {
    // given
    const hostname = '127.0.0.1';
    const app = httpListener({ effects: [] });

    // when
    server = createServer({
      hostname,
      httpListener: app,
    }).run();

    server.on('error', console.error);

    server.on('listening', () => {
      expect(server.listening).toBe(true);
      done();
    });
  });

  test('creates http server and starts listening without specified port and hostname', done => {
    // given
    const app = httpListener({ effects: [] });

    // when
    server = createServer({ httpListener: app }).run();

    // then
    server.on('listening', () => {
      expect(server.listening).toBe(true);
      done();
    });
  });

  test(`creates https server but doesn't start listening`, () => {
    // given
    const app = httpListener({ effects: [] });

    // when
    server = createServer({ httpListener: app }).run(false);

    // then
    expect(server.listening).toBe(false);
  });

  test('creates https server', done => {
    // given
    const app = httpListener({ effects: [] });
    const httpsOptions: https.ServerOptions = {
      key: fs.readFileSync(path.resolve(__dirname, '../../../../../assets/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../../../../assets/cert.pem')),
    };

    // when
    server = createServer({
      httpListener: app,
      options: { httpsOptions },
    }).run();

    // then
    setTimeout(() => {
      expect(server.listening).toBe(true);
      server.close(done);
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
    const marbleServer = createServer({ httpListener: app });
    server = marbleServer.run();

    // then
    expect(marbleServer.server).toBeDefined();
    expect(marbleServer.info).toBeDefined();
    expect(marbleServer.info.routing).toBeInstanceOf(Array);
    expect(marbleServer.info.routing[0].path).toEqual('');
    expect(
      marbleServer.info.routing[0].methods.GET &&
      marbleServer.info.routing[0].methods.GET.effect
    ).toBeDefined();
  });

  test(`emits server events`, (done) => {
    // given
    const app = httpListener({ effects: [] });

    // then
    server = createServer({
      httpListener: app,
      event$: event$ => forkJoin(
        event$.pipe(filter(isErrorEvent), take(1)),
        event$.pipe(filter(isClientErrorEvent), take(1)),
        event$.pipe(filter(isConnectEvent), take(1)),
        event$.pipe(filter(isConnectionEvent), take(1)),
        event$.pipe(filter(isListeningEvent), take(1)),
        event$.pipe(filter(isUpgradeEvent), take(1)),
        event$.pipe(filter(isRequestEvent), take(1)),
        event$.pipe(filter(isCheckContinueEvent), take(1)),
        event$.pipe(filter(isCheckExpectationEvent), take(1)),
      ).pipe(
        tap(() => done()),
      ),
    }).run();

    server.emit(ServerEventType.ERROR);
    server.emit(ServerEventType.CLIENT_ERROR);
    server.emit(ServerEventType.CONNECT);
    server.emit(ServerEventType.CONNECTION, new EventEmitter());
    server.emit(ServerEventType.LISTENING);
    server.emit(ServerEventType.UPGRADE);
    server.emit(ServerEventType.REQUEST);
    server.emit(ServerEventType.CHECK_CONTINUE);
    server.emit(ServerEventType.CHECK_EXPECTATION);
  });
});
