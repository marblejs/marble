import { fromReadableStream } from './fromReadableStream';
import { Transform } from 'stream';

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

    fromReadableStream(stream).subscribe(
      (buffer: Buffer) => {
        expect(buffer.toString()).toEqual(data);
      },
      (error: Error) => {
        fail(`Error shouldn't be thrown: ${error}`);
        done();
      },
      () => {
        done();
      },
    );

    stream.write(data);
    stream.end();
  });

  test('handles stream error', done => {
    const stream = new DuplexStream();
    const errorToThrow = new Error('test-error');

    fromReadableStream(stream).subscribe(
      (_: Buffer) => {
        fail(`Error should be thrown`);
        done();
      },
      (error: Error) => {
        expect(error.message).toBe(errorToThrow.message);
        done();
      }
    );

    stream.emit('error', errorToThrow);
    stream.end();
  });
});
