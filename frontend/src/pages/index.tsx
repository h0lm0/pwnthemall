import Head from 'next/head';
import Image from 'next/image';
import AnimatedText from '../components/AnimatedText';
import { useEffect, useState } from 'react';

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.body.classList.contains('dark-mode'));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>pwnthemall</title>
      </Head>
      <main className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-4rem)] px-6">
        <Image
          src="/logo.png"
          alt="CTF logo"
          className="opacity-100"
          width={180}
          height={180}
          priority
        />
        <p className={`text-xl md:text-2xl font-medium mb-8 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
          <AnimatedText text="will you pwn it ?" delay={150} />
        </p>

      </main>
    </>
  );
}
