import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import ProfileHeader from "../components/profile-header";
import ProfileContent from "../components/profile-content";
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
    return <Loader/>;
  }

  if (!loggedIn) {
    return null;
  }

  return (
    <div className="space-y-6 px-4 py-10 bg-muted min-h-screen">
      <ProfileHeader />
      <ProfileContent />
    </div>
  );
}
