import * as t from 'io-ts';
import * as E from 'fp-ts/lib/Either';
import { identity, pipe } from 'fp-ts/lib/function';
import { event } from './event';

describe('#event', () => {
  test('creates event schema with object payload', () => {
    const Foo = event('FOO')(t.type({
      bar: t.string,
      baz: t.boolean,
    }));

    const foo = Foo.create({
      bar: 'test',
      baz: false,
    });

    expect(foo).toEqual({
      type: 'FOO',
      payload: {
        bar: 'test',
        baz: false,
      },
    });
  });

  test('creates event schema with array of objects payload', () => {
    const Foo = event('FOO')(t.array(t.type({
      bar: t.string,
      baz: t.boolean,
    })));

    const foo = Foo.create([{
      bar: 'test',
      baz: false,
    }]);

    expect(foo).toEqual({
      type: 'FOO',
      payload: [{ bar: 'test', baz: false }],
    });
  });

  test('creates event schema with tuple payload', () => {
    const Foo = event('FOO')(t.tuple([
      t.string,
      t.string,
    ]));

    const foo = Foo.create([
      'test_1',
      'test_2',
    ]);

    expect(foo).toEqual({
      type: 'FOO',
      payload: ['test_1', 'test_2'],
    });
  });


  test('creates event schema with string payload', () => {
    const Foo = event('FOO')(t.string);

    const foo = Foo.create('test');

    expect(foo).toEqual({
      type: 'FOO',
      payload: 'test',
    });
  });

  test('creates event schema with boolean payload', () => {
    const Foo = event('FOO')(t.boolean);

    const foo = Foo.create(true);

    expect(foo).toEqual({
      type: 'FOO',
      payload: true,
    });
  });

  test('creates event schema without payload', () => {
    const Foo = event('FOO')();

    const foo = Foo.create();

    expect(foo).toEqual({
      type: 'FOO',
    });
  });

  test('creates event schema for enum type', () => {
    enum FooType { FOO = 'FOO' }

    const Foo = event(FooType.FOO)();

    const foo = Foo.create();

    expect(foo).toEqual({
      type: 'FOO',
    });
  });

  test('creates event schema with intersection and partial payload', () => {
    const Foo = event('FOO')(t.intersection([
      t.partial({
        test_partial: t.string
      }),
      t.type({
        test_required: t.string,
      }),
    ]));

    const foo = Foo.create({
      test_required: 'test'
    });

    expect(foo).toEqual({
      type: 'FOO',
      payload: { test_required: 'test' },
    });
  });

  test('successfuly decodes event schema with object payload and metadata', () => {
    const Foo = event('FOO')(t.type({
      bar: t.string,
      baz: t.boolean,
    }));

    const input = {
      type: 'FOO',
      payload: {
        bar: 'test',
        baz: false,
      },
      metadata: {
        correlationId: 'some_uuid',
        replyTo: 'some_channel',
        raw: { test: true },
      },
    };

    const output = pipe(
      Foo.decode(input),
      E.fold(fail, identity),
    );

    expect(output).toEqual(input);
  });

  test('successfuly decodes event schema with object payload and undefined metadata', () => {
    const Foo = event('FOO')(t.type({
      bar: t.string,
      baz: t.boolean,
    }));

    const input = {
      type: 'FOO',
      payload: {
        bar: 'test',
        baz: false,
      },
    };

    const output = pipe(
      Foo.decode(input),
      E.fold(fail, identity),
    );

    expect(output).toEqual(input);
  });

  test('fails to decode event schema with invalid object payload', () => {
    const Foo = event('FOO')(t.type({
      bar: t.string,
      baz: t.boolean,
    }));

    const input = {
      type: 'FOO',
      payload: {
        bar: 'test',
      },
    };

    const output = pipe(
      Foo.decode(input),
      E.fold(identity, fail),
    );

    expect(output).toBeDefined();
  });
});
