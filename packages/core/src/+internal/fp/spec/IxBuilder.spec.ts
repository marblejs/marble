import { iof, ichain, map } from '../IxBuilder';

describe('IxBuilder', () => {
  test('maps values', () => {
    expect(iof('a')
      .map(x => x + 'b')
      .map(x => x + 'c')
      .run()).toBe('abc');
  });

  test('chains builders', () => {
    expect(iof('a')
      .ichain(x => iof(x + 'b'))
      .ichain(x => iof(x + 'c'))
      .run()).toBe('abc');
  });
});

test('static #iof creates builder', () => {
  expect(
    iof('a').run()
  ).toBe('a');
});

test('static #ichan chains builders', () => {
  expect(
    ichain(iof('a'), x => iof(x + 'b')).run()
  ).toBe('ab');
});

test('static #map maps values', () => {
  expect(
    map(iof('a'), x => x + 'b').run()
  ).toBe('ab');
});
