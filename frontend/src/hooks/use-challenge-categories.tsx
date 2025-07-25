// hooks/use-challenge-categories.ts
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { ChallengeCategory } from "@/models/ChallengeCategory";

export function useChallengeCategories(enabled: boolean) {
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    let interval: number;

    const fetchCategories = async () => {
      try {
        const res = await axios.get<ChallengeCategory[]>("/api/challenge-categories");
        if (isMounted) {
          setCategories(res.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError("Failed to fetch categories");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategories();
    interval = window.setInterval(fetchCategories, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [enabled]);

  return { categories, loading, error };
}
