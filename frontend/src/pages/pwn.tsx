import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

const PwnPage = () => {
  const router = useRouter();
  const { loggedIn, checkAuth, authChecked } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    }
  }, [authChecked, loggedIn, router]);

  if (!authChecked) return null;
  if (!loggedIn) return null;

  return (
    <main className="bg-muted flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h1 className="text-3xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">
        Choose a category
      </h1>
    </main>
  );
};

export default PwnPage;
