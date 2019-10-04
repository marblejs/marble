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
import { EventEmitter } from 'events';
import { r } from '../../router/router.ixbuilder';

describe('#createServer', () => {
  let server: https.Server | http.Server;

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
    const app = httpListener({ effects: [] });

    // when
    server = await createServer({
      hostname,
      httpListener: app,
    })();

    // then
    expect(server.listening).toBe(true);
  });

  test('creates http server and starts listening without specified port and hostname', async () => {
    // given
    const app = httpListener({ effects: [] });

    // when
    server = await createServer({ httpListener: app })();

    // then
    expect(server.listening).toBe(true);
  });

  test('creates https server', async () => {
    // given
    const app = httpListener({ effects: [] });
    const httpsOptions: https.ServerOptions = {
      key: fs.readFileSync(path.resolve(__dirname, '../../../../../assets/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../../../../assets/cert.pem')),
    };

    // when
    server = await createServer({
      httpListener: app,
      options: { httpsOptions },
    })();

    // then
    expect(server.listening).toBe(true);
  });

  test('returns server and routing', async () => {
    // given
    const effect$ = r.pipe(
      r.matchPath('/'),
      r.matchType('GET'),
      r.useEffect(req$ => req$.pipe(mapTo({ status: 200 }))));
    const app = httpListener({ effects: [effect$] });

    // when
    const marbleServer = createServer({ httpListener: app });
    server = await marbleServer();

    // then
    expect(marbleServer.config).toBeDefined();
    expect(marbleServer.config.server).toBeDefined();
    expect(marbleServer.config.routing).toBeInstanceOf(Array);
    expect(marbleServer.config.routing[0].path).toEqual('');
    expect(
      marbleServer.config.routing[0].methods.GET &&
      marbleServer.config.routing[0].methods.GET.effect
    ).toBeDefined();
  });

  test(`emits server events`, async done => {
    // given
    const app = httpListener({ effects: [] });

    // then
    server = await createServer({
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
    })();

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
