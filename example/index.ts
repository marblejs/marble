import * as http from 'http';
import { root$, hello$ } from './controllers';
import { httpListener } from '../src';

const createServer = () => {
  const HOSTNAME = '127.0.0.1';
  const PORT = 1337;

  const app = httpListener(
    root$,
    hello$,
  );

  const httpServer = http
    .createServer(app)
    .listen(PORT, HOSTNAME, () => {
      console.log(`Server running @ http://${HOSTNAME}:${PORT}/`);
    });
};

createServer();
