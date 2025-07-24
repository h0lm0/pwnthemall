import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import axios from "@/lib/axios";
import IndexContent from '@/components/IndexContent';

export default function Home() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const [teamChecked, setTeamChecked] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);

  useEffect(() => {
    if (!authChecked) {
      checkAuth();
    }
  }, [authChecked, checkAuth]);

  useEffect(() => {
    if (authChecked && loggedIn && !teamChecked) {
      axios.get("/api/me")
        .then(res => {
          if (res.data.teamId) {
            setHasTeam(true);
          } else {
            router.replace("/team");
          }
        })
        .catch(() => {
          setTeamChecked(true);
        })
        .finally(() => {
          setTeamChecked(true);
        });
    } else if (authChecked && !loggedIn) {
      setTeamChecked(true);
    }
  }, [authChecked, loggedIn, teamChecked, router]);

  if (!teamChecked) return null;
  if (loggedIn && !hasTeam) return null;

  return <IndexContent />;
}
