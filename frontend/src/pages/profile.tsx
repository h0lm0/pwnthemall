import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProductionProfileCard from "../components/ProductionProfileCard";
import { Loader } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    }
  }, [authChecked, loggedIn, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!loggedIn) {
    return null;
  }

  return <ProductionProfileCard />;
}
