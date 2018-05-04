import * as http from 'http';
import { app } from './app';

const createServer = app => {
  const HOSTNAME = '127.0.0.1';
  const PORT = 1337;

  const httpServer = http
    .createServer(app)
    .listen(PORT, HOSTNAME, () => {
      console.log(`Server running @ http://${HOSTNAME}:${PORT}/`);
    });

    httpServer.on('close', () => {
      console.log(`Connection closed`);
    });
};

createServer(app);
