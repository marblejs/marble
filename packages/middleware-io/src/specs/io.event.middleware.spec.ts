import * as t from 'io-ts';
import { of } from 'rxjs';
import { event } from '@marblejs/core';
import { eventValidator$ } from '../io.event.middleware';

describe('#eventValidator$', () => {
  test('validates payload schema and passes incoming event if input is successfuly validated', async () => {
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
    const result = await eventValidator$(schema)(of(input)).toPromise();

    // then
    expect(result.type).toEqual(input.type);
    expect(result.payload).toEqual(input.payload);
  });

  test('validates event schema and passes incoming event if input is successfuly validated', async () => {
    // given
    const input = {
      type: 'TEST_EVENT',
      payload: {
        name: 'test',
        age: 100,
      }
    };

    const schema = event('TEST_EVENT')(t.type({
      name: t.string,
      age: t.number,
    }));

    // when
    const result = await eventValidator$(schema)(of(input)).toPromise();

    // then
    expect(result.type).toEqual(input.type);
    expect(result.payload).toEqual(input.payload);
  });

  test('validates event schema with undefined payload and passes incoming event if input is successfuly validated', async () => {
    // given
    const input = {
      type: 'TEST_EVENT',
    };

    const schema = event('TEST_EVENT')();

    // when
    const result = await eventValidator$(schema)(of(input)).toPromise();

    // then
    expect(result.type).toEqual(input.type);
    expect(result.payload).toBeUndefined();
  });

  test('throws validation error if incoming data are not valid', async () => {
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

    // when
    const result = eventValidator$(schema)(of(input)).toPromise();

    // then
    await expect(result).rejects.toEqual(expect.objectContaining({
      message: 'Validation error',
      data: [{
        path: 'age',
        expected: 'number',
        got: '"100"',
      }],
    }));
  });
});
