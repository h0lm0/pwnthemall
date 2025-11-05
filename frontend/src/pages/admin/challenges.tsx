import { useEffect, useState } from "react"
import axios from "@/lib/axios";
import { useAdminAuth } from "@/hooks/use-admin-auth"
import ChallengesContent from "@/components/admin/ChallengesContent"
import { Challenge } from "@/models"

export default function ChallengesPage() {
  const { loading, isAdmin } = useAdminAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([])

  const fetchChallenges = () => {
    axios
      .get<Challenge[]>("/api/admin/challenges")
      .then((res) => setChallenges(res.data))
      .catch(() => setChallenges([]))
  }

  useEffect(() => {
    if (isAdmin) {
      fetchChallenges()
    }
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  return (
    <ChallengesContent
      challenges={challenges}
      onRefresh={fetchChallenges}
    />
  )
}
