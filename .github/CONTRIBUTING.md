# Contributing to Marble.js

We would love for you to contribute to Marble.js and help make it even better than it is
today! As a contributor, here are the guidelines we would like you to follow:

 - [Code of Conduct](#coc)
 - [Question or Problem?](#question)
 - [Semantic Versioning](#versioning)
 - [Found a Bug?](#bugs)
 - [Steps for contributing](#steps)
 - [Development Workflow](#workflow)
 - [Commit Message Guidelines](#commit)

## <a name="coc"></a> Code of Conduct
Please read and follow our [Code of Conduct][coc].

## <a name="question"></a> Got a Question or Problem?

Do not open issues for general support questions as we want to keep GitHub issues for bug reports and feature requests. You've got much better chances of getting your question answered on [Stack Overflow](https://stackoverflow.com/questions/tagged/marblejs) where the questions should be tagged with tag `marblejs`.

## <a name="versioning"></a> Semantic Versioning

**Marble.js** follows semantic versioning. We release patch versions for bugfixes, minor versions for new features, and major versions for any breaking changes.

## <a name="bugs"></a> Found a Bug?

We are using [GitHub Issues][issues] for bugs. We keep a close eye on this and try to make it clear when we have an internal fix in progress. Before filing a new task, try to make sure your problem doesn’t already exist. The best way to get your bug fixed is to provide a reduced test case.

## <a name="steps"></a> Steps for contributing

1. Create an issue for the bug you want to fix or the feature that you want to add.
2. Create your own fork on github, then checkout your fork.
3. Write your code in your local copy. It's good practice to create a branch for each new issue you work on, although not compulsory.
4. To run the test suite, first install the dependencies by running `yarn`, then run `yarn test` or `yarn test:watch`.
5. Ensure your code is linted by running `yarn lint` -- fix any issue you see listed.
6. If the tests pass, you can commit your changes to your fork and then create a pull request from there. Make sure to reference your issue from the pull request comments by including the issue number e.g. *#123*.

## <a name="workflow"></a> Development Workflow

Tools of choice:
- `jest` - test runner
- `yarn 1.x` - package manager

After cloning, run `yarn` to fetch and install all project related dependencies. Then, you can run several commands:

- `yarn build` - builds internal packages
- `yarn benchmark` - runs benchmarking scripts
- `yarn lint` - checks the code style
- `yarn test` - runs complete test suite
- `yarn test:watch` - runs an interactive test watcher
- `yarn test:unit` - runs unit test suite only
- `yarn test:integration` - runs integration test suite only
- `yarn clean` - cleans up build artifacts (skipping *node_modules*)
- `yarn purge` - cleans everything (including installed *node_modules*)

You can also check built in examples by visiting `./packages/@integration` folder. Then, run `yarn` to fetch all example related dependencies. There are two several commands available for you:

- `yarn start:http` - runs example HTTP server
- `yarn start:cqrs` - runs example HTTP server with EventBus integration
- `yarn start:websockets` - runs example HTTP server wtih WebSocket integration
- `yarn start:messaging:client` - runs example messaging client (HTTP server)
- `yarn start:messaging:server` - runs example messaging consumer (microservice) (Redis + RabbitMQ)
- `yarn test` - run test suite written for already existing examples
- `yarn watch:dev` - run examples in watch mode (development)
- `yarn clean` - cleans up examples build artifacts (skipping *node_modules*)

## <a name="commit"></a> Commit Message Guidelines

There are some rules over how our git commit messages should be formatted. This leads to more readable messages that are easy to follow when looking through the project history. Marble.js repository follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) naming convention.

```
<type>(<scope>): <subject>
```
example:
```
docs(changelog): update changelog to beta.5
```

### Type

Must be one of the following:

- **build**: Changes that affect the build system or external dependencies (example scopes: npm, lerna)
- **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Codecov)
- **docs**: Documentation only changes
- **feat**: A new feature
- **fix**: A bug fix
- **perf**: A code change that improves performance
- **refactor***: A code change that neither fixes a bug nor adds a feature
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **test**: Adding missing tests or correcting existing tests

### Scope

The scope should be the name of the package affected (as perceived by the person reading the changelog generated from commit messages).


[coc]: https://github.com/marblejs/marble/blob/master/docs/CODE_OF_CONDUCT.md
[issues]: https://github.com/marblejs/marble/issues
[github]: https://github.com/marblejs/marble
[stackoverflow]: http://stackoverflow.com/questions/tagged/marblejs
