const http = require('http');
const { mapTo, filter } = require('rxjs/operators');
const { httpListener, matchPath, matchType } = require('../packages/core/dist');

const n = parseInt(process.env.MW || '1', 10);

const root$ = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    mapTo({})
  );

const middleware$ = request$ => request$
  .pipe(
    filter(req => 1 + 1 === 2)
  );

const middlewares = [];
const effects = [root$];

for (let i = 0; i < n; i++) {
  middlewares.push(middleware$);
}

const app = httpListener({ middlewares, effects });

console.log(`  ${n} middlewares`);
http.createServer(app).listen(1337);
