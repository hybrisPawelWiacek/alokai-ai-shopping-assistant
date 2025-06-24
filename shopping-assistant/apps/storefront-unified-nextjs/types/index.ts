/* eslint-disable @typescript-eslint/no-explicit-any */
export * from 'storefront-middleware/types';
import type {
  Formats,
  MessageKeys,
  NamespaceKeys,
  NestedKeyOf,
  NestedValueOf,
  RichTranslationValues,
  useTranslations,
} from 'next-intl';
import type { ReactElement, ReactNodeArray } from 'react';

type DropFirst<T extends unknown[]> = T extends [any, ...infer U] ? U : never;

/**
 * If you are using `useTranslations` from `next-intl` and you want to use it in a way that is not type-safe,
 * you can use this type to avoid TypeScript errors.
 *
 * @example
 * ```ts
 * const t = useTranslations("Footer") as UnsafeUseTranslations<"Footer">;
 * t("bottomLinks.privacyPolicy") // intellisense still works in the IDE
 * t(`bottomLinks.${someStringVariable}`) // no intellisense, but no TypeScript error
 * ```
 */
export interface UnsafeUseTranslations<
  NestedKey extends NamespaceKeys<IntlMessages, NestedKeyOf<IntlMessages>>,
  TTranslate extends ReturnType<typeof useTranslations<NestedKey>> = ReturnType<typeof useTranslations<NestedKey>>,
> {
  (...params: Parameters<TTranslate>): string;
  (key: string, ...params: DropFirst<Parameters<TTranslate>>): string;
  rich<
    TargetKey extends MessageKeys<
      NestedValueOf<
        {
          '!': IntlMessages;
        },
        NestedKey extends never ? '!' : `!.${NestedKey}`
      >,
      NestedKeyOf<
        NestedValueOf<
          {
            '!': IntlMessages;
          },
          NestedKey extends never ? '!' : `!.${NestedKey}`
        >
      >
    >,
  >(
    key: TargetKey,
    values?: RichTranslationValues,
    formats?: Partial<Formats>,
  ): ReactElement | ReactNodeArray | string;
}

export type Maybe<TType> = null | TType;
