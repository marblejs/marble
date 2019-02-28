import * as t from 'io-ts';
import { defaultReporter } from '../io.reporter';

describe('#defaultReporter', () => {
  let input;

  const schema = t.type({
    user: t.type({
      id: t.string,
      firstName: t.string,
      lastName: t.string,
      age: t.refinement(t.number, age => age >= 18, 'NumberAdult'),
      roles: t.array(t.union([
        t.literal('ADMIN'),
        t.literal('GUEST'),
      ])),
    }),
  });

  beforeEach(() => {
    input = {
      user: {
        id: 'test_id',
        firstName: 'test_firstName',
        lastName: 'test_lastName',
        age: 100,
        roles: ['GUEST'],
      },
    };
  });

  test('returns empty array if input is valid', () => {
    // given
    input = input;

    // when
    const result = schema.decode(input);
    const reporterResult = defaultReporter.report(result);

    // then
    expect(reporterResult).toEqual([]);
  });

  test('returns error if one of input fields is invalid', () => {
    // given
    input.user.lastName = false;
    input.user.age = '100';
    input.user.roles = ['TEST'];

    // when
    const result = schema.decode(input);
    const reporterResult = defaultReporter.report(result);

    // then
    expect(reporterResult).toEqual([
      {
        path: 'user.lastName',
        expected: 'string',
        got: 'false',
      },
      {
        path: 'user.age',
        expected: 'NumberAdult',
        got: '"100"',
      },
      {
        path: 'user.roles.0.0',
        got: '"TEST"',
        expected: '"ADMIN"'
      },
      {
        path: 'user.roles.0.1',
        got: '"TEST"',
        expected: '"GUEST"'
      }
    ]);
  });

  test('returns error if root object is not provided', () => {
    // given
    input = {};

    // when
    const result = schema.decode(input);
    const reporterResult = defaultReporter.report(result);

    // then
    expect(reporterResult).toEqual([
      {
        path: 'user',
        // tslint:disable-next-line:max-line-length
        expected: '{ id: string, firstName: string, lastName: string, age: NumberAdult, roles: Array<("ADMIN" | "GUEST")> }',
        got: undefined,
      },
    ]);
  });
});
