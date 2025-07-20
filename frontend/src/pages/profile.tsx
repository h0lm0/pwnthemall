import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProfileHeader from "../components/profile-header";
import ProfileContent from "../components/profile-content";
import axios from "axios";

export default function ProfilePage() {
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
        router.replace("/login");
      });
    }
  }, [authChecked, loggedIn, router]);

  if (!authChecked || !loggedIn || !teamChecked) return null;
  if (!hasTeam) return null;

  return (
    <div className="space-y-6 px-4 py-10 bg-muted min-h-screen">
      <ProfileHeader />
      <ProfileContent />
    </div>
  );
}
