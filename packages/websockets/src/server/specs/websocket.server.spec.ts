import { Event } from '@marblejs/core';
import { wait } from '@marblejs/core/dist/+internal/utils';
import { throwError, fromEvent, firstValueFrom, concat, Observable, lastValueFrom, ReplaySubject } from 'rxjs';
import { tap, map, mergeMap, first, toArray, take } from 'rxjs/operators';
import { pipe } from 'fp-ts/lib/function';
import { webSocketListener } from '../websocket.server.listener';
import { WsEffect, WsMiddlewareEffect } from '../../effects/websocket.effects.interface';
import { EventTransformer } from '../../transformer/websocket.transformer.interface';
import { bootstrapWebSocketClient, bootstrapHttpServer, bootstrapWebSocketServer } from '../../+internal';

describe('WebSocket server', () => {
  describe('JSON transformer', () => {
    test('echoes back', async () => {
      // given
      const eventSubject = new ReplaySubject<Event>(1);
      const echo$: WsEffect = event$ => event$;
      const event = { type: 'EVENT', payload: 'test' };
      const listener = webSocketListener({ effects: [echo$] });

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
      const webSocketClient = await bootstrapWebSocketClient(httpServer);

      webSocketClient.once('message', message => eventSubject.next(JSON.parse(message)));
      webSocketClient.send(JSON.stringify(event));

      // then
      const result = await firstValueFrom(eventSubject);
      expect(result).toEqual(event);

      webSocketServer.close();
      webSocketClient.close();
      httpServer.close();
    });

    test('echoes back to all clients', async () => {
      // given
      const eventSubject = new ReplaySubject<Event>(2);
      const echo$: WsEffect = (event$, ctx) => event$.pipe(
        mergeMap(event => ctx.client.sendBroadcastResponse({ type: event.type, payload: event.payload }).pipe(map(() => event))));
      const event = { type: 'EVENT', payload: 'test' };
      const listener = webSocketListener({ effects: [echo$] });

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
      const webSocketclient1 = await bootstrapWebSocketClient(httpServer);
      const webSocketclient2 = await bootstrapWebSocketClient(httpServer);

      concat(
        fromEvent(webSocketclient1, 'message').pipe(first()) as Observable<any>,
        fromEvent(webSocketclient2, 'message').pipe(first()) as Observable<any>,
      ).subscribe(message =>
        eventSubject.next(JSON.parse(message.data))
      );

      webSocketclient1.send(JSON.stringify(event));

      // then
      const result = await lastValueFrom(pipe(eventSubject, take(2), toArray()));

      expect(result[0]).toEqual(event);
      expect(result[1]).toEqual(event);

      webSocketclient1.close();
      webSocketclient2.close();
      webSocketServer.close();
      httpServer.close();
    });

    test('echoes back on upgraded http server', async () => {
      // given
      const eventSubject = new ReplaySubject<Event>(1);
      const echo$: WsEffect = event$ => event$;
      const event = { type: 'EVENT', payload: 'test' };
      const listener = webSocketListener({ effects: [echo$] });

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer(undefined, listener);

      httpServer.on('upgrade', (request, socket, head) => {
        webSocketServer.handleUpgrade(request, socket, head, ws => {
          webSocketServer.emit('connection', ws, request);
        });
      });

      const webSocketClient = await bootstrapWebSocketClient(httpServer);

      webSocketClient.once('message', message => eventSubject.next(JSON.parse(message)));
      webSocketClient.send(JSON.stringify(event));

      const result = await firstValueFrom(eventSubject);

      // then
      expect(result).toEqual(event);

      webSocketServer.close();
      webSocketClient.close();
      httpServer.close();
    });

    test('passes through middlewares', async () => {
      // given
      const eventSubject = new ReplaySubject<Event>(1);
      const incomingEvent = { type: 'EVENT', payload: 0 };
      const outgoingEvent = { type: 'EVENT', payload: 3 };
      const e$: WsEffect = event$ => event$;
      const m$: WsMiddlewareEffect = event$ =>
        event$.pipe(tap(event  => event.payload !== undefined && (event.payload as number)++));

      const listener = webSocketListener({
        effects: [e$],
        middlewares: [m$, m$, m$],
      });

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
      const webSocketClient = await bootstrapWebSocketClient(httpServer);

      webSocketClient.once('message', message => eventSubject.next(JSON.parse(message)));
      webSocketClient.send(JSON.stringify(incomingEvent));

      const result = await firstValueFrom(eventSubject);

      // then
      expect(result).toEqual(outgoingEvent);

      webSocketClient.close();
      webSocketServer.close();
      httpServer.close();
    });

    test('passes error (thrown by invalid JSON object) through stream multiple times', async () => {
      // given
      const eventSubject = new ReplaySubject<Event>(2);
      const incomingEvent = '{ some: wrong JSON object }';
      const outgoingEvent = {
        type: 'UNHANDLED_ERROR',
        error: { name: 'SyntaxError', message: 'Unexpected token s in JSON at position 2' },
      };

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener());
      const webSocketClient = await bootstrapWebSocketClient(httpServer);

      webSocketClient.on('message', (message: string) => eventSubject.next(JSON.parse(message)));
      webSocketClient.send(incomingEvent);
      webSocketClient.send(incomingEvent);

      const result = await lastValueFrom(pipe(eventSubject, take(2), toArray()));

      // then
      expect(result[0]).toEqual(outgoingEvent);
      expect(result[1]).toEqual(outgoingEvent);

      webSocketClient.close();
      webSocketServer.close();
      httpServer.close();
    });

    test('passes error (thrown by effect) through stream multiple times', async () => {
      // given
      const eventSubject = new ReplaySubject<Event>(2);
      const incomingEvent = { type: 'EVENT' };
      const outgoingEvent = { type: 'UNHANDLED_ERROR', error: { name: 'Error', message: 'test_message' } };

      const effect$: WsEffect = event$ =>
        event$.pipe(mergeMap(() => throwError(() => new Error('test_message'))));

      const listener = webSocketListener({ effects: [effect$] });

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
      const webSocketClient = await bootstrapWebSocketClient(httpServer);

      webSocketClient.on('message', (message: string) => eventSubject.next(JSON.parse(message)));
      webSocketClient.send(JSON.stringify(incomingEvent));
      webSocketClient.send(JSON.stringify(incomingEvent));

      const result = await lastValueFrom(pipe(eventSubject, take(2), toArray()));

      // then
      expect(result[0]).toEqual(outgoingEvent);
      expect(result[1]).toEqual(outgoingEvent);

      webSocketClient.close();
      webSocketServer.close();
      httpServer.close();
    });

    test('server doesn\'t try to push an event to the client that is already closing', async () => {
      try {
        // given - effects
        const effect$: WsEffect = (event$, ctx) => event$.pipe(tap(_ => ctx.client.close()));

        // given - server + clients
        const listener = webSocketListener({ effects: [effect$] });
        const httpServer = await bootstrapHttpServer();
        const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
        const webSocketClient = await bootstrapWebSocketClient(httpServer);

        // when
        webSocketClient.send(JSON.stringify({ type: 'SOME_EVENT' }));
        await wait(1);

        // then
        webSocketServer.close();
        httpServer.close();
      } catch (error) {
        fail(`Server should not throw a fatal exception: "${error}"`);
      }
    });
  });

  describe('binary transformer', () => {
    test('operates over binary events', async () => {
      // given
      const eventSubject = new ReplaySubject<string>(1);
      const message = 'hello world';

      const eventTransformer: EventTransformer<Buffer> = {
        decode: event => ({ type: 'BUFFER_EVENT', payload: event }),
        encode: event => event.payload as Buffer,
      };

      const effect$: WsEffect<Event<Buffer>, Event<Buffer>> = event$ =>
        event$.pipe(map(event => ({ ...event, payload: Buffer.from(message) })));

      const listener = webSocketListener({ effects: [effect$], eventTransformer });

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
      const webSocketClient = await bootstrapWebSocketClient(httpServer);

      webSocketClient.on('message', (message: Buffer) => eventSubject.next(message.toString('utf8')));
      webSocketClient.send(Buffer.from(message));
      const result = await firstValueFrom(eventSubject);

      // then
      expect(result).toEqual(message);

      webSocketClient.close();
      webSocketServer.close();
      httpServer.close();
    });
  });
});
