import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { EventEmitter } from 'events';
import { forkJoin } from 'rxjs';
import { tap, filter, take } from 'rxjs/operators';
import { httpListener } from '../http.server.listener';
import { createServer } from '../http.server';
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
} from '../http.server.event';
import { lookup } from '../../../context/context.factory';
import { useContext } from '../../../context/context.hook';
import { HttpServer } from '../../http.interface';
import { HttpServerClientToken } from '../http.server.tokens';

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
      key: fs.readFileSync(path.resolve(__dirname, '../../../../../../assets/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../../../../../assets/cert.pem')),
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

  test(`emits server events`, async done => {
    const app = await createServer({
      listener: httpListener(),
      event$: event$ => forkJoin(
        event$.pipe(filter(isErrorEvent), take(1)),
        event$.pipe(filter(isClientErrorEvent), take(1)),
        event$.pipe(filter(isCloseEvent), take(1)),
        event$.pipe(filter(isConnectEvent), take(1)),
        event$.pipe(filter(isConnectionEvent), take(1)),
        event$.pipe(filter(isListeningEvent), take(1)),
        event$.pipe(filter(isUpgradeEvent), take(1)),
        event$.pipe(filter(isCheckContinueEvent), take(1)),
        event$.pipe(filter(isCheckExpectationEvent), take(1)),
      ).pipe(
        tap(() => done()),
      ),
    });

    server = await app();

    server.emit(ServerEventType.ERROR, new Error('test_error'));
    server.emit(ServerEventType.CLIENT_ERROR);
    server.emit(ServerEventType.CONNECT);
    server.emit(ServerEventType.CONNECTION, new EventEmitter());
    server.emit(ServerEventType.LISTENING);
    server.emit(ServerEventType.UPGRADE);
    server.emit(ServerEventType.CHECK_CONTINUE);
    server.emit(ServerEventType.CHECK_EXPECTATION);
    server.emit(ServerEventType.CLOSE);
  });
});
