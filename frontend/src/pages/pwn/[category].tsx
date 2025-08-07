import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCTFStatus } from "@/hooks/use-ctf-status";
import CategoryContent from "@/components/pwn/CategoryContent";
import { Challenge } from "@/models/Challenge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
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

  useEffect(() => {
    // Listen to websocket events via NotificationContext custom event bus
    const handler = (e: any) => {
      try {
        const data = e?.detail ?? (typeof e?.data === 'string' ? JSON.parse(e.data) : e?.data);
        if (data && data.event === 'team_solve') {
          console.log('[TeamSolve] received event', data, 'refreshing challenges for category', cat);
          // Try to resolve challenge name from current list
          const solved = challenges?.find((c) => c.id === data.challengeId);
          const label = solved?.name ? `${solved.name}` : `#${data.challengeId}`;
          toast.success(`Team solved: ${label} (+${data.points})`);
          fetchChallenges();
        }
      } catch (err) {
        console.warn('[TeamSolve] failed to parse event', err);
      }
    };

    window.addEventListener?.('team-solve', handler as EventListener);
    return () => {
      window.removeEventListener?.('team-solve', handler as EventListener);
    };
  }, [fetchChallenges, cat, challenges]);

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

  // CTF Status Blocking - Redirect when CTF hasn't started
  if (!ctfLoading && ctfStatus.status === 'not_started') {
    router.replace('/');
    return null;
  }

  return (
    <>
      <Head>
        <title>{getSiteName()}</title>
      </Head>
      <CategoryContent cat={cat} challenges={challenges} onChallengeUpdate={fetchChallenges} ctfStatus={ctfStatus} ctfLoading={ctfLoading} />
    </>
  );
}
