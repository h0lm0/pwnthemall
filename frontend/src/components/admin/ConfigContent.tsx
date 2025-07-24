import Head from "next/head";

interface ConfigContentProps {

}

export default function ConfigContent({
}: ConfigContentProps) {
    return (
        <>
            <Head>
                <title>pwnthemall - configuration</title>
            </Head>
            <div className="bg-muted flex min-h-screen items-center justify-center">
                <h1 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                    Configuration page
                </h1>
            </div>
        </>
    );
};
