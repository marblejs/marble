import { serializeUrlEncoded } from '../body.urlEncoded.serializer';

describe('serializeUrlEncoded', () => {
  test('returns object with params', () => {
    // given
    const formData = 'test=test&test-2=test-2&test-3=3';

    // when
    const serializedData = serializeUrlEncoded(formData);

    // then
    expect(serializedData).toEqual({
      test: 'test',
      'test-2': 'test-2',
      'test-3': 3,
    });
  });
});
