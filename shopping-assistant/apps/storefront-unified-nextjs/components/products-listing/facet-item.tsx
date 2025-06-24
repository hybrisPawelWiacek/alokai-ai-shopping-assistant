'use client';
import { SfCheckbox, SfChip, SfCounter, SfListItem, SfRadio, SfThumbnail } from '@storefront-ui/react';
import type { CSSProperties } from 'react';

import type { SfFacetItem } from '@/types';

export interface FacetItemProps extends SfFacetItem {
  /**
   * Function to call when the item is clicked
   */
  onItemClick: () => void;
  /**
   * Whether the item is selected
   */
  selected: boolean;
}

export function SizeItem({ label, onItemClick, selected }: FacetItemProps) {
  return (
    <SfChip
      className="md:sf-chip-sm h-10 text-center text-sm uppercase md:h-8"
      inputProps={{
        checked: selected,
        onChange: onItemClick,
      }}
    >
      <span className="leading-4" data-testid="size-chip">
        {label}
      </span>
    </SfChip>
  );
}

export function ColorItem({ label, onItemClick, productCount, selected, value }: FacetItemProps) {
  return (
    <SfListItem
      as="label"
      className="sf-list-item max-md:py-4"
      data-testid="filter-color-item"
      selected={selected}
      size="sm"
      slotPrefix={
        <SfChip
          className="!p-0.5"
          inputProps={{
            checked: selected,
            onChange: onItemClick,
          }}
          size="sm"
          slotPrefix={
            <SfThumbnail
              className="sf-thumbnail"
              size="sm"
              style={{ '--color': value.toLowerCase() } as CSSProperties}
            />
          }
          square
        />
      }
    >
      <span className="flex items-center gap-2">
        <span className="text-base capitalize md:text-sm" data-testid="color-list-item-menu-label">
          {label}
        </span>
        {typeof productCount === 'number' && productCount > -1 && (
          <SfCounter className="font-normal md:text-sm" data-testid="list-item-menu-counter">
            {productCount}
          </SfCounter>
        )}
      </span>
    </SfListItem>
  );
}

export function RadioItem({ label, onItemClick, productCount, selected, value }: FacetItemProps) {
  return (
    <SfListItem
      as="label"
      disabled={productCount === 0}
      key={value}
      selected={selected}
      slotPrefix={
        <SfRadio
          checked={selected}
          className="flex items-center"
          disabled={productCount === 0}
          onChange={() => undefined}
          onClick={onItemClick}
          value={value}
        />
      }
    >
      <p>
        <span className="mr-2 text-sm">{label}</span>
        <SfCounter size="sm">{productCount}</SfCounter>
      </p>
    </SfListItem>
  );
}

export function CheckboxItem({ label, onItemClick, productCount, selected, value }: FacetItemProps) {
  return (
    <SfListItem
      as="label"
      disabled={productCount === 0}
      key={value}
      selected={selected}
      slotPrefix={
        <SfCheckbox
          checked={selected}
          className="flex items-center"
          disabled={productCount === 0}
          onChange={onItemClick}
          value={value}
        />
      }
    >
      <p>
        <span className="mr-2 text-sm">{label}</span>
        <SfCounter size="sm">{productCount}</SfCounter>
      </p>
    </SfListItem>
  );
}
