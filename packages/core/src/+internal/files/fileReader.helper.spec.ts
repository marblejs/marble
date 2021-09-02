import * as fs from 'fs';
import { readFile } from './fileReader.helper';

describe('File reader', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(jest.fn());
    jest.spyOn(console, 'info').mockImplementation(jest.fn());
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
  });

  test('#readFile returns error when not found', done => {
    // given
    const expectedError = { code: 'ENOENT', message: 'ENOENT, no such file or directory' };
    const readFileStub = jest.fn((_, callback) => callback(expectedError));

    jest.spyOn(fs, 'readFile').mockImplementation(readFileStub);

    // when
    const subscription = readFile('test/url')('index.html');

    // then
    subscription.subscribe({
      next: () => fail('Exceptions should be thrown'),
      error: err => {
        expect(err).toBeDefined();
        expect(err.message.includes('ENOENT, no such file or directory')).toBe(true);
        done();
      },
    });
  });

  test('#readFile returns Buffer when found', done => {
    // given
    const mockedData = 'test_data';
    const mockedBuffer = Buffer.from(mockedData);
    const readFileStub = jest.fn((_, callback) => callback(undefined, mockedBuffer));

    jest.spyOn(fs, 'readFile').mockImplementation(readFileStub);

    // when
    const subscription = readFile('test/url')('index.html');

    // then
    subscription.subscribe({
      next: data => {
        expect(data).toBeDefined();
        expect(Buffer.isBuffer(data)).toEqual(true);
        expect(data.toString()).toEqual(mockedData);
        done();
      },
      error: err => fail(`Exceptions shouldn't be thrown: ${err}`),
    });
  });
});
