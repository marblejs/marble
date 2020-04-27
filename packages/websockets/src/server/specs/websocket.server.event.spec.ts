import { tap } from 'rxjs/operators';
import { matchEvent } from '@marblejs/core';
import { ServerEvent, ServerEventType } from '../websocket.server.event';
import { webSocketListener } from '../websocket.server.listener';
import { bootstrapHttpServer, bootstrapWebSocketClient, bootstrapWebSocketServer } from '../../+internal';
import { WsServerEffect } from '../../effects/websocket.effects.interface';

describe('WebSocket events', () => {

  test(`emits "${ServerEventType.LISTENING}" when no server passed`, async done => {
    const listening$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.listening),
        tap(event => {
          expect(event.type).toEqual(ServerEventType.LISTENING);
          expect(event.payload.host).toEqual(expect.any(String));
          expect(event.payload.port).toEqual(expect.any(Number));
          done();
        }),
      );

    const webSocketServer = await bootstrapWebSocketServer({ port: 8060 }, webSocketListener(), listening$);
    webSocketServer.close();
  });

  test(`emits "${ServerEventType.LISTENING}" when server passed`, async done => {
    const listening$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.listening),
        tap(event => {
          expect(event.type).toEqual(ServerEventType.LISTENING);
          expect(event.payload.host).toEqual(expect.any(String));
          expect(event.payload.port).toEqual(expect.any(Number));
          done();
        }),
      );

    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener(), listening$);
    webSocketServer.close();
    httpServer.close();
  });

  test(`emits "${ServerEventType.ERROR}"`, async done => {
    const error = new Error('test');
    const error$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.error),
        tap(event => {
          expect(event.type).toEqual(ServerEventType.ERROR);
          expect(event.payload.error).toBeDefined();
          done();
        }),
      );

    const webSocketServer = await bootstrapWebSocketServer({ port: 8060 }, webSocketListener(), error$);
    webSocketServer.emit('error', error);
    webSocketServer.close();
  });

  test(`emits "${ServerEventType.HEADERS}"`, async () => {
    const headers$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.headers),
        tap(event => {
          expect(event.type).toEqual(ServerEventType.HEADERS);
          expect(event.payload.headers).toBeDefined();
          expect(event.payload.req).toBeDefined();
        }),
      );

    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener(), headers$);
    const webSocketClient = await bootstrapWebSocketClient(httpServer);

    webSocketServer.close();
    webSocketClient.close();
    httpServer.close();
  });

  test(`emits "${ServerEventType.CONNECTION}"`, async () => {
    const connection$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.connection),
        tap(event => {
          expect(event.type).toEqual(ServerEventType.CONNECTION);
          expect(event.payload.client).toBeDefined();
          expect(event.payload.req).toBeDefined();
        }),
      );

    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener(), connection$);
    const webSocketClient = await bootstrapWebSocketClient(httpServer);

    webSocketServer.close();
    webSocketClient.close();
    httpServer.close();
  });

  test(`emits "${ServerEventType.CLOSE_CLIENT}"`, async done => {
    const connection$: WsServerEffect = event$ =>
      event$.pipe(
        matchEvent(ServerEvent.closeClient),
        tap(event => {
          expect(event.type).toEqual(ServerEventType.CLOSE_CLIENT);
          expect(event.payload.client).toBeDefined();

          // teardown
          webSocketServer.close();
          httpServer.close();
          done();
        }),
      );

    const httpServer = await bootstrapHttpServer();
    const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener(), connection$);
    const webSocketClient = await bootstrapWebSocketClient(httpServer);
    webSocketClient.close();
  });
});
