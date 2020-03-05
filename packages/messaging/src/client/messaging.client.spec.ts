import { TimeoutError } from 'rxjs';
import { NamedError } from '@marblejs/core/dist/+internal/utils';
import { Transport, TransportMessage } from '../transport/transport.interface';
import { createAmqpStrategy } from '../transport/strategies/amqp.strategy';
import { createTestContext } from '../util/messaging.test.util';
import { messagingClient } from './messaging.client';
import { MessagingClientConfig } from './messaging.client.interface';

describe('#messagingClient', () => {

  describe('AMQP', () => {
    const clientOptions: MessagingClientConfig = {
      transport: Transport.AMQP,
      options: {
        host: 'amqp://localhost:5672',
        queue: 'test_queue_client',
        queueOptions: { durable: false },
        timeout: 1000,
      },
    };

    const runClient = async () => await messagingClient(clientOptions)(createTestContext());
    const runServer = () => createAmqpStrategy(clientOptions.options).connect({ isConsumer: true });
    const createMessage = (data: any, correlationId?: string): TransportMessage<Buffer> => ({
      data: Buffer.from(JSON.stringify(data)),
      correlationId: correlationId,
    });

    test('emits event', async done => {
      const client = await runClient();
      const server = await runServer();

      server.message$.subscribe(async msg => {
        expect(msg.data.toString()).toEqual(JSON.stringify({ type: 'TEST' }));
        await server.close();
        done();
      });

      await client.emit({ type: 'TEST' });
      await client.close();
    });

    test('sends RPC event', async () => {
      const client = await runClient();
      const server = await runServer();

      server.message$.subscribe(async msg => {
        const inEvent = JSON.parse(msg.data.toString());
        const outEvent = { ...inEvent, payload: inEvent.payload + 1 };
        const response = createMessage(outEvent, msg.correlationId);

        await server.emitMessage(msg.replyTo || '', response);
        await server.close();
      });

      const result = await client.send({ type: 'TEST', payload: 1 }).toPromise();

      expect(result).toEqual({ type: 'TEST', payload: 2 });

      await client.close();
    });

    test('timeouts sent RPC event', async () => {
      const client = await runClient();
      const server = await runServer();

      const result = client.send({ type: 'TEST' }).toPromise();

      await expect(result).rejects.toEqual(new TimeoutError());

      await client.close();
      await server.close();
    });

    test('throws an error for sent RPC event', async () => {
      const client = await runClient();
      const server = await runServer();
      const error = { name: 'TestErrorName', message: 'TestErrorMessage' };

      server.message$.subscribe(async msg => {
        const inEvent = JSON.parse(msg.data.toString());
        const outEvent = { ...inEvent, error };
        const response = createMessage(outEvent, msg.correlationId);

        await server.emitMessage(msg.replyTo || '', response);
        await server.close();
      });

      const result = client.send(1).toPromise();

      await expect(result).rejects.toEqual(new NamedError(error.name, error.message));

      await client.close();
    });
  });

});
