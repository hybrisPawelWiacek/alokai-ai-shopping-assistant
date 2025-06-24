import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('ReturnsPage');

  return {
    title: t('metaTitle'),
  };
}

export default function ReturnsPage() {
  const t = useTranslations('ReturnsPage');

  return (
    <div className="flex flex-col">
      <p className="my-6 hidden px-4 font-bold typography-headline-4 lg:block">{t('heading')}</p>
      <Image
        alt={t('heading')}
        className="mx-auto my-14 mb-6 lg:my-0"
        height={192}
        src="/images/returns.svg"
        unoptimized
        width={192}
      />
      <h2 className="text-center font-semibold typography-headline-2">{t('heading2')}</h2>
    </div>
  );
}
