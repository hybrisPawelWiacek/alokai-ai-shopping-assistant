import type { PropsWithStyle, SfButtonProps } from '@storefront-ui/react';
import { SfButton, SfIconAdd, SfIconRemove } from '@storefront-ui/react';
import { clamp } from '@storefront-ui/shared';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import type { ChangeEvent, PropsWithChildren } from 'react';
import { useEffect, useId, useState } from 'react';
import { useCounter } from 'react-use';

export interface QuantitySelectorProps extends PropsWithChildren, PropsWithStyle {
  /**
   * Disable the quantity selector
   */
  disabled?: boolean;
  /**
   * Maximum value of the quantity selector
   */
  maxValue?: number;
  /**
   * Minimum value of the quantity selector
   */
  minValue?: number;
  /**
   * On blur event handler
   */
  onBlur?: (value: number) => void;
  /**
   * On change event handler
   */
  onChange?: (value: number) => void;
  /**
   * Show placeholder when the quantity selector is disabled
   */
  showPlaceholder?: boolean;
  /**
   * Size of the quantity selector
   */
  size?: SfButtonProps['size'];
  /**
   * Value of the quantity selector
   */
  value: number;
}

export default function QuantitySelector({
  children,
  className,
  disabled,
  maxValue = Number.POSITIVE_INFINITY,
  minValue = 1,
  onBlur,
  onChange,
  showPlaceholder,
  size,
  value,
  ...rest
}: QuantitySelectorProps) {
  const t = useTranslations('QuantitySelector');

  // Proxy has to be done, useCounter does not allow clear input and write number by user, always force minValue
  const positiveNumber = (numberValue: number) => (numberValue >= 0 ? numberValue : 1);
  const [innerValue, setInnerValue] = useState<string>(positiveNumber(value).toString());
  const [innerQuantity, { dec, inc, set }] = useCounter(
    positiveNumber(parseInt(innerValue, 10)),
    positiveNumber(maxValue),
    minValue,
  );

  const inputId = useId();

  const passOnlyNumber = (incommingNumber: number | string) => {
    return Number.isNaN(incommingNumber) ? value : (incommingNumber as number);
  };

  useEffect(() => {
    setInnerValue(innerQuantity.toString());
    if (value !== innerQuantity) onChange?.(innerQuantity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [innerQuantity]);

  useEffect(() => {
    set(value);
    setInnerValue(value.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const rangeOnlyNumber = (incommingNumber: string) => {
    return clamp(Number.parseInt(incommingNumber, 10), minValue, positiveNumber(maxValue));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInnerValue(event.target.value);
  };

  const handleBlur = (event: ChangeEvent<HTMLInputElement>) => {
    const changeValue = rangeOnlyNumber(event.target.value);
    const finalValue = passOnlyNumber(changeValue);
    set(finalValue);
    setInnerValue(finalValue.toString());
    onBlur?.(finalValue);
  };

  return (
    <div
      className={classNames('inline-flex flex-col items-center', className)}
      data-testid="quantity-selector"
      {...rest}
    >
      <div
        className={classNames('flex h-full w-full rounded-md border border-neutral-300', {
          'bg-disabled-100': disabled,
        })}
      >
        <SfButton
          aria-controls={inputId}
          aria-label={t('quantitySelectorDecrease')}
          className={classNames('rounded-r-none', { '!p-3': size === 'lg' })}
          data-testid="quantity-selector-decrease-button"
          disabled={disabled || +innerQuantity <= minValue}
          onClick={() => dec()}
          size={size}
          square
          type="button"
          variant="tertiary"
        >
          <SfIconRemove />
        </SfButton>
        <input
          aria-label={t('quantitySelector')}
          className={classNames(
            '[&::-webkit-inner-spin-button]:display-none [&::-webkit-outer-spin-button]:display-none mx-2 !w-8 flex-1 appearance-none bg-transparent text-center font-medium [-moz-appearance:textfield] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-offset disabled:placeholder-disabled-900 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none',
            { 'text-disabled-700': disabled },
          )}
          data-testid="quantity-selector-input"
          disabled={disabled}
          id={inputId}
          max={maxValue}
          min={minValue}
          onBlur={handleBlur}
          onChange={handleChange}
          placeholder="-"
          role="spinbutton"
          type="number"
          value={showPlaceholder ? undefined : innerValue}
        />
        <SfButton
          aria-controls={inputId}
          aria-label={t('quantitySelectorIncrease')}
          className={classNames('rounded-l-none', { '!p-3': size === 'lg' })}
          data-testid="quantity-selector-increase-button"
          disabled={disabled || +innerQuantity >= maxValue}
          onClick={() => inc()}
          size={size}
          square
          type="button"
          variant="tertiary"
        >
          <SfIconAdd />
        </SfButton>
      </div>
      {children}
    </div>
  );
}
