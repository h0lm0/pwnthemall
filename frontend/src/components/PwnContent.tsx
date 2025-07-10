import Head from "next/head";

const PwnContent = () => {
  return (
    <>
      <Head>
        <title>pwnthemall - pwn zone</title>
      </Head>
      <main className="bg-muted flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-3xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">
          Welcome, challenger!
        </h1>
        <p className="text-lg">Prepare to pwn the challenges.</p>
      </main>
    </>
  );
};

export default PwnContent;