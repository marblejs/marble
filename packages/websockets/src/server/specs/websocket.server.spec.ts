import { EventError, HttpStatus } from '@marblejs/core';
import { throwError, fromEvent, forkJoin, merge } from 'rxjs';
import { tap, map, mergeMap, first, toArray, take, mergeMapTo, mapTo } from 'rxjs/operators';
import { webSocketListener } from '../websocket.server.listener';
import { WsEffect, WsMiddlewareEffect, WsConnectionEffect } from '../../effects/websocket.effects.interface';
import { WebSocketConnectionError } from '../../error/websocket.error.model';
import { EventTransformer } from '../../transformer/websocket.transformer.interface';
import { createWebSocketsTestBed } from '../../+internal';
import { createWebSocketServer } from '../websocket.server';

describe('WebSocket server', () => {
  describe('JSON transformer', () => {
    const testBed = createWebSocketsTestBed(2);

    beforeEach(testBed.bootstrap);
    afterEach(testBed.teardown);

    test('echoes back', async done => {
      // given
      const targetClient = testBed.getClient(0);
      const server = testBed.getServer();
      const echo$: WsEffect = event$ => event$;
      const event = JSON.stringify({ type: 'EVENT', payload: 'test' });
      const listener = webSocketListener({ effects: [echo$] });

      // when
      const app = await createWebSocketServer({ options: { server }, webSocketListener: listener });
      await app();

      targetClient.once('open', () => targetClient.send(event));

      // then
      targetClient.once('message', message => {
        expect(message).toEqual(event);
        done();
      });
    });

    test('echoes back to all clients', async done => {
      // given
      const echo$: WsEffect = (event$, { client }) => event$.pipe(
        mergeMap(event => client.sendBroadcastResponse(event).pipe(mapTo(event))),
      );
      const event = JSON.stringify({ type: 'EVENT', payload: 'test' });
      const listener = webSocketListener({ effects: [echo$] });
      const server = testBed.getServer();
      const targetClient = testBed.getClient(0);

      // when
      const app = await createWebSocketServer({ options: { server }, webSocketListener: listener });
      await app();

      targetClient.on('open', () => targetClient.send(event));

      // then
      const client1$ = fromEvent(testBed.getClient(0), 'message').pipe(first());
      const client2$ = fromEvent(testBed.getClient(1), 'message').pipe(first());

      forkJoin(client1$, client2$).subscribe(([ message1, message2 ]: [any, any]) => {
        expect(message1.data).toEqual(event);
        expect(message2.data).toEqual(event);
        done();
      });
    });

    test('echoes back on upgraded http server', async done => {
      // given
      const echo$: WsEffect = event$ => event$;
      const event = JSON.stringify({ type: 'EVENT', payload: 'test' });
      const server = testBed.getServer();
      const listener = webSocketListener({ effects: [echo$] });
      const targetClient = testBed.getClient(0);

      // when
      const app = await createWebSocketServer({ webSocketListener: listener });
      const webSocketServer = await app();

      server.on('upgrade', (request, socket, head) => {
        webSocketServer.handleUpgrade(request, socket, head, ws => {
          webSocketServer.emit('connection', ws, request);
        });
      });

      targetClient.once('open', () => targetClient.send(event));

      // then
      targetClient.once('message', message => {
        expect(message).toEqual(event);
        done();
      });
    });

    test('passes through middlewares', async done => {
      // given
      const incomingEvent = JSON.stringify({ type: 'EVENT', payload: 0 });
      const outgoingEvent = JSON.stringify({ type: 'EVENT', payload: 3 });
      const e$: WsEffect = event$ => event$;
      const m$: WsMiddlewareEffect = event$ => event$.pipe(
        tap(event  => event.payload !== undefined && (event.payload as number)++)
      );
      const targetClient = testBed.getClient(0);
      const server = testBed.getServer();
      const listener = webSocketListener({
        effects: [e$],
        middlewares: [m$, m$, m$],
      });

      // when
      const app = await createWebSocketServer({ options: { server }, webSocketListener: listener })
      await app();

      targetClient.once('open', () => targetClient.send(incomingEvent));

      // then
      targetClient.once('message', message => {
        expect(message).toEqual(outgoingEvent);
        done();
      });
    });

    test('passes error (thrown by invalid JSON object) through stream multiple times', async done => {
      // given
      const incomingEvent = '{ some: wrong JSON object }';
      const outgoingEvent = JSON.stringify({
        type: 'ERROR',
        error: { message: 'Unexpected token s in JSON at position 2' },
      });
      const targetClient = testBed.getClient(0);
      const server = testBed.getServer();
      const listener = webSocketListener();

      // when
      const app = await createWebSocketServer({ options: { server }, webSocketListener: listener });
      await app();

      targetClient.once('open', () => {
        targetClient.send(incomingEvent);
        targetClient.send(incomingEvent);
      });

      // then
      fromEvent(targetClient, 'message')
        .pipe(take(2), toArray())
        .subscribe((messages: any[]) => {
          expect(messages[0].data).toEqual(outgoingEvent);
          expect(messages[1].data).toEqual(outgoingEvent);
          done();
        });
    });

    test('passes error (thrown by effect) through stream multiple times', async done => {
      // given
      const incomingEvent = JSON.stringify({ type: 'EVENT' });
      const outgoingEvent = JSON.stringify({ type: 'EVENT', error: { message: 'test message' } });
      const effect$: WsEffect = event$ => event$.pipe(
        mergeMap(event => throwError(new EventError(event, 'test message'))),
      );
      const targetClient = testBed.getClient(0);
      const server = testBed.getServer();
      const listener = webSocketListener({ effects: [effect$] });

      // when
      const app = await createWebSocketServer({ options: { server }, webSocketListener: listener });
      await app();

      targetClient.once('open', () => {
        targetClient.send(incomingEvent);
        targetClient.send(incomingEvent);
      });

      // then
      fromEvent(targetClient, 'message')
        .pipe(take(2), toArray())
        .subscribe((messages: any[]) => {
          expect(messages[0].data).toEqual(outgoingEvent);
          expect(messages[1].data).toEqual(outgoingEvent);
          done();
        });
    });

    test('passes connection', async done => {
      // given
      const connection$: WsConnectionEffect = req$ => req$;
      const listener = webSocketListener();
      const targetClient1 = testBed.getClient(0);
      const targetClient2 = testBed.getClient(1);
      const server = testBed.getServer();

      // when
      const app = await createWebSocketServer({ options: { server }, connection$, webSocketListener: listener });
      await app();

      // then
      merge(
        fromEvent(targetClient1, 'open'),
        fromEvent(targetClient2, 'open'),
      )
      .pipe(take(2), toArray())
      .subscribe(() => done());
    });

    test('triggers connection error', async done => {
      // given
      const error = new WebSocketConnectionError('Unauthorized', HttpStatus.UNAUTHORIZED);
      const connection$: WsConnectionEffect = req$ => req$.pipe(mergeMapTo(throwError(error)));
      const listener = webSocketListener();
      const targetClient1 = testBed.getClient(0);
      const targetClient2 = testBed.getClient(1);
      const server = testBed.getServer();

      // when
      const app = await createWebSocketServer({ options: { server }, connection$, webSocketListener: listener });
      await app();

      // then
      merge(
        fromEvent(targetClient1, 'unexpected-response'),
        fromEvent(targetClient2, 'unexpected-response'),
      )
      .pipe(take(2), toArray())
      .subscribe(
        (data: any) => {
          expect(data[0][1].statusCode).toEqual(error.status);
          expect(data[1][1].statusCode).toEqual(error.status);
          expect(data[0][1].statusMessage).toEqual(error.message);
          expect(data[1][1].statusMessage).toEqual(error.message);
          done();
        },
      );
    });
  });

  describe('binary transformer', () => {
    const testBed = createWebSocketsTestBed();

    beforeEach(testBed.bootstrap);
    afterEach(testBed.teardown);

    test('operates over binary events', async done => {
      // given
      const targetClient = testBed.getClient();
      const decodedMessage = 'hello world';
      const eventTransformer: EventTransformer<any, Buffer> = {
        decode: event => event,
        encode: event => event,
      };
      const effect$: WsEffect<Buffer, string> = event$ => event$.pipe(
        map(event => event.toString('utf8'))
      );
      const server = testBed.getServer();
      const listener = webSocketListener({ effects: [effect$], eventTransformer });

      // when
      const app = await createWebSocketServer({ options: { server }, webSocketListener: listener });
      await app();

      targetClient.once('open', () => {
        targetClient.send(Buffer.from(decodedMessage));
      });

      // then
      targetClient.once('message', incomingMessage => {
        expect(incomingMessage).toEqual(decodedMessage);
        done();
      });
    });
  });
});
