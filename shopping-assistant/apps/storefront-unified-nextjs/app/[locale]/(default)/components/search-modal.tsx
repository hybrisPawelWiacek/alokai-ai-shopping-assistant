'use client';
import { SfIconSearch } from '@storefront-ui/react';
import { useQueryState } from 'nuqs';
import type { PropsWithChildren } from 'react';

import { NavbarTopButton } from '@/components/navigations/navbar-top';
import Modal, { ModalClose } from '@/components/ui/modal';

export interface SearchModalProps extends PropsWithChildren {
  /**
   * Placeholder text for the search input
   */
  heading: string;
}

export default function SearchModal({ children, heading }: SearchModalProps) {
  const [_, setQueryParams] = useQueryState('search-modal');

  return (
    <>
      <NavbarTopButton
        aria-label={heading}
        className="md:hidden"
        onClick={() => setQueryParams('true')}
        slotPrefix={<SfIconSearch />}
        square
      />
      <Modal aria-labelledby="search-modal-title" className="z-50 h-full w-full" queryParamTrigger="search-modal">
        <header className="mb-4">
          <h3
            className="absolute left-6 top-4 mb-4 font-semibold text-neutral-900 typography-headline-4 md:typography-headline-3"
            id="search-modal-title"
          >
            {heading}
          </h3>
          <ModalClose />
        </header>
        {children}
      </Modal>
    </>
  );
}
