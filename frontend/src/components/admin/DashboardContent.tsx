import Head from "next/head";
import { useSiteConfig } from "@/context/SiteConfigContext";

interface DashboardContentProps {

}

export default function DashboardContent({
}: DashboardContentProps) {
    const { getSiteName } = useSiteConfig();
    
    return (
        <>
            <Head>
                <title>{getSiteName()}</title>
            </Head>
            <div className="bg-muted flex min-h-screen items-center justify-center">
                <h1 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                    Administration page
                </h1>
            </div>
        </>
    );
};
