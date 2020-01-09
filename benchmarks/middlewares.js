const http = require('http');
const { mapTo, filter } = require('rxjs/operators');
const { bindTo, createContext, createServer, httpListener, r, registerAll, ServerClientToken } = require('../packages/core/dist');

const n = parseInt(process.env.MW || '1', 10);

const root$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    mapTo({ body: 'Hello World' })
  )),
);

const middlewares = [];
const effects = [root$];

for (let i = 0; i < n; i++) {
  middlewares.push(req$ => req$);
}

const server = createServer({
  port: 1337,
  httpListener: httpListener({ effects, middlewares }),
});

const bootstrap = async () => {
  const app = await server;
  await app();
  console.log(`  ${n} middlewares - Marble.js`);
};

bootstrap();
