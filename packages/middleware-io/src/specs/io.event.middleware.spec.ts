import * as t from 'io-ts';
import { of } from 'rxjs';
import { event } from '@marblejs/core';
import { validateEvent } from '../io.event.middleware';

describe('#validateEvent', () => {
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
    const result = await validateEvent(schema)(of(input)).toPromise();

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
    const result = await validateEvent(schema)(input).toPromise();

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
    const result = await validateEvent(schema)(of(input)).toPromise();

    // then
    expect(result.type).toEqual(input.type);
    expect(result.payload).toBeUndefined();
  });

  test('throws an error if incoming event is not valid', async () => {
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
    const result = validateEvent(schema)(of(input)).toPromise();

    // then
    await expect(result).rejects.toEqual(expect.objectContaining({
      event: expect.objectContaining(input),
      name: 'EventError',
      message: 'Validation error',
      data: [{
        path: 'age',
        expected: 'number',
        got: '"100"',
      }],
    }));
  });
});
