import { Microservice } from '../../server/messaging.server.interface';
import { TransportLayerConnection } from '../../transport/transport.interface';

export const createMicroserviceTestBed = (microservice: Promise<Microservice>) => {
  let connection: TransportLayerConnection;

  const getInstance = () => connection;

  beforeAll(async () => {
    const app = await microservice;
    connection = await app();
  });

  afterAll(async () => connection.close());

  return {
    getInstance,
  };
};
