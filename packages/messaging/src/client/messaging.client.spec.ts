import { TimeoutError } from 'rxjs';
import { createContext } from '@marblejs/core';
import { Transport, TransportMessage } from '../transport/transport.interface';
import { createAmqpStrategy } from '../transport/strategies/amqp.strategy';
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

    const runClient = async () => await messagingClient(clientOptions)(createContext());
    const runServer = () => createAmqpStrategy(clientOptions.options).connect({ isConsumer: true });
    const createMessage = (data: any, correlationId?: string): TransportMessage<Buffer> => ({
      data: Buffer.from(JSON.stringify(data)),
      correlationId: correlationId,
    });

    test('emits event', async done => {
      const client = await runClient();
      const server = await runServer();

      server.message$.subscribe(async msg => {
        expect(msg.data.toString()).toEqual(JSON.stringify({ test: 'test' }));
        await server.close();
        done();
      });

      await client.emit({ test: 'test' });
      await client.close();
    });

    test('sends command', async () => {
      const client = await runClient();
      const server = await runServer();

      server.message$.subscribe(async msg => {
        const count = Number(msg.data.toString()) + 1;
        const response = createMessage(count, msg.correlationId);

        await server.emitMessage(msg.replyTo || '', response);
        await server.close();
      });

      const result = await client.send(1).toPromise();

      expect(result).toEqual(2);

      await client.close();
    });

    test('timeouts sent command', async () => {
      const client = await runClient();
      const server = await runServer();

      const result = client.send(1).toPromise();

      await expect(result).rejects.toEqual(new TimeoutError());

      await client.close();
      await server.close();
    });
  });

});
