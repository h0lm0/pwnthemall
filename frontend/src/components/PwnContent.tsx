import Head from "next/head";

interface PwnContentProps {
  darkMode: boolean;
}

const PwnContent = ({ darkMode }: PwnContentProps) => {
  return (
    <>
      <Head>
        <title>pwnthemall - pwn zone</title>
      </Head>
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 text-center">
        <h1 className={`text-3xl font-bold mb-4 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`}>
          Welcome, challenger!
        </h1>
        <p className="text-lg">Prepare to pwn the challenges.</p>
      </main>
    </>
  );
};

export default PwnContent;
