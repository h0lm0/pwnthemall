import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext"
import ChallengesContent from "@/components/admin/ChallengesContent"
import { Challenge } from "@/models/Challenge"

export default function ChallengesPage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const [role, setRole] = useState("");
  const [challenges, setChallenges] = useState<Challenge[]>([])

  const fetchChallenges = () => {
    axios
      .get<Challenge[]>("/api/challenges/admin/all")
      .then((res) => setChallenges(res.data))
      .catch(() => setChallenges([]))
  }

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authChecked && loggedIn) {
      axios
        .get("/api/me")
        .then((res) => setRole(res.data.role))
        .catch(() => setRole(""));
    }
  }, [authChecked, loggedIn]);

  useEffect(() => {
    if (!authChecked) return;
    if (!loggedIn) {
      router.replace("/login");
    } else if (role && role !== "admin") {
      router.replace("/pwn");
    } else if (role === "admin") {
      fetchChallenges()
    }
  }, [authChecked, loggedIn, role, router]);

  if (!authChecked) return null;
  if (!loggedIn || role !== "admin") return null;

  return (
    <ChallengesContent
      challenges={challenges}
      onRefresh={fetchChallenges}
    />
  )
}
