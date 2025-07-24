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
    checkAuth();
  }, []);

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
        setTeamChecked(true);
      });
    } else if (authChecked && !loggedIn) {
      setTeamChecked(true);
    }
  }, [authChecked, loggedIn, router]);

  if (!teamChecked) return null;
  if (loggedIn && !hasTeam) return null;

  return <IndexContent />;
}
