import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext"
import ChallengeCategoriesContent from "@/components/admin/ChallengeCategoriesContent"
import { ChallengeCategory } from "@/models/ChallengeCategory"



export default function ChallengeCategoriesPage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const [role, setRole] = useState("");
  const [challengeCategories, setChallengeCategories] = useState<ChallengeCategory[]>([])

  const fetchChallengeCategories = () => {
    axios
      .get<ChallengeCategory[]>("/api/challenge-categories")
      .then((res) => setChallengeCategories(res.data))
      .catch(() => setChallengeCategories([]))
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
      fetchChallengeCategories()
    }
  }, [authChecked, loggedIn, role, router]);

  if (!authChecked) return null;
  if (!loggedIn || role !== "admin") return null;

  return (
    <ChallengeCategoriesContent
      challengeCategories={challengeCategories}
      onRefresh={fetchChallengeCategories}
    />
  )
}
