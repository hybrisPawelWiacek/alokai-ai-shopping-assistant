import { type PropsWithStyle, SfButton, SfIconCancel, SfIconSearch, SfInput } from '@storefront-ui/react';
import classNames from 'classnames';

import Form from '@/components/ui/form';
import { redirect } from '@/config/navigation';

export interface SearchProps extends PropsWithStyle {
  /**
   * Placeholder text for the search input
   */
  placeholder: string;
}

export default function Search({ className, placeholder }: SearchProps) {
  const handleSubmit = async (formData: FormData) => {
    'use server';
    const querySearch = formData.get('search') as string;

    if (querySearch) {
      redirect({
        pathname: '/search',
        query: { search: querySearch },
      });
    }
  };

  return (
    <Form action={handleSubmit} className={classNames('relative flex-col', className)} resetOnSubmit role="search">
      <SfInput
        aria-label="Search"
        className="peer md:placeholder-neutral-900"
        data-testid="input-field"
        name="search"
        placeholder={placeholder}
        slotSuffix={
          <>
            <SfButton
              className="absolute right-10 top-0 hover:bg-transparent focus-visible:outline focus-visible:outline-offset active:bg-transparent peer-placeholder-shown:hidden"
              data-testid="search-reset"
              type="reset"
              variant="tertiary"
            >
              <SfIconCancel className="fill-gray-500" />
            </SfButton>
            <SfButton
              className="absolute right-0 top-0 rounded-l-none"
              data-testid="search-submit"
              type="submit"
              variant="tertiary"
            >
              <SfIconSearch />
            </SfButton>
          </>
        }
        wrapperClassName="flex-1"
      />
    </Form>
  );
}
