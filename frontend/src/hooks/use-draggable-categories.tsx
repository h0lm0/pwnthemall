import { useEffect, useState, useCallback } from "react";
import { ChallengeCategory } from "@/models/ChallengeCategory";
import { useChallengeCategories } from "./use-challenge-categories";

const CATEGORY_ORDER_KEY = "category-order";

export function useDraggableCategories(enabled: boolean) {
  const { categories: originalCategories, loading, error } = useChallengeCategories(enabled);
  const [orderedCategories, setOrderedCategories] = useState<ChallengeCategory[]>([]);

  // Load saved order from localStorage
  const loadSavedOrder = useCallback(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_ORDER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // Save order to localStorage
  const saveOrder = useCallback((categoryIds: number[]) => {
    try {
      localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(categoryIds));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Sort categories based on saved order
  const sortCategories = useCallback((categories: ChallengeCategory[]) => {
    const savedOrder = loadSavedOrder();
    
    if (savedOrder.length === 0) {
      return categories; // No saved order, return original
    }

    // Create a map for quick lookup
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const ordered: ChallengeCategory[] = [];
    const unordered: ChallengeCategory[] = [];

    // First, add categories in the saved order
    savedOrder.forEach((id: number) => {
      const category = categoryMap.get(id);
      if (category) {
        ordered.push(category);
        categoryMap.delete(id); // Remove from map to avoid duplicates
      }
    });

    // Then add any new categories that weren't in the saved order
    categoryMap.forEach(category => {
      unordered.push(category);
    });

    return [...ordered, ...unordered];
  }, [loadSavedOrder]);

  // Update ordered categories when original categories change
  useEffect(() => {
    if (originalCategories.length > 0) {
      const sorted = sortCategories(originalCategories);
      setOrderedCategories(sorted);
    } else if (!loading) {
      // Clear ordered categories when there are no categories and not loading
      setOrderedCategories([]);
    }
  }, [originalCategories, sortCategories, loading]);

  // Function to reorder categories
  const reorderCategories = useCallback((newOrder: ChallengeCategory[]) => {
    setOrderedCategories(newOrder);
    const categoryIds = newOrder.map(cat => cat.id);
    saveOrder(categoryIds);
  }, [saveOrder]);

  return {
    categories: orderedCategories,
    loading,
    error,
    reorderCategories
  };
}
