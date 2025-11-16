// hooks/use-challenge-categories.ts
import { useEffect, useState, useCallback } from "react";
import axios from "@/lib/axios";
import { ChallengeCategory } from "@/models/ChallengeCategory";
import { useRealtimeUpdates } from "./use-realtime-updates";
import { useAuth } from "@/context/AuthContext";

export function useChallengeCategories(enabled: boolean) {
  const { loggedIn } = useAuth();
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get<ChallengeCategory[]>("/api/challenge-categories");
      setCategories(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    fetchCategories();
  }, [enabled, fetchCategories]);

  // Listen for real-time updates via WebSocket
  useRealtimeUpdates((event) => {
    if (event.event === 'challenge-category') {
      console.log('Category update received, refreshing categories...');
      fetchCategories();
    }
  }, loggedIn);

  return { categories, loading, error };
}
