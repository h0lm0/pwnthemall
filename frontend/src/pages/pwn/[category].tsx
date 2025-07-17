import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

export default function CategoryPage() {
  const router = useRouter();
  const { category } = router.query;
  const { loggedIn, checkAuth, authChecked } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !loggedIn) {
      router.replace("/login");
    }
  }, [authChecked, loggedIn, router]);

  if (!authChecked || !loggedIn) return null;

  const cat = Array.isArray(category) ? category[0] : category;
  if (!cat) return null;

  return (
    <main className="bg-muted flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h1 className="text-3xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">
        Category: {cat}
      </h1>
      {/* Ajoute ici le contenu spécifique à la catégorie si besoin */}
    </main>
  );
}
