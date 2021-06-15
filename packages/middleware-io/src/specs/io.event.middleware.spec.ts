import * as t from 'io-ts';
import { of, firstValueFrom } from 'rxjs';
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
    const result = await firstValueFrom(eventValidator$(schema)(of(input)));

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
    const result = await firstValueFrom(eventValidator$(schema)(of(input)));

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
    const result = await firstValueFrom(eventValidator$(schema)(of(input)));

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
    const result = firstValueFrom(eventValidator$(schema)(of(input)));

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

  test('allows to pass single event outside Observable stream', async () => {
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
    const result = await firstValueFrom(eventValidator$(schema)(input));

    // then
    expect(result.type).toEqual(input.type);
    expect(result.payload).toEqual(input.payload);
  });
});
