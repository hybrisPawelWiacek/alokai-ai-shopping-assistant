import { lookup } from 'node:dns/promises';
import { networkInterfaces } from 'node:os';

const isDnsError = (error: unknown): error is { code: string; hostname?: string } =>
  !!error && typeof error === 'object' && 'code' in error;

export async function testEtcHosts(listOfStoresDomains: string[]): Promise<void> {
  const localIps = Object.values(networkInterfaces()).flatMap((networInterface) => {
    if (!networInterface) return [];
    return networInterface.map((net) => net.address);
  });

  try {
    const resolvedStores = await Promise.all(
      listOfStoresDomains.map((storeUrl) => lookup(storeUrl)),
    );
    resolvedStores.forEach(async (ip, index) => {
      if (!localIps.includes(ip.address)) {
        console.warn(
          `WARNING!!!: ${ip.address} (${listOfStoresDomains[index]}) is not the same as (localhost)! Ensure that you did add the store url into the /etc/hosts!`,
        );
      }
    });
  } catch (error) {
    if (isDnsError(error) && error.code === 'ENOTFOUND') {
      console.warn(
        `
WARNING!!!: The hostname "${error.hostname}" Does not resolve to the same IP as "localhost"!
Please ensure that all multistore urls are mapped in /etc/hosts!`,
      );

      return;
    }
    console.warn('An error occured while testing /etc/hosts entries');
    console.warn(error);
    console.warn('The multistore dev environment will continue but you may experience problems!');
    console.warn('Please ensure that you did add stores urls into the /etc/hosts!');
  }
}
