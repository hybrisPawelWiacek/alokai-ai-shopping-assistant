import type { HTMLAttributes } from 'react';

import { titleCodes } from '@/config/address-data';
import type { SfAddress } from '@/types';

export interface AddressProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Address data to display
   */
  address: SfAddress;
}

export default function Address({ address, ...rest }: AddressProps) {
  const { address1, address2, city, firstName, lastName, phoneNumber, postalCode, state, titleCode } = address;
  const titleCodeLabel = titleCodes.find((code) => code.value === titleCode)?.label;
  const nameLine = [titleCodeLabel, firstName, lastName].filter(Boolean).join(' ');
  const streetLine = [address1, address2].filter(Boolean).join(' ');
  const cityLine = [city && `${city},`, state, postalCode].filter(Boolean).join(' ');

  return (
    <address data-testid="saved-address" {...rest}>
      <div className="font-medium" data-testid="saved-name">
        {nameLine}
      </div>
      <div data-testid="saved-phone">{phoneNumber}</div>
      <div data-testid="saved-street">{streetLine}</div>
      <div data-testid="saved-city">{cityLine}</div>
    </address>
  );
}
