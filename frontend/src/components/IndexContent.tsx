import Head from 'next/head';
import Image from 'next/image';
import AnimatedText from './AnimatedText';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteConfig } from '@/context/SiteConfigContext';

const IndexContent = () => {
  const { t } = useLanguage();
  const { getSiteName, loading } = useSiteConfig();
  
  return (
    <>
      <Head>
        <title>{getSiteName()}</title>
      </Head>
      <main className="bg-muted flex flex-col items-center justify-center text-center min-h-screen px-6">
        <Image
          src="/logo-no-text.png"
          alt="CTF logo"
          className="opacity-100"
          width={180}
          height={180}
          priority
        />
        <p className="text-xl md:text-2xl font-medium mb-8 text-cyan-600 dark:text-cyan-400">
          <AnimatedText text={t('will_you_pwn_it')} delay={150} />
        </p>
      </main>
    </>
  );
};

export default IndexContent;
