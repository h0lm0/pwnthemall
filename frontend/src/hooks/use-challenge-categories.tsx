import { useEffect, useState } from "react";
import axios from "axios";
import { ChallengeCategory } from "@/models/ChallengeCategory";

export function useChallengeCategories() {
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    interval = window.setInterval(fetchCategories, 5000); // 5 secondes

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { categories, loading, error };
} 