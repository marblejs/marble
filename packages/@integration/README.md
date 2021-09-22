Marble.js (integration examples)
=======

Here all located all integration examples for all [Marble.js](https://github.com/marblejs/marble) packages.

## Available examples

- `./src/http`
  
  A typical HTTP-based server. Demonstrates basic usage of:
  - REST API,
  - middlewares
  - request validation, 
  - file serving, 
  - file upload,

- `./src/cqrs`

  A simple `EventBus` integration example. Demonstates basc usage of:
  - event creation (DDD-like: commands/events)
  - dependency injection
  - basic usage of `@marblejs/messaging` module based on `EventBus` (local transport layer)

- `./src/messaging`

  A simple `RabbitMQ (AMQP)` and `Redis Pub/Sub` integration example. Demonstates basc usage of:
  - `Redis` transport layer
  - `AMQP` transport layer
  - dependency injection
  - microservices integration (client/consumer),

- `./src/websockets`

  A typical WebSocket-based server. Demonstrates basic usage of:
  - WebSocker server creation
  - integration with HTTP and WebSocket server
  
- `./test`

  Example usage of `@marblejs/testing` module.

## License
MIT
