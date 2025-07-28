import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import ConfigurationContent from "@/components/admin/ConfigurationContent";
import { Config } from "@/models/Config";

export default function ConfigurationPage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();
  const [role, setRole] = useState("");
  const [configs, setConfigs] = useState<Config[]>([]);

  const fetchConfigs = () => {
    axios
      .get<Config[]>("/api/configs")
      .then((res) => setConfigs(res.data))
      .catch(() => setConfigs([]));
  };

  useEffect(() => {
    checkAuth();
  }, []);

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
      fetchConfigs();
    }
  }, [authChecked, loggedIn, role, router]);

  if (!authChecked) return null;
  if (!loggedIn || role !== "admin") return null;

  return (
    <ConfigurationContent
      configs={configs}
      onRefresh={fetchConfigs}
    />
  );
} 