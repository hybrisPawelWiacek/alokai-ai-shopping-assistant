/**
 * @description Generates a notification key based on the provided namespace.
 *
 * @param namespace - The namespace for the notification key.
 *
 * @returns A function that takes an array of keys and returns an object with a notification key.
 *
 * @example
 * const keyGenerator = notificationKey('myNamespace');
 * const notification = keyGenerator('key1', 'key2'); // { notificationKey: 'myNamespace.key1.key2' }
 */
export function notificationKey(namespace: string) {
  return (...keys: string[]) => {
    return {
      notificationKey: [namespace, ...keys].join('.'),
    };
  };
}
