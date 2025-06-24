'use client';

import { SfSelect } from '@storefront-ui/react';
import { useIsFetching } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useSfCartState } from '@/sdk/alokai-context';

import { useCostCenter } from '../hooks';

export default function CostCenterSelect() {
  const t = useTranslations('AddressFormFields');
  const checkoutB2BTranslate = useTranslations('CheckoutB2B');
  const [cart] = useSfCartState();
  const { costCenters, setCostCenter } = useCostCenter();
  const isCostCenterLoading = !!useIsFetching({ queryKey: ['costCenters'] });

  return (
    <div className="mb-4">
      <span className="text-sm font-medium text-neutral-900">{checkoutB2BTranslate('costCenter')}</span>
      <SfSelect
        autoComplete="cost-center"
        data-testid="cost-center-select"
        disabled={isCostCenterLoading || setCostCenter.isPending}
        name="cost-center"
        onChange={(event) => setCostCenter.mutate({ costCenterId: event.target.value })}
        placeholder={t('selectPlaceholder')}
        value={cart?.$custom?.costCenter?.code ?? ''}
      >
        {costCenters.data?.costCenters?.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </SfSelect>
    </div>
  );
}
