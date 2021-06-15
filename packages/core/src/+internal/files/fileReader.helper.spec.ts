import * as fs from 'fs';
import { readFile } from './fileReader.helper';

type ReadFileStup = (_: any, callback: (error?: any, data?: any) => void) => unknown;

describe('File reader', () => {
  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'error').and.stub();
  });

  test('#readFile returns error when not found', done => {
    // given
    const expectedError = { code: 'ENOENT', message: 'ENOENT, no such file or directory' };

    // when
    const readFileStub: ReadFileStup = (_, callback) => callback(expectedError);
    const subscription = readFile('test/url')('index.html');
    spyOn(fs, 'readFile').and.callFake(readFileStub);

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

    // when
    const readFileStub: ReadFileStup = (_, callback) => callback(undefined, mockedBuffer);
    const subscription = readFile('test/url')('index.html');
    spyOn(fs, 'readFile').and.callFake(readFileStub);

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
