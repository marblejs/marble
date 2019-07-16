<p align="center">
  <a href="https://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="200" alt="Marble.js logo"/>
  </a>
</p>

# @marblejs/messaging

A messaging module for [Marble.js](https://github.com/marblejs/marble).

## Installation

```
$ npm i @marblejs/messaging
```
Requires `@marblejs/core` to be installed.

## Documentation

For the latest updates, documentation, change log, and release information visit [docs.marblejs.com](https://docs.marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## Usage

Consumer code:
```typescript
import {
  createMicroservice,
  messagingListener,
  Transport,
  MsgEffect,
} from '@marblejs/messaging';

const effect$: MsgEffect = event$ =>
  event$.pipe(
    matchEvent('SOME_EVENT'),
    use(eventValidator$(t.number)),
    map(event => doSomeWork(event.payload)),
    map(payload => ({ type: 'SOME_EVENT_RESPONSE', payload })),
  );

export const microservice = createMicroservice({
  transport: Transport.AMQP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
  },
  messagingListener: messagingListener({
    effects: [ effect$ ],
  }),
});

microservice.run();
```

Messaging client supports two communication patterns:
- request-response (RPC) :: `client.send()`
- event-based :: `client.emit()`


Client code (RPC pattern example):
```typescript
import {
  Transport,
  MessagingClient,
  messagingClient,
} from '@marblejs/messaging';

const ClientToken = createContextToken<MessagingClient>();

const client = messagingClient({
  transport: Transport.AMQP,
  options: {
    host: 'amqp://localhost:5672',
    queue: 'test_queue',
    queueOptions: { durable: false },
  },
});

const effect$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect((req$, _, { ask }) => req$.pipe(
    // ...
    mergeMap(() => ask(ClientToken)
      .map(c => c.send({ type: 'SOME_EVENT', payload: 100 }))
      .getOrElse(EMPTY)),
    )),
    map(body => ({ body })),
  )),
);

export const server = createServer({
  httpListener: httpListener({
    effects: [ effect$ ],
  }),
  dependencies: [
    bindTo(ClientToken)(client.run),
  ],
});
```

License: MIT
