import type { Maybe, SfAddress, SfCreateAddressBody, SfCustomerAddress } from '@/types';

export const compareAddresses = (
  current?: Maybe<SfAddress>,
  address?: SfAddress | SfCreateAddressBody | SfCustomerAddress,
) =>
  !!(
    current &&
    address &&
    (Object.keys(current) as (keyof SfAddress)[]).every((key) => key === '$custom' || address[key] === current[key])
  );

export const findAddress = (addresses: SfCustomerAddress[], current?: Maybe<SfAddress>) =>
  current && addresses?.find((address) => compareAddresses(current, address));
