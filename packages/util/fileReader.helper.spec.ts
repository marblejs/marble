import * as mockFs from 'mock-fs';
import { readFile } from './fileReader.helper';

describe('File reader', () => {

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'error').and.stub();
  });

  it('#readFile returns error when not found', done => {
    // given
    mockFs();

    // when
    const subscription = readFile('test/url')('index.html');

    // then
    subscription.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error).toBeDefined();
        expect(error.message).toBe('File not found');
        done();
      }
    );
  });

  it('#readFile returns Buffer when found', done => {
    // given
    mockFs({ 'test/url': { 'index.html': 'test' } });

    // when
    const subscription = readFile('test/url')('index.html');

    // then
    subscription.subscribe(
      data => {
        expect(data).toBeDefined();
        expect(Buffer.isBuffer(data)).toEqual(true);
        expect(data.toString()).toEqual('test');
        done();
      },
      error => {
        fail(`Exceptions shouldn't be thrown`);
        done();
      }
    );
  });

  afterEach(() => mockFs.restore());

});
