<p align="center">
  <a href="http://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/assets/logo.png?raw=true" width="320" alt="Marble.js logo"/>
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
Functional reactive HTTP middleware framework built on top of <a href="http://nodejs.org" target="blank">Node.js</a> platform, <a href="https://www.typescriptlang.org" target="blank">TypeScript</a> and <a href="http://reactivex.io/rxjs" target="blank">RxJS</a> library.
</p>

## <a name="philosophy"></a> Philosophy

> If you don't have any experience with functional reactive programming, we strongly recommend to gain some basic overview first with <a href="http://reactivex.io/intro.html" target="blank">ReactiveX intro</a> or with <a href="https://gist.github.com/staltz/868e7e9bc2a7b8c1f754" target="blank">The introduction to Reactive Programming you've been missing</a> written by <a href="https://twitter.com/andrestaltz" target="blank">@andrestaltz</a>.

If we think closely how typical HTTP API works we can quickly recognize that it deals with streams of asynchronous events also called as HTTP requests. Describing it very briefly - typically each request needs to be transformed into response that goes back to the client (which is our event initiator) using custom middlewares or designated endpoints. In reactive programming world, all those core concepts we can translate into very simple marble diagram:

![Marble.js core concept](https://github.com/marblejs/marble/blob/master/assets/flow.png?raw=true)

In this world everything is a stream. The core concept of **Marble.js** is based on the event flow of marble diagrams which are used to visually express time based behavior of HTTP streams. Ok, but why the heck we need those `observables`? Trends come and go, but asynchronously nature of JavaScript and Node.js platform constantly evolves. With reactive manner we can deliver complex features faster by providing the ability to compose complex tasks with ease and with less amount of code. If you have ever worked with libraries like <a href="https://redux-observable.js.org" target="blank">Redux Observable</a>, <a href="https://github.com/ngrx/platform/blob/master/docs/effects/README.md" target="blank">@ngrx/effects</a> or other libraries that leverages functional reactive paradigm, you will feel like at home. Still there? So lets get started!

## <a name="docs"></a> Documentation

For the latest updates, documentation, change log, and release information visit [marblejs.com](http://marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## <a name="examples"></a> Examples

To view the example project structure, clone the **Marble.js** repository and install the dependencies:

```bash
$ git clone git://github.com/marblejs/marble.git
$ cd marble
$ npm i
$ cd example
```

To run example just execute following command inside root repository folder:

```bash
$ yarn start
```

## <a name="roadmap"></a> Roadmap

**Marble.js** is not yet a final and production ready product. Its APIs can improve over time when reaching stable version `1.0.0`. But in the meantime you can play easily and contribute to the growing community of functional reactive programming freaks.

## Contributing

We strongly believe that open source is all about the people. Thats why we are looking for brave passionates of RxJS and Node.js who can help us with creating new middlewares for Marble.js. There are many things that you can help us with! We've got a [list](https://github.com/marblejs/marble/projects/2) of middlewares that we would like to see in future releases, but we are open for new cool ideas!

**So, how can I contribute to Marble.js middlewares?** 🤔
- Read the [CONTRIBUTING](https://github.com/marblejs/marble/blob/master/.github/CONTRIBUTING.md) guideance first!
- We use monorepo architecture for entire framework-related packages - each middleware resides in main Marble.js repository
- For reference code structure just look at [example](https://github.com/marblejs/marble/tree/master/packages/middleware-joi) middleware implementation.
- Each middleware package should follow the naming convention: `@marblejs/middleware-{example_name}`
- If you have an idea and would like to contribute, just open an [issue](https://github.com/marblejs/marble/issues/new?template=feature_request.md) and describe the middelware idea that you would like to work on. We'll discuss the internals and proposed features there.
- Open a Pull Request and... 🚀

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
  </tr>
</table>

## License

marble.js is MIT licensed
