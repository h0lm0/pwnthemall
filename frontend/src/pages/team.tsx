import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useLanguage } from "@/context/LanguageContext";

export default function TeamPage() {
  const { t } = useLanguage();
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const [teamChecked, setTeamChecked] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    } else if (authChecked && loggedIn) {
      axios.get("/api/me").then(res => {
        if (res.data.teamId) {
          setHasTeam(true);
          router.replace("/");
        } else {
          setHasTeam(false);
        }
        setTeamChecked(true);
      }).catch(() => {
        setTeamChecked(true);
      });
    }
  }, [authChecked, loggedIn, router]);

  if (!authChecked || !teamChecked) return null;
  if (!loggedIn) return null;
  if (hasTeam) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName, password: createPassword }),
      });
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error("Invalid server response. Please try again.");
      }
      if (!res.ok) throw new Error(data.error || "Failed to create team");
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: joinName, password: joinPassword }),
      });
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error("Invalid server response. Please try again.");
      }
      if (!res.ok) throw new Error(data.error || "Failed to join team");
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-2 py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-8">
          <CardTitle className="text-center text-3xl font-bold mb-2">{t('team')}</CardTitle>
          <p className="text-center text-muted-foreground mb-8">
            {t('team_access_required')}
          </p>
          {error && <div className="text-red-600 mb-4 text-center">{t(error)}</div>}
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            <form onSubmit={handleCreate} className="flex-1 min-w-[220px] space-y-3">
              <h2 className="text-xl font-semibold mb-2 text-center">{t('create_team')}</h2>
              <Input
                type="text"
                placeholder={t('team_name')}
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                required
                maxLength={32}
              />
              <Input
                type="password"
                placeholder={t('password')}
                value={createPassword}
                onChange={e => setCreatePassword(e.target.value)}
                required
                maxLength={72}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t('creating') : t('create')}
              </Button>
            </form>
            <form onSubmit={handleJoin} className="flex-1 min-w-[220px] space-y-3">
              <h2 className="text-xl font-semibold mb-2 text-center">{t('join_team')}</h2>
              <Input
                type="text"
                placeholder={t('team_name_or_id')}
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                required
                maxLength={32}
              />
              <Input
                type="password"
                placeholder={t('password')}
                value={joinPassword}
                onChange={e => setJoinPassword(e.target.value)}
                required
                maxLength={72}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t('joining') : t('join')}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 