import { of } from 'rxjs';
import * as t from 'io-ts';
import { validator$ } from '../io.middleware';
import { IOError } from '@marblejs/core';

describe('#validator$', () => {
  test('passes incoming data', done => {
    // given
    const input = { name: 'test', age: 100, additional: {} };
    const schema = t.interface({
      name: t.string,
      age: t.number,
    });

    // when
    const stream$ = validator$(schema)(of(input));

    // then
    stream$.subscribe(
      outgoingData => {
        expect(outgoingData.age as number).toEqual(input.age);
        expect(outgoingData.name as string).toEqual(input.name);
        expect((outgoingData as any).additional).toEqual(input.additional);
        done();
      },
      (error: IOError) => {
        fail(error.data);
        done();
      },
    );
  });

  test('throws error if incoming data are not valid', done => {
    // given
    const input = { name: 'test', age: false };
    const expectedError = [{ expected: 'model: { name: string, age: number } / age: number', got: 'false' }];
    const schema = t.interface({
      name: t.string,
      age: t.number,
    });

    // when
    const stream$ = validator$(schema)(of(input));

    // then
    stream$.subscribe(
      () => {
        fail('Datas should\t be returned');
        done();
      },
      (error: IOError) => {
        expect(error.message).toEqual('Validation error');
        expect(error.data).toEqual(expectedError);
        done();
      },
    );
  });
});
