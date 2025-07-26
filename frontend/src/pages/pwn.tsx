import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import axios from "@/lib/axios";

const PwnPage = () => {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const [teamChecked, setTeamChecked] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

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

  if (!authChecked || !loggedIn || !teamChecked) return null;
  if (!hasTeam && role !== "admin") return null;

  return (
    <main className="bg-muted flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h1 className="text-3xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">
        Choose a category
      </h1>
    </main>
  );
};

export default PwnPage;
