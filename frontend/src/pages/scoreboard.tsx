import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useCTFStatus } from "@/hooks/use-ctf-status";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import Head from "next/head";

export default function ScoreboardPage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const { getSiteName } = useSiteConfig();
  const { ctfStatus, loading: ctfLoading } = useCTFStatus();

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

  // Show loading state while CTF status is being checked
  if (ctfLoading) {
    return (
      <>
        <Head>
          <title>{getSiteName()}</title>
        </Head>
        <div className="bg-muted flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 dark:border-cyan-400 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading CTF status...</p>
          </div>
        </div>
      </>
    );
  }

  // Show message if CTF hasn't started
  if (ctfStatus?.status === 'not_started') {
    return (
      <>
        <Head>
          <title>{getSiteName()}</title>
        </Head>
        <div className="bg-muted flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md border-orange-200 dark:border-orange-800">
            <div className="p-6 text-center">
              <Clock className="mx-auto h-12 w-12 text-orange-500 dark:text-orange-400 mb-4" />
              <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Scoreboard Not Available Yet
              </h2>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                The scoreboard will be available once the CTF starts.
              </p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  // Show message if CTF has ended
  if (ctfStatus?.status === 'ended') {
    return (
      <>
        <Head>
          <title>{getSiteName()}</title>
        </Head>
        <div className="bg-muted flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md border-orange-200 dark:border-orange-800">
            <div className="p-6 text-center">
              <Clock className="mx-auto h-12 w-12 text-orange-500 dark:text-orange-400 mb-4" />
              <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">
                CTF Has Ended
              </h2>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                The scoreboard shows the final results from the completed CTF.
              </p>
            </div>
          </Card>
        </div>
      </>
    );
  }

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
