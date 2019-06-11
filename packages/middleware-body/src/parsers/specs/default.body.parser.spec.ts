import { defaultParser } from '../default.body.parser';

test('#defaultParser handles Content-Type as a first argument', () => {
  const body = {
    test: 'value',
  };
  const buffer = Buffer.from(JSON.stringify(body));
  expect(defaultParser('application/json')(buffer)).toEqual(body);
});
