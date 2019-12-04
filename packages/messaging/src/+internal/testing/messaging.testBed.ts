import { Microservice } from '../../server/messaging.server.interface';
import { TransportLayerConnection } from '../../transport/transport.interface';

export const createMicroserviceTestBed = (microservice: Microservice) => {
  let connection: TransportLayerConnection;

  const getInstance = () => connection;

  beforeAll(async () => {
    connection = await microservice();
  });

  afterAll(async () => connection.close());

  return {
    getInstance,
  };
};
