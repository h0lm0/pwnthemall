import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import CategoryContent from "@/components/pwn/CategoryContent";
import { Challenge } from "@/models/Challenge";
import axios from "axios";

export default function CategoryPage() {
  const router = useRouter();
  const { category } = router.query;
  const { loggedIn, checkAuth, authChecked } = useAuth();

  const cat = Array.isArray(category) ? category[0] : category;

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [teamChecked, setTeamChecked] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
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
        if (res.data.teamId) {
          setHasTeam(true);
        } else {
          router.replace("/team");
        }
        setTeamChecked(true);
      }).catch(() => {
        router.replace("/login");
      });
    }
  }, [authChecked, loggedIn, router]);

  const fetchChallenges = useCallback(async () => {
    if (!authChecked || !loggedIn || !hasTeam || !cat) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<Challenge[]>(`/api/challenges/category/${cat}`);
      setChallenges(response.data || []);
    } catch (err: any) {
      console.error('Error fetching challenges:', err);
      setError(err.response?.data?.error || 'Failed to load challenges');
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, [authChecked, loggedIn, hasTeam, cat]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  if (!authChecked || !loggedIn || !teamChecked) return null;
  if (!hasTeam) return null;
  if (!cat) {
    return <div>Invalid category</div>;
  }
  if (loading) {
    return <div>Loading challenges...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  return <CategoryContent cat={cat} challenges={challenges} onChallengeUpdate={fetchChallenges} />;
}
