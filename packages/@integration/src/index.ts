import * as http from 'http';
import { app, ws } from './app';

const HOSTNAME = '127.0.0.1';
const PORT = 1337;

const httpServer = http.createServer(app);
const wsServer = ws();

httpServer.on('upgrade', (req: http.IncomingMessage, socket, head) => {
  const pathname = req.url!;

  if (pathname.includes('/ws')) {
    wsServer.handleUpgrade(req, socket, head, function done(ws) {
      wsServer.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

httpServer.on('close', () => {
  console.log(`Connection closed`);
});

httpServer.listen(PORT, HOSTNAME, () => {
  console.log(`Server running @ http://${HOSTNAME}:${PORT}/`);
});
