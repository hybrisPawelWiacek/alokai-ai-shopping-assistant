'use client';
import { useCallback, useState } from 'react';
import { useEvent } from 'react-use';

const getCurrentHash = () => (typeof window !== 'undefined' ? window.location.hash.replace(/^#!?/, '') : '');

/**
 *
 * @description Hook to get and set the hash part of the URL
 * This is a recreation of the useHash hook from the `react-use` library that works with SSR
 * @see {@link https://github.com/streamich/react-use/issues/1195 | Issue 1195}
 *
 * @returns hash - The current hash part of the URL
 * @returns setHash - Function to set the hash part of the URL
 *
 * @example
 * import { useHash } from '@/hooks';
 * const { hash, setHash } = useHash();
 *
 * console.log(hash); // 'my-hash'
 * setHash('new-hash'); // https://example.com/#new-hash
 *
 */
export function useHash() {
  const [hash, setHash] = useState(getCurrentHash);

  const onHashChange = useCallback(() => {
    setHash(getCurrentHash);
  }, []);

  useEvent('hashchange', onHashChange);

  const _setHash = useCallback(
    (newHash: string) => {
      if (newHash !== hash) {
        window.location.hash = newHash;
      }
    },
    [hash],
  );

  return {
    hash,
    setHash: _setHash,
  };
}
