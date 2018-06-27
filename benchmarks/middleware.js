const http = require('http');
const { mapTo } = require('rxjs/operators');
const { httpListener, EffectFactory } = require('../packages/core/dist');
const { logger$ } = require('../packages/middleware-logger/dist');

const n = parseInt(process.env.MW || '1', 10);

const middlewares = [];
const effects = [];

for (let i = 0; i < n-1; i++) {
  effects.push(
    EffectFactory
      .matchPath(`/test-${i}`)
      .matchType('GET')
      .use(r$ => r$.pipe(
        mapTo({ body: 'Hello World' })
      ))
  );
}

effects.push(
  EffectFactory
    .matchPath(`/`)
    .matchType('GET')
    .use(r$ => r$.pipe(
      mapTo({ body: 'Hello World' })
    ))
);

const app = httpListener({ middlewares, effects });

console.log(`  ${n} middlewares -- Marble.js`);

http.createServer(app).listen(1337);
