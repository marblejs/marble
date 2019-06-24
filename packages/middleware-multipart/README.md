<p align="center">
  <a href="https://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="200" alt="Marble.js logo"/>
  </a>
</p>

# @marblejs/middleware-multipart

A **multipart/form-data** middleware for [Marble.js](https://github.com/marblejs/marble) based on [busboy](https://github.com/mscdex/busboy) library.

## Installation

```
$ npm i @marblejs/middleware-multipart
```
Requires `@marblejs/core` to be installed.

## Documentation

For the latest updates, documentation, change log, and release information visit [docs.marblejs.com](https://docs.marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## Usage

---

**WARNING**: Make sure that you always handle the files that a user uploads. Never add it as a global middleware since a malicious user could upload files to a route that you didn't anticipate. Only use this it on routes where you are handling the uploaded files.

---

By default middleware parses all incoming files and stores them in-memory.

*Keep in mind that the middleware will parse only `POST` and `PATCH` request with multipart content-type.*

```typescript
import { multipart$ } from '@marblejs/middleware-multipart';

const effect$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(multipart$()),
    map(req => ({ body: {
      files: req.files['image_1'],  // file information
      body: req.body,             // all incoming body fields
    }}))
  )));
```

You can intercept incoming files and stream them to the different place, eg. to OS filesystem:

```typescript
import { multipart$, StreamHandler } from '@marblejs/middleware-multipart';

const stream: StreamHandler = ({ file, fieldname }) => {
  const destination = // ...
  return of({ destination });
};

const effect$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(multipart$({
      stream,
      maxFileCount: 1,
      files: ['image_1'],
    })),
    map(req => ({ body: {
      files: req.files['image_1'],  // file information
      body: req.body,             // all incoming body fields
    }}))
  )));
```

Each file contains the following information:

| key           | description |
| ------------- | ----------- |
| `fieldname`   | Field name specified in the form |
| `filename`    | Name of the file on the user's computer |
| `encoding`    | Encoding type of the file |
| `mimetype`    | Mime type of the file |
| `size`        | Size of the file in bytes |
| `destination` | The place in which the file has been saved (*if not in-memory*) |
| `buffer`      | A `Buffer` of the entire file |

You can define the following middleware options:

| key             | description |
| --------------- | ----------- |
| `maxFileCount`  | The total count of files that can be sent |
| `maxFieldCount` | The total count of fields that can be sent |
| `maxFileSize`   | The max possible file size in bytes |
| `files`         | An array of acceptable field names |
| `stream`        | A handler which you can use to stream incoming files to different location |

License: MIT
