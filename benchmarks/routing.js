const http = require('http');
const { mapTo } = require('rxjs/operators');
const { bindTo, createContext, createServer, httpListener, r, registerAll, ServerClientToken } = require('../packages/core/dist');

const n = parseInt(process.env.MW || '1', 10);

const middlewares = [];
const effects = [];

for (let i = 0; i < n-1; i++) {
  effects.push(
    r.pipe(
      r.matchPath(`/test-${i}`),
      r.matchType('GET'),
      r.useEffect(r$ => r$.pipe(
        mapTo({ body: 'Hello World' }),
      )),
    ),
  );
}

effects.push(
  r.pipe(
    r.matchPath(`/`),
    r.matchType('GET'),
    r.useEffect(r$ => r$.pipe(
      mapTo({ body: 'Hello World' }),
    )),
  ),
);

const app = httpListener({ middlewares, effects });

const server = createServer({
  port: 1337,
  httpListener: httpListener({ middlewares, effects }),
});

const bootstrap = async () => {
  const app = await server;
  await app();
  console.log(`  ${n} endpoints - Marble.js`);
};

bootstrap();
