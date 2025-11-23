import { useEffect, useState } from "react"
import axios from "@/lib/axios";
import { useAdminAuth } from "@/hooks/use-admin-auth"
import InstancesContent from "@/components/admin/InstancesContent"

export interface Instance {
  id: number;
  container: string;
  userId: number;
  username: string;
  teamId: number;
  teamName: string;
  challengeId: number;
  challengeName: string;
  category: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function InstancesPage() {
  const { loading, isAdmin } = useAdminAuth();
  const [instances, setInstances] = useState<Instance[]>([])

  const fetchInstances = () => {
    axios
      .get<Instance[]>("/api/admin/instances")
      .then((res) => setInstances(res.data))
      .catch(() => setInstances([]))
  }

  useEffect(() => {
    if (isAdmin) {
      fetchInstances()
    }
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  return (
    <InstancesContent
      instances={instances}
      onRefresh={fetchInstances}
    />
  )
}
