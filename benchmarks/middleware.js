const http = require('http');
const { mapTo } = require('rxjs/operators');
const { httpListener, effect } = require('../packages/core/dist');
const { logger$ } = require('../packages/middleware-logger/dist');

const n = parseInt(process.env.MW || '1', 10);

const middlewares = [];
const effects = [];

for (let i = 0; i < n-1; i++) {
  effects.push(effect(`/test-${i}`)('GET')(r$ => r$.pipe(
    mapTo({ body: 'Hello World' })
  )));
}

effects.push(effect(`/`)('GET')(r$ => r$.pipe(
  mapTo({ body: 'Hello World' })
)));

const app = httpListener({ middlewares, effects });

console.log(`  ${n} middlewares -- Marble.js`);

http.createServer(app).listen(1337);
