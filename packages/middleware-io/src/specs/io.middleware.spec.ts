import { of } from 'rxjs';
import * as t from 'io-ts';
import { validator$ } from '../io.middleware';
import { IOError } from '../io.error';

describe('#validator$', () => {
  test('passes incoming data if input is successfuly validated', done => {
    // given
    const input = { name: 'test', age: 100, additional: {} };
    const schema = t.interface({
      name: t.string,
      age: t.number,
    });

    // when
    const stream$ = validator$(schema)(of(input));

    // then
    stream$.subscribe({
      next: outgoingData => {
        expect(outgoingData.age as number).toEqual(input.age);
        expect(outgoingData.name as string).toEqual(input.name);
        expect((outgoingData as any).additional).toEqual(input.additional);
        done();
      },
      error: fail,
    });
  });

  test('passes incoming data if schema is not defined', done => {
    // given
    const input = { name: 'test', age: 100, additional: {} };
    const schema = undefined;

    // when
    const stream$ = validator$(schema)(of(input));

    // then
    stream$.subscribe({
      next: outgoingData => {
        expect(outgoingData).toEqual(input);
        done();
      },
      error: fail,
    });
  });

  test('throws error if incoming data are not valid', done => {
    // given
    const input = { name: 'test', age: false };
    const expectedError = [{
      path: 'age',
      expected: 'number',
      got: 'false',
    }];
    const schema = t.interface({
      name: t.string,
      age: t.number,
    });

    // when
    const stream$ = validator$(schema)(of(input));

    // then
    stream$.subscribe({
      next: fail,
      error: (err: IOError) => {
        expect(err.message).toEqual('Validation error');
        expect(err.data).toEqual(expectedError);
        done();
      },
    });
  });
});
