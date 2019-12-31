import { jsonTransformer } from './websocket.json.transformer';

test('#jsonTransformer decodes and encodes incoming and outgoing data', () => {
  // given
  const jsonObject = { type: 'EVENT', payload: 'test_data' };
  const jsonString = JSON.stringify(jsonObject);

  // when
  const decodedData = jsonTransformer.decode(jsonString);
  const encodedData = jsonTransformer.encode(jsonObject);

  // then
  expect(decodedData).toEqual(jsonObject);
  expect(encodedData).toEqual(jsonString);
});
