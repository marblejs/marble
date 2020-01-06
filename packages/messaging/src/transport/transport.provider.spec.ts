import { provideTransportLayer } from './transport.provider';
import { Transport } from './transport.interface';

describe('#provideTransportLayer', () => {
  test('provides requested transport layer', () => {
    const provide = () => provideTransportLayer(Transport.AMQP, {});
    expect(provide).toBeDefined();
  });

  test('throws an exception if requested transport layer is not supported', () => {
    const provide = () => provideTransportLayer(Transport.GRPC, {});
    expect(provide).toThrowError('Unsupported transport type');
  });
});
