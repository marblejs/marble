import { createContext } from '@marblejs/core';
import { messagingClient } from './messaging.client';
import { MessagingClientConfig } from './messaging.client.interface';
import { Transport, TransportMessage } from '../transport/transport.interface';
import { createAmqpStrategy } from '../transport/strategies/amqp.strategy';

describe('#messagingClient', () => {

  describe('AMQP', () => {
    const clientOptions: MessagingClientConfig = {
      transport: Transport.AMQP,
      options: {
        host: 'amqp://localhost:5672',
        queue: 'test_queue_client',
        queueOptions: { durable: false },
      },
    };

    const runClient = () => messagingClient(clientOptions).run(createContext());
    const runServer = () => createAmqpStrategy(clientOptions.options).connect();
    const createMessage = (data: any, correlationId?: string): TransportMessage<Buffer> => ({
      data: Buffer.from(JSON.stringify(data)),
      correlationId: correlationId,
    });

    test('emits event to consumer', async done => {
      const client = runClient();
      const server = await runServer();

      server.consumeMessage().subscribe(async msg => {
        expect(msg.data.toString()).toEqual(JSON.stringify({ test: 'test' }));
        server.ack(msg);
        await server.close();
        done();
      });

      const result = await client.emit({ test: 'test' }).toPromise();
      expect(result).toEqual(true);
      await client.close().toPromise();
    });

    test('sends command to consumer', async () => {
      const client = runClient();
      const server = await runServer();

      server.consumeMessage().subscribe(async msg => {
        const count = Number(msg.data.toString()) + 1;
        const response = createMessage(count, msg.correlationId);

        await server.emitMessage(msg.replyTo || '', response);
        server.ack(msg);
        await server.close();
      });

      const result = await client.send(1).toPromise();
      expect(result).toEqual(2);
      await client.close().toPromise();
    });
  });

});
