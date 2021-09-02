import { firstValueFrom, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Event, EventWithPayload, matchEvent } from '@marblejs/core';
import { ServerEvent, ServerEventType } from '../websocket.server.event';
import { webSocketListener } from '../websocket.server.listener';
import { bootstrapHttpServer, bootstrapWebSocketClient, bootstrapWebSocketServer } from '../../+internal';
import { WsServerEffect } from '../../effects/websocket.effects.interface';

describe('WebSocket events', () => {

  test(`emits "${ServerEventType.LISTENING}" when no server passed`, async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(1);

    const listening$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.listening),
        tap(event => eventSubject.next(event)));

    // when
    const webSocketServer = await bootstrapWebSocketServer({ port: 8060 }, webSocketListener(), listening$);
    const result = await firstValueFrom(eventSubject) as EventWithPayload<any>;

    // then
    expect(result.type).toEqual(ServerEventType.LISTENING);
    expect(result.payload.host).toEqual(expect.any(String));
    expect(result.payload.port).toEqual(expect.any(Number));

    webSocketServer.close();
  });

  test(`emits "${ServerEventType.LISTENING}" when server passed`, async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(1);

    const listening$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.listening),
        tap(event => eventSubject.next(event)));

    // when
    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener(), listening$);
    const result = await firstValueFrom(eventSubject) as EventWithPayload<any>;

    // then
    expect(result.type).toEqual(ServerEventType.LISTENING);
    expect(result.payload.host).toEqual(expect.any(String));
    expect(result.payload.port).toEqual(expect.any(Number));

    webSocketServer.close();
    httpServer.close();
  });

  test(`emits "${ServerEventType.ERROR}"`, async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(1);
    const error = new Error('test');

    const error$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.error),
        tap(event => eventSubject.next(event)));

    // when
    const webSocketServer = await bootstrapWebSocketServer({ port: 8060 }, webSocketListener(), error$);

    webSocketServer.emit('error', error);

    const result = await firstValueFrom(eventSubject) as EventWithPayload<any>;

    // then
    expect(result.type).toEqual(ServerEventType.ERROR);
    expect(result.payload.error).toBeDefined();

    webSocketServer.close();
  });

  test(`emits "${ServerEventType.HEADERS}"`, async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(1);

    const headers$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.headers),
        tap(event => eventSubject.next(event)));

    // when
    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener(), headers$);
    const webSocketClient = await bootstrapWebSocketClient(httpServer);

    const result = await firstValueFrom(eventSubject) as EventWithPayload<any>;

    // then
    expect(result.type).toEqual(ServerEventType.HEADERS);
    expect(result.payload.headers).toBeDefined();
    expect(result.payload.req).toBeDefined();

    webSocketServer.close();
    webSocketClient.close();
    httpServer.close();
  });

  test(`emits "${ServerEventType.CONNECTION}"`, async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(1);

    const connection$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.connection),
        tap(event => eventSubject.next(event)));

    // when
    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener(), connection$);
    const webSocketClient = await bootstrapWebSocketClient(httpServer);

    const result = await firstValueFrom(eventSubject) as EventWithPayload<any>;

    // then
    expect(result.type).toEqual(ServerEventType.CONNECTION);
    expect(result.payload.client).toBeDefined();
    expect(result.payload.req).toBeDefined();

    webSocketServer.close();
    webSocketClient.close();
    httpServer.close();
  });

  test(`emits "${ServerEventType.CLOSE_CLIENT}"`, async () => {
    // given
    const eventSubject = new ReplaySubject<Event>(1);

    const closeClient$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.closeClient),
        tap(event => eventSubject.next(event)));

    // when
    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener(), closeClient$);
    const webSocketClient = await bootstrapWebSocketClient(httpServer);

    webSocketClient.close();

    const result = await firstValueFrom(eventSubject) as EventWithPayload<any>;

    // then
    expect(result.type).toEqual(ServerEventType.CLOSE_CLIENT);
    expect(result.payload.client).toBeDefined();

    webSocketServer.close();
    httpServer.close();
  });
});
