import Head from 'next/head';
import Image from 'next/image';
import AnimatedText from './AnimatedText';

interface IndexContentProps {
  darkMode: boolean;
}

const IndexContent = ({ darkMode }: IndexContentProps) => {
  return (
    <>
      <Head>
        <title>pwnthemall</title>
      </Head>
      <main className="flex flex-col items-center justify-center text-center min-h-screen px-6">
        <Image
          src="/logo-no-text.png"
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
};

export default IndexContent;
