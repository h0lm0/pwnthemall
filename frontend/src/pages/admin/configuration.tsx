import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import ConfigurationContent from "@/components/admin/ConfigurationContent";
import { Config } from "@/models";

export default function ConfigurationPage() {
  const { loading, isAdmin } = useAdminAuth();
  const [configs, setConfigs] = useState<Config[]>([]);

  const fetchConfigs = () => {
    axios
      .get<Config[]>("/api/configs")
      .then((res) => setConfigs(res.data))
      .catch(() => setConfigs([]));
  };

  useEffect(() => {
    if (isAdmin) {
      fetchConfigs();
    }
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  return (
    <ConfigurationContent
      configs={configs}
      onRefresh={fetchConfigs}
    />
  );
} 