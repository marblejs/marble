import * as http from 'http';
import { Observable, Subject, of, merge } from 'rxjs';
import { filter, tap, map, mergeMap, switchMap, defaultIfEmpty } from 'rxjs/operators';

const HOSTNAME = '127.0.0.1';
const PORT = 1337;

type HttpRequest = http.IncomingMessage;
type HttpResponse = http.ServerResponse;

type Http = {
  req: HttpRequest,
  res: HttpResponse,
};

type Response = {
  status: number,
  body?: object,
};

type RequestEffect = (request$: Observable<HttpRequest>) => Observable<Response>;

const api$: RequestEffect = request$ => request$
  .pipe(
    filter(http => http.url === '/'),
    map(http => ({
      status: 200,
      body: { data: `API root @ ${http.url}` },
    }))
  );

const hello$: RequestEffect = request$ => request$
  .pipe(
    filter(http => http.url === '/hello'),
    map(http => ({
      status: 200,
      body: { data: `Hello, world! @ ${http.url}` },
    }))
  );

const combineEffects = (...effects: RequestEffect[]) => (request$: Observable<HttpRequest>) =>
  merge(
    ...effects.map(effect => {
      const output$ = effect(request$);

      if (!output$) {
        throw new TypeError(`combineEffects: one of the provided Effects does not return a stream!`);
      }

      return output$;
    })
  );

const requestHandler = () => {
  const request$ = new Subject<Http>();

  request$
    .pipe(
      tap(http => console.log('Logger:', `${http.req.url}`)),
      switchMap(http => combineEffects(api$, hello$)(of(http.req))
        .pipe(
          tap(output => {
            http.res.writeHead(output.status, { 'Content-Type': 'application/json' });
            http.res.end(JSON.stringify(output.body));
          })
        )
      ),
    )
    .subscribe();


  return (req: HttpRequest, res: HttpResponse) => request$.next({ req, res });
};

const app = requestHandler();

const httpServer = http
  .createServer(app)
  .listen(PORT, HOSTNAME, () => {
    console.log(`Server running @ http://${HOSTNAME}:${PORT}/`);
  });
