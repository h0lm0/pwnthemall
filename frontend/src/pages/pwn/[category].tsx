import { useEffect, useState } from "react";
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    }
  }, [authChecked, loggedIn, router]);

  useEffect(() => {
    if (authChecked && loggedIn && cat) {
      axios
        .get<Challenge[]>(`/api/challenges/category/${cat}`)
        .then((res) => setChallenges(res.data))
        .catch(() => setChallenges([]));
    }
  }, [authChecked, loggedIn, cat]);

  if (!authChecked || !loggedIn || !cat) return null;

  return <CategoryContent cat={cat} challenges={challenges} />;
}
