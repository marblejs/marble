import * as t from 'io-ts';
import { of } from 'rxjs';
import { eventValidator$ } from '../io.event.middleware';
import { IOError } from '../io.error';

describe('#eventValidator$', () => {
  test('passes incoming event if input is successfuly validated', done => {
    // given
    const input = {
      type: 'TEST_EVENT',
      payload: {
        name: 'test',
        age: 100,
      }
    };
    const schema = t.type({
      name: t.string,
      age: t.number,
    });

    // when
    const stream$ = eventValidator$(schema)(of(input));

    // then
    stream$.subscribe(
      outgoingData => {
        expect(outgoingData.type).toEqual(input.type);
        expect(outgoingData.payload).toEqual(input.payload);
        done();
      },
      (error: IOError) => {
        fail(error.data);
        done();
      },
    );
  });

  test('throws WebSocket error if incoming data are not valid', done => {
    // given
    const input = {
      type: 'TEST_EVENT',
      payload: {
        name: 'test',
        age: '100',
      }
    };
    const schema = t.type({
      name: t.string,
      age: t.number,
    });
    const expectedError = [{
      path: 'age',
      expected: 'number',
      got: '"100"',
    }];

    // when
    const stream$ = eventValidator$(schema)(of(input));

    // then
    stream$.subscribe(
      () => {
        fail('Datas should\'t be returned');
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
