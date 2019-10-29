import * as fs from 'fs';
import { readFile } from './fileReader.helper';

describe('File reader', () => {

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'error').and.stub();
  });

  it('#readFile returns error when not found', done => {
    // given
    const expectedError = { code: 'ENOENT', message: 'ENOENT, no such file or directory' };

    // when
    const readFileStub = (_, callback) => callback(expectedError);
    const subscription = readFile('test/url')('index.html');
    spyOn(fs, 'readFile').and.callFake(readFileStub);

    // then
    subscription.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      (error: Error) => {
        expect(error).toBeDefined();
        expect(error.message.includes('ENOENT, no such file or directory')).toBe(true);
        done();
      }
    );
  });

  it('#readFile returns Buffer when found', done => {
    // given
    const mockedData = 'test_data';
    const mockedBuffer = Buffer.from(mockedData);

    // when
    const readFileStub = (_, callback) => callback(undefined, mockedBuffer);
    const subscription = readFile('test/url')('index.html');
    spyOn(fs, 'readFile').and.callFake(readFileStub);

    // then
    subscription.subscribe(
      data => {
        expect(data).toBeDefined();
        expect(Buffer.isBuffer(data)).toEqual(true);
        expect(data.toString()).toEqual(mockedData);
        done();
      },
      error => {
        fail(`Exceptions shouldn't be thrown: ${error}`);
        done();
      }
    );
  });
});
