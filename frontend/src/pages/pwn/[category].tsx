import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCTFStatus } from "@/hooks/use-ctf-status";
import CategoryContent from "@/components/pwn/CategoryContent";
import { Challenge } from "@/models/Challenge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import Head from "next/head";
import axios from "@/lib/axios";

export default function CategoryPage() {
  const router = useRouter();
  const { category } = router.query;
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const { getSiteName } = useSiteConfig();
  const { t } = useLanguage();
  const { ctfStatus, loading: ctfLoading } = useCTFStatus();

  const cat = Array.isArray(category) ? category[0] : category;

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [teamChecked, setTeamChecked] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    }
  }, [authChecked, loggedIn, router]);

  useEffect(() => {
    if (authChecked && loggedIn) {
      axios.get("/api/me").then(res => {
        setRole(res.data.role);
        if (res.data.teamId) {
          setHasTeam(true);
        } else {
          setHasTeam(false);
          if (res.data.role !== "admin") {
            router.replace("/team");
          }
        }
        setTeamChecked(true);
      }).catch(() => {
        router.replace("/login");
      });
    }
  }, [authChecked, loggedIn, router]);

  const fetchChallenges = useCallback(async () => {
    if (!authChecked || !loggedIn || (!hasTeam && role !== "admin") || !cat) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<Challenge[]>(`/api/challenges/category/${cat}`);
      setChallenges(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load challenges');
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, [authChecked, loggedIn, hasTeam, role, cat]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  if (!authChecked || !loggedIn || !teamChecked) return null;
  if (!hasTeam && role !== "admin") return null;
  if (!cat) {
    return <div>Invalid category</div>;
  }
  if (loading) {
    return <div>Loading challenges...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  // CTF Status Blocking - Show message when CTF hasn't started
  if (!ctfLoading && ctfStatus.status === 'not_started') {
    return (
      <>
        <Head>
          <title>{getSiteName()} - {cat}</title>
        </Head>
        <main className="bg-muted flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <CardTitle className="text-2xl text-blue-600">
                {t('ctf_not_started') || 'CTF Not Started'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('ctf_not_started_challenges_message') || 'Challenges are not yet available. Please wait for the CTF to start.'}
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  // CTF Status Blocking - Show message when CTF has ended
  if (!ctfLoading && ctfStatus.status === 'ended') {
    return (
      <>
        <Head>
          <title>{getSiteName()} - {cat}</title>
        </Head>
        <main className="bg-muted flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-orange-600" />
              <CardTitle className="text-2xl text-orange-600">
                {t('ctf_ended') || 'CTF Ended'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('ctf_ended_challenges_message') || 'The CTF has ended. Challenges are no longer available for submission.'}
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return <CategoryContent cat={cat} challenges={challenges} onChallengeUpdate={fetchChallenges} />;
}
