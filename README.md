<p align="center">
  <a href="https://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="320" alt="Marble.js logo"/>
  </a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@marblejs/core">
  <img src="https://travis-ci.com/marblejs/marble.svg?branch=master" alt="Travis-CI status" height="18">
</a>
<a href="https://badge.fury.io/js/%40marblejs%2Fcore">
  <img src="https://badge.fury.io/js/%40marblejs%2Fcore.svg" alt="npm version" height="18">
</a>
<a href="https://codecov.io/gh/marblejs/marble?branch=master">
  <img src="https://codecov.io/gh/marblejs/marble/coverage.svg?branch=master" alt="Codecov coverage" height="18">
</a>
<a href="https://lernajs.io">
  <img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" alt="Maintained with lerna" height="18">
</a>
</p>

<p align="center">
Functional reactive HTTP framework built on top of <a href="http://nodejs.org" target="blank">Node.js</a> platform, <a href="https://www.typescriptlang.org" target="blank">TypeScript</a> and <a href="http://reactivex.io/rxjs" target="blank">RxJS</a>.
</p>

## <a name="philosophy"></a> Philosophy

The core concept of **Marble.js** assumes that almost everything is a stream. The main building block of the whole framework is an Effect, which is just a function that returns a stream of events.

The purely functional languages like Haskell expresses side effects such as IO and other stateful computations using monadic actions. With big popularity of  RxJS Observable monad you can create a referential transparent program specification made up of functions that may produce side effects like network, logging, database access, etc. Using its monadic nature we can map I/O operations over effects and flat them to bring in other sequences of operations. Marble.js is a functional reactive framework, thats why RxJS is a first class citizen here. It’s a much more powerful and feature-rich monad than IO that implements the basic abstract interface as well as a ton of additional functionalities for manipulating sequences of events over time.

When looking at Marble.js you can ask: **"Why do we need RxJS for HTTP?"**. Despite of the single event nature of basic HTTP, there are are no contraindications against using it for single events. In Marble, RxJS is used as a hammer for expressing asynchronous flow with monadic manner, even if you have to deal with only one event passing over time. Marble.js doesn't operate only over basic protocol, but can be used also for both WebSocket and event sourcing purposes, where the multi-event nature fits best. Don't be scared of the complexity and abstractions presented in RxJS API —  the Marble.js framework in general is incredibly simple.

*For those who are curious about the framework name - it comes from a popular way of visually expressing the time-based behavior of event streams, aka marble diagrams. This kind of domain specific language is a popular way for testing asynchronous streams especially in RxJS environments.*

## <a name="ecosystem"></a> Ecosystem
| Name                        | Description                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| [@marblejs/core](https://www.npmjs.com/package/@marblejs/core)                           | Framework core module           |
| [@marblejs/websockets](https://www.npmjs.com/package/@marblejs/websockets)               | WebSockets module               |
| [@marblejs/middleware-logger](https://www.npmjs.com/package/@marblejs/middleware-logger) | Logger middleware               |
| [@marblejs/middleware-body](https://www.npmjs.com/package/@marblejs/middleware-body)     | Body parser middleware          |
| [@marblejs/middleware-io](https://www.npmjs.com/package/@marblejs/middleware-io)         | I/O validation middleware       |
| [@marblejs/middleware-jwt](https://www.npmjs.com/package/@marblejs/middleware-jwt)       | JWT autgorization middleware    |
| [@marblejs/middleware-joi](https://www.npmjs.com/package/@marblejs/middleware-joi)       | JOI-based validation middleware |
| [@marblejs/middleware-cors](https://www.npmjs.com/package/@marblejs/middleware-cors)     | CORS middleware                 |

## <a name="docs"></a> Documentation

For the latest updates, documentation, change log, and release information visit [docs.marblejs.com](https://docs.marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## <a name="examples"></a> Examples

To view the example project, visit the [example](https://github.com/marblejs/example) repository.

## Authors

<table border="0">
  <tr>
    <td>
      <a href="https://github.com/JozefFlakus" style="color: white">
        <img src="https://github.com/JozefFlakus.png?s=150" width="150"/>
      </a>
    </td>
    <td>
      <p><strong>Józef Flakus</strong></p>
      <p><strong>contact: </strong><a href="mailto:hello@jflakus.com">hello@jflakus.com</a></p>
      <p><strong>twitter: </strong><a href="https://twitter.com/jozflakus">@jozflakus</a></p>
    </td>
  </tr>
</table>

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/sebastianmusial" style="color: white">
        <img src="https://github.com/sebastianmusial.png?s=150" width="100"/>
        <p style="text-align: center"><small>Sebastian Musial</small></p>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/pdomaleczny" style="color: white">
        <img src="https://github.com/pdomaleczny.png?s=150" width="100"/>
        <p style="text-align: center"><small>Patryk Domałeczny</small></p>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/luciorubeens" style="color: white">
        <img src="https://github.com/luciorubeens.png?s=150" width="100"/>
        <p style="text-align: center"><small>Lúcio Rubens</small></p>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/krzysztof-miemiec" style="color: white">
        <img src="https://github.com/krzysztof-miemiec.png?s=150" width="100"/>
        <p style="text-align: center"><small>Krzysztof Miemiec</small></p>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Edouardbozon" style="color: white">
        <img src="https://github.com/Edouardbozon.png?s=150" width="100"/>
        <p style="text-align: center"><small>Edouard Bozon</small></p>
      </a>
    </td>
  </tr>
</table>

## License

marble.js is MIT licensed
