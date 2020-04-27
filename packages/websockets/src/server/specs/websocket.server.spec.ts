import { Event } from '@marblejs/core';
import { throwError, fromEvent, forkJoin } from 'rxjs';
import { tap, map, mergeMap, first, toArray, take, mapTo } from 'rxjs/operators';
import { webSocketListener } from '../websocket.server.listener';
import { WsEffect, WsMiddlewareEffect } from '../../effects/websocket.effects.interface';
import { EventTransformer } from '../../transformer/websocket.transformer.interface';
import { bootstrapWebSocketClient, bootstrapHttpServer, bootstrapWebSocketServer } from '../../+internal';

describe('WebSocket server', () => {
  describe('JSON transformer', () => {
    test('echoes back', async done => {
      // given
      const echo$: WsEffect = event$ => event$;
      const event = { type: 'EVENT', payload: 'test' };
      const listener = webSocketListener({ effects: [echo$] });

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
      const webSocketClient = await bootstrapWebSocketClient(httpServer);

      webSocketClient.send(JSON.stringify(event));

      // then
      webSocketClient.once('message', message => {
        expect(JSON.parse(message)).toEqual(event);
        webSocketServer.close();
        webSocketClient.close();
        httpServer.close();
        done();
      });
    });

    test('echoes back to all clients', async done => {
      // given
      const echo$: WsEffect = (event$, ctx) => event$.pipe(
        mergeMap(event => ctx.client.sendBroadcastResponse({ type: event.type, payload: event.payload }).pipe(mapTo(event))),
      );
      const event = { type: 'EVENT', payload: 'test' };
      const listener = webSocketListener({ effects: [echo$] });

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
      const webSocketclient1 = await bootstrapWebSocketClient(httpServer);
      const webSocketclient2 = await bootstrapWebSocketClient(httpServer);

      webSocketclient1.send(JSON.stringify(event));

      // then
      const client1$ = fromEvent(webSocketclient1, 'message').pipe(first());
      const client2$ = fromEvent(webSocketclient2, 'message').pipe(first());

      forkJoin(client1$, client2$).subscribe(([ message1, message2 ]: [any, any]) => {
        expect(JSON.parse(message1.data)).toEqual(event);
        expect(JSON.parse(message2.data)).toEqual(event);
        webSocketclient1.close();
        webSocketclient2.close();
        webSocketServer.close();
        httpServer.close();
        done();
      });
    });

    test('echoes back on upgraded http server', async done => {
      // given
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

      webSocketClient.send(JSON.stringify(event));

      // then
      webSocketClient.once('message', message => {
        expect(JSON.parse(message)).toEqual(event);
        webSocketServer.close();
        webSocketClient.close();
        httpServer.close();
        done();
      });
    });

    test('passes through middlewares', async done => {
      // given
      const incomingEvent = { type: 'EVENT', payload: 0 };
      const outgoingEvent = { type: 'EVENT', payload: 3 };
      const e$: WsEffect = event$ => event$;
      const m$: WsMiddlewareEffect = event$ => event$.pipe(
        tap(event  => event.payload !== undefined && (event.payload as number)++)
      );
      const listener = webSocketListener({
        effects: [e$],
        middlewares: [m$, m$, m$],
      });

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, listener);
      const webSocketClient = await bootstrapWebSocketClient(httpServer);

      webSocketClient.send(JSON.stringify(incomingEvent));

      // then
      webSocketClient.once('message', message => {
        expect(JSON.parse(message)).toEqual(outgoingEvent);
        webSocketClient.close();
        webSocketServer.close();
        httpServer.close();
        done();
      });
    });

    test('passes error (thrown by invalid JSON object) through stream multiple times', async done => {
      // given
      const incomingEvent = '{ some: wrong JSON object }';
      const outgoingEvent = {
        type: 'UNHANDLED_ERROR',
        error: { name: 'SyntaxError', message: 'Unexpected token s in JSON at position 2' },
      };

      // when
      const httpServer = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpServer }, webSocketListener());
      const webSocketClient = await bootstrapWebSocketClient(httpServer);

      webSocketClient.send(incomingEvent);
      webSocketClient.send(incomingEvent);

      // then
      fromEvent(webSocketClient, 'message')
        .pipe(take(2), toArray())
        .subscribe((messages: any[]) => {
          expect(JSON.parse(messages[0].data)).toEqual(outgoingEvent);
          expect(JSON.parse(messages[1].data)).toEqual(outgoingEvent);
          webSocketClient.close();
          webSocketServer.close();
          httpServer.close();
          done();
        });
    });

    test('passes error (thrown by effect) through stream multiple times', async done => {
      // given
      const incomingEvent = { type: 'EVENT' };
      const outgoingEvent = { type: 'UNHANDLED_ERROR', error: { name: 'Error', message: 'test_message' } };

      const effect$: WsEffect = event$ =>
        event$.pipe(mergeMap(() => throwError(new Error('test_message'))));

      const listener = webSocketListener({ effects: [effect$] });

      // when
      const httpSever = await bootstrapHttpServer();
      const webSocketServer = await bootstrapWebSocketServer({ server: httpSever }, listener);
      const webSocketClient = await bootstrapWebSocketClient(httpSever);

      webSocketClient.send(JSON.stringify(incomingEvent));
      webSocketClient.send(JSON.stringify(incomingEvent));

      // then
      fromEvent(webSocketClient, 'message')
        .pipe(take(2), toArray())
        .subscribe((messages: any[]) => {
          expect(JSON.parse(messages[0].data)).toEqual(outgoingEvent);
          expect(JSON.parse(messages[1].data)).toEqual(outgoingEvent);
          webSocketClient.close();
          webSocketServer.close();
          httpSever.close();
          done();
        });
    });
  });

  describe('binary transformer', () => {
    test('operates over binary events', async done => {
      // given
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

      webSocketClient.send(Buffer.from(message));

      // then
      webSocketClient.once('message', (incomingMessage: Buffer) => {
        expect(incomingMessage.toString('utf8')).toEqual(message);
        webSocketClient.close();
        webSocketServer.close();
        httpServer.close();
        done();
      });
    });
  });
});
