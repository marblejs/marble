import { mapTo, tap, filter } from 'rxjs/operators';
import { httpListener } from '../../http.listener';
import { marble } from '../server.factory';
import { ServerEventType } from '../server.event';
import { EffectFactory } from '../../effects/effects.factory';
import { mockHttpServer } from '../../+internal/testing';

describe('#marble', () => {
  let marbleServer: ReturnType<typeof marble>;

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
    marbleServer = marble({
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
    marbleServer = marble({ httpListener: app });

    // then
    expect(mocks.listen.mock.calls[0][0]).toBe(undefined);
    expect(mocks.listen.mock.calls[0][1]).toBe(undefined);
  });

  test('returns server and routing', () => {
    // given
    const effect$ = EffectFactory
      .matchPath('/')
      .matchType('GET')
      .use(req$ => req$.pipe(mapTo({ status: 200 })));
    const app = httpListener({ effects: [effect$] });

    // when
    marbleServer = marble({ httpListener: app });

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
    marbleServer = marble({ httpListener: app, dependencies: [] });

    // then
    expect(injector.registerAll).toHaveBeenCalledWith([]);
  });

  test('doesn\'t register dependencies if not defined', () => {
    // given
    const app = httpListener({ effects: [] });
    const { injector } = app.config;

    // when
    jest.spyOn(injector, 'registerAll').mockImplementation(jest.fn(() => jest.fn()));
    marbleServer = marble({ httpListener: app });

    // then
    expect(injector.registerAll).not.toHaveBeenCalled();
  });

  test(`emits ${ServerEventType.LISTEN} EventType on start`, (done) => {
    // given
    const app = httpListener({ effects: [] });
    const expectedEvent = ServerEventType.LISTEN;

    // then
    marbleServer = marble({
      httpListener: app,
      httpEventsHandler: event$ => event$.pipe(
        filter(event => event.type === expectedEvent),
        tap(() => done()),
      ),
    });
  });

  test(`emits ${ServerEventType.UPGRADE} EventType`, (done) => {
    // given
    const app = httpListener({ effects: [] });
    const expectedEvent = ServerEventType.UPGRADE;

    // then
    marbleServer = marble({
      httpListener: app,
      httpEventsHandler: event$ => event$.pipe(
        filter(event => event.type === expectedEvent),
        tap(() => done()),
      ),
    });

    marbleServer.server.emit(expectedEvent);
  });
});
