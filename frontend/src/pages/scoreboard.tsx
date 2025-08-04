import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Head from "next/head";

export default function ScoreboardPage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const { getSiteName } = useSiteConfig();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    }
  }, [authChecked, loggedIn, router]);

  if (!authChecked) return null;
  if (!loggedIn) return null;

  return (
    <>
      <Head>
        <title>{getSiteName()}</title>
      </Head>
    <div className="bg-muted flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
        Scoreboard page
      </h1>
    </div>
    </>
  );
}
