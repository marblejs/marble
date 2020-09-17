import * as assert from 'assert';
import { useContext, createContextToken, createReader } from '@marblejs/core';
import { EventBusClientToken } from '@marblejs/messaging';

export const SomeDependencyToken = createContextToken('SomeDependency');

/**
 * @description Some random dependency used for checking if EventBusClient can be properly resolved
 */
export const SomeDependency = createReader(ask => {
  const eventBusClient = useContext(EventBusClientToken)(ask);

  assert.strictEqual(typeof eventBusClient.emit, 'function');

  return 'nothing special';
});
