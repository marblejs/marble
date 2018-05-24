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
4. To run the test suite, first install the dependencies by running `npm install`, then run `npm test` or `npm run test:watch`.
5. Ensure your code is linted by running `npm run lint` -- fix any issue you see listed.
6. If the tests pass, you can commit your changes to your fork and then create a pull request from there. Make sure to reference your issue from the pull request comments by including the issue number e.g. *#123*.

## <a name="workflow"></a> Development Workflow

After cloning, run `npm install` to fetch all project related dependencies. Then, you can run several commands:

- `npm run build` - installs + builds internal packages
- `npm run benchmark` - runs benchmarking scripts
- `npm run lint` - checks the code style
- `npm run test` - runs complete test suite
- `npm run test:coverage` - runs complete test suite with coverage report
- `npm run test:watch` - runs an interactive test watcher

You can also check built in examples by visiting `./example/` folder. Then, run `npm install` to fetch all example related dependencies. There are two commands available for you:

- `npm run start` - run example
- `npm run watch` - run example in watch mode (development)

## <a name="commit"></a> Commit Message Guidelines

There are some rules over how our git commit messages should be formatted. This leads to more readable messages that are easy to follow when looking through the project history.

```
<type>(<scope>): <subject>
```
sample:
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

The scope should be the name of the npm package affected (as perceived by the person reading the changelog generated from commit messages).


[coc]: https://github.com/marblejs/marble/blob/master/docs/CODE_OF_CONDUCT.md
[issues]: https://github.com/marblejs/marble/issues
[github]: https://github.com/marblejs/marble
[stackoverflow]: http://stackoverflow.com/questions/tagged/marblejs
