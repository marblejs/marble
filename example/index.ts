import * as http from 'http';
import { root$, hello$ } from './controllers';
import { httpListener, logger$ } from '../src';

const createServer = () => {
  const HOSTNAME = '127.0.0.1';
  const PORT = 1337;

  const middlewares = [
    logger$,
  ];

  const effects = [
    root$,
    hello$,
  ];

  const app = httpListener(middlewares, effects);

  const httpServer = http
    .createServer(app)
    .listen(PORT, HOSTNAME, () => {
      console.log(`Server running @ http://${HOSTNAME}:${PORT}/`);
    });

    httpServer.on('close', () => {
      console.log(`Connection closed`);
    });
};

createServer();
