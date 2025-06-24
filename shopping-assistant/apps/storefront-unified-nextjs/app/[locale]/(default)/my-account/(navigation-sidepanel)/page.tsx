import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function MyAccountPage() {
  const t = useTranslations('MyAccountPage');

  return (
    <div className="hidden lg:block">
      <p className="my-6 px-4 font-bold typography-headline-4">{t('heading')}</p>
      <Image
        alt={t('heading')}
        className="mx-auto mb-6 mt-10"
        height={192}
        src="/images/my-account.svg"
        unoptimized
        width={192}
      />
      <h2 className="mb-1 text-center font-semibold typography-headline-2">{t('heading2')}</h2>
      <p className="text-center">{t('paragraph')}</p>
    </div>
  );
}
