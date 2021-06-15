import { Transform } from 'stream';
import { fromReadableStream } from './fromReadableStream';

class DuplexStream extends Transform {
  _transform(chunk, _, callback) {
    this.push(chunk);
    callback();
  }
}

describe('#fromReadableStream', () => {
  test('reads data to buffer', done => {
    const stream = new DuplexStream();
    const data = '111';

    fromReadableStream(stream).subscribe({
      next: (buffer: Buffer) => expect(buffer.toString()).toEqual(data),
      error: (err: Error) => fail(`Error shouldn't be thrown: ${err}`),
      complete: done,
    });

    stream.write(data);
    stream.end();
  });

  test('handles stream error', done => {
    const stream = new DuplexStream();
    const errorToThrow = new Error('test-error');

    fromReadableStream(stream).subscribe({
      next: () => fail(`Error should be thrown`),
      error: (error: Error) => {
        expect(error.message).toBe(errorToThrow.message);
        done();
      },
    });

    stream.emit('error', errorToThrow);
    stream.end();
  });
});
